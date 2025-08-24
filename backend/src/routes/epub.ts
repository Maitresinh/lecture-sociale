import express from 'express'
import multer from 'multer'
import { authenticate } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/asyncHandler'
import path from 'path'
import fs from 'fs/promises'
import AdmZip from 'adm-zip'
import { parseString } from 'xml2js'
import { promisify } from 'util'

const router = express.Router()
const prisma = new PrismaClient()
const parseXML = promisify(parseString)

// Configuration multer pour upload EPUB
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const epubDir = path.join(__dirname, '../../uploads/epub')
    try {
      await fs.mkdir(epubDir, { recursive: true })
      cb(null, epubDir)
    } catch (error) {
      cb(error, epubDir)
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    cb(null, `${timestamp}-${file.originalname}`)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/epub+zip' || path.extname(file.originalname) === '.epub') {
      cb(null, true)
    } else {
      cb(new Error('Seuls les fichiers EPUB sont acceptés'), false)
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
})

// Fonction pour extraire métadonnées EPUB
async function extractEpubMetadata(epubPath: string) {
  try {
    const zip = new AdmZip(epubPath)
    const entries = zip.getEntries()
    
    // Trouver container.xml
    const containerEntry = entries.find(entry => entry.entryName === 'META-INF/container.xml')
    if (!containerEntry) {
      throw new Error('Fichier container.xml non trouvé')
    }
    
    const containerXml = containerEntry.getData().toString('utf8')
    const containerParsed = await parseXML(containerXml)
    
    // Obtenir le chemin du .opf file
    const opfPath = containerParsed.container.rootfiles[0].rootfile[0].$['full-path']
    
    // Lire le .opf file
    const opfEntry = entries.find(entry => entry.entryName === opfPath)
    if (!opfEntry) {
      throw new Error('Fichier OPF non trouvé')
    }
    
    const opfXml = opfEntry.getData().toString('utf8')
    const opfParsed = await parseXML(opfXml)
    
    const metadata = opfParsed.package.metadata[0]
    
    // Extraire titre et auteur
    const title = metadata['dc:title'] ? metadata['dc:title'][0]._ || metadata['dc:title'][0] : 'Titre inconnu'
    const creator = metadata['dc:creator'] ? metadata['dc:creator'][0]._ || metadata['dc:creator'][0] : 'Auteur inconnu'
    const description = metadata['dc:description'] ? metadata['dc:description'][0]._ || metadata['dc:description'][0] : ''
    
    // Extraire la liste des chapitres du manifest
    const manifest = opfParsed.package.manifest[0].item
    const spine = opfParsed.package.spine[0].itemref
    
    const chapters = spine.map((item: any, index: number) => {
      const idref = item.$.idref
      const manifestItem = manifest.find((m: any) => m.$.id === idref)
      return {
        id: idref,
        href: manifestItem ? manifestItem.$.href : '',
        order: index + 1,
        title: `Chapitre ${index + 1}`
      }
    })
    
    return {
      title,
      author: creator,
      description,
      chapters,
      opfPath,
      totalChapters: chapters.length
    }
  } catch (error) {
    console.error('Erreur extraction métadonnées EPUB:', error)
    throw error
  }
}

// Upload et traitement d'un fichier EPUB
router.post('/upload', authenticate, upload.single('epub'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Aucun fichier EPUB fourni' })
  }

  try {
    const { title: customTitle, author: customAuthor, description: customDescription } = req.body
    
    // Extraire métadonnées du fichier EPUB
    const metadata = await extractEpubMetadata(req.file.path)
    
    // Créer l'entrée en base de données
    const book = await prisma.book.create({
      data: {
        title: customTitle || metadata.title,
        author: customAuthor || metadata.author,
        description: customDescription || metadata.description,
        filePath: req.file.path,
        fileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        totalChapters: metadata.totalChapters,
        epubMetadata: JSON.stringify({
          chapters: metadata.chapters,
          opfPath: metadata.opfPath
        }),
        uploadedBy: (req.user as any).id
      }
    })

    res.json({
      success: true,
      message: 'EPUB uploadé et traité avec succès',
      data: {
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description,
          totalChapters: book.totalChapters,
          fileSize: book.fileSize,
          createdAt: book.createdAt
        }
      }
    })
  } catch (error) {
    // Nettoyer le fichier en cas d'erreur
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path)
      } catch {}
    }
    
    console.error('Erreur traitement EPUB:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors du traitement du fichier EPUB',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}))

// Lire un chapitre d'un livre EPUB
router.get('/:bookId/chapter/:chapterIndex', authenticate, asyncHandler(async (req, res) => {
  const { bookId, chapterIndex } = req.params
  const chapterNum = parseInt(chapterIndex)

  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book || !book.filePath) {
    return res.status(404).json({ success: false, error: 'Livre non trouvé' })
  }

  try {
    const zip = new AdmZip(book.filePath)
    const metadata = JSON.parse(book.epubMetadata || '{}')
    
    if (!metadata.chapters || chapterNum >= metadata.chapters.length) {
      return res.status(404).json({ success: false, error: 'Chapitre non trouvé' })
    }

    const chapter = metadata.chapters[chapterNum]
    
    // Construire le chemin complet du chapitre
    const opfDir = path.dirname(metadata.opfPath)
    const chapterPath = opfDir ? `${opfDir}/${chapter.href}` : chapter.href
    
    const chapterEntry = zip.getEntry(chapterPath)
    if (!chapterEntry) {
      return res.status(404).json({ success: false, error: 'Contenu du chapitre non trouvé' })
    }

    const chapterContent = chapterEntry.getData().toString('utf8')

    res.json({
      success: true,
      data: {
        chapter: {
          index: chapterNum,
          id: chapter.id,
          title: chapter.title,
          content: chapterContent,
          href: chapter.href
        },
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          totalChapters: book.totalChapters
        },
        navigation: {
          hasPrevious: chapterNum > 0,
          hasNext: chapterNum < metadata.chapters.length - 1,
          previousIndex: chapterNum > 0 ? chapterNum - 1 : null,
          nextIndex: chapterNum < metadata.chapters.length - 1 ? chapterNum + 1 : null
        }
      }
    })
  } catch (error) {
    console.error('Erreur lecture chapitre EPUB:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la lecture du chapitre',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}))

// Obtenir la table des matières d'un livre EPUB
router.get('/:bookId/toc', authenticate, asyncHandler(async (req, res) => {
  const { bookId } = req.params

  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book || !book.epubMetadata) {
    return res.status(404).json({ success: false, error: 'Livre non trouvé' })
  }

  try {
    const metadata = JSON.parse(book.epubMetadata)
    
    res.json({
      success: true,
      data: {
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          totalChapters: book.totalChapters
        },
        tableOfContents: metadata.chapters.map((chapter: any, index: number) => ({
          index,
          id: chapter.id,
          title: chapter.title,
          href: chapter.href
        }))
      }
    })
  } catch (error) {
    console.error('Erreur table des matières:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la table des matières'
    })
  }
}))

export default router