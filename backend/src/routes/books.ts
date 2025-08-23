import express from 'express'
import multer from 'multer'
import path from 'path'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Configuration multer pour l'upload d'EPUBs et d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'epub') {
      cb(null, 'uploads/books/')
    } else if (file.fieldname === 'cover') {
      cb(null, 'uploads/covers/')
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'epub') {
      if (file.mimetype === 'application/epub+zip' || path.extname(file.originalname) === '.epub') {
        cb(null, true)
      } else {
        cb(new Error('Seuls les fichiers EPUB sont acceptés'))
      }
    } else if (file.fieldname === 'cover') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true)
      } else {
        cb(new Error('Seuls les fichiers image sont acceptés'))
      }
    } else {
      cb(new Error('Champ de fichier non reconnu'))
    }
  }
})

// Validation schemas
const createBookSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  author: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).optional(),
  totalPages: Joi.number().integer().min(1).optional()
})

// @desc    Obtenir tous les livres
// @route   GET /api/books
// @access  Private
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 20
  const search = req.query.search as string

  const where = search ? {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { author: { contains: search, mode: 'insensitive' } }
    ]
  } as any : {}

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where,
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        coverUrl: true,
        totalPages: true,
        createdAt: true,
        _count: {
          select: {
            sharedReadings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.book.count({ where })
  ])

  res.json({
    success: true,
    data: {
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
}))

// @desc    Obtenir un livre
// @route   GET /api/books/:id
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      sharedReadings: {
        where: {
          OR: [
            { isPublic: true },
            { createdBy: req.user.id },
            { participants: { some: { userId: req.user.id } } }
          ]
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          _count: {
            select: {
              participants: true
            }
          }
        }
      }
    }
  })

  if (!book) {
    return res.status(404).json({
      success: false,
      error: 'Livre non trouvé'
    })
  }

  res.json({
    success: true,
    data: book
  })
}))

// @desc    Ajouter un livre
// @route   POST /api/books
// @access  Private (Admin, Author, Translator)
router.post('/',
  authenticate,
  authorize('ADMIN', 'AUTHOR', 'TRANSLATOR'),
  upload.fields([
    { name: 'epub', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { error } = createBookSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    if (!files?.epub?.[0]) {
      return res.status(400).json({
        success: false,
        error: 'Le fichier EPUB est requis'
      })
    }

    const { title, author, description, totalPages } = req.body
    const epubFile = files.epub[0]
    const coverFile = files.cover?.[0]

    const bookData = {
      title,
      author,
      description,
      totalPages: totalPages ? parseInt(totalPages) : 0,
      epubUrl: `/uploads/books/${epubFile.filename}`,
      epubPath: epubFile.path,
      coverUrl: coverFile ? `/uploads/covers/${coverFile.filename}` : null
    }

    const book = await prisma.book.create({
      data: bookData
    })

    res.status(201).json({
      success: true,
      data: book
    })
  })
)

// @desc    Mettre à jour un livre
// @route   PUT /api/books/:id
// @access  Private (Admin only)
router.put('/:id',
  authenticate,
  authorize('ADMIN'),
  upload.fields([
    { name: 'cover', maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    const book = await prisma.book.findUnique({
      where: { id }
    })

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      })
    }

    const { title, author, description, totalPages } = req.body
    const coverFile = files?.cover?.[0]

    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (author !== undefined) updateData.author = author
    if (description !== undefined) updateData.description = description
    if (totalPages !== undefined) updateData.totalPages = parseInt(totalPages)
    if (coverFile) updateData.coverUrl = `/uploads/covers/${coverFile.filename}`

    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData
    })

    res.json({
      success: true,
      data: updatedBook
    })
  })
)

// @desc    Supprimer un livre
// @route   DELETE /api/books/:id
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sharedReadings: true
          }
        }
      }
    })

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      })
    }

    if (book._count.sharedReadings > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un livre utilisé dans des lectures partagées'
      })
    }

    await prisma.book.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Livre supprimé avec succès'
    })
  })
)

// @desc    Servir le fichier EPUB
// @route   GET /api/books/:id/epub
// @access  Private
router.get('/:id/epub', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      sharedReadings: {
        where: {
          OR: [
            { isPublic: true },
            { createdBy: userId },
            { participants: { some: { userId } } }
          ]
        }
      }
    }
  })

  if (!book) {
    return res.status(404).json({
      success: false,
      error: 'Livre non trouvé'
    })
  }

  // Vérifier que l'utilisateur a accès au livre
  if (book.sharedReadings.length === 0 && req.user.status !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    })
  }

  // Servir le fichier EPUB
  res.sendFile(path.resolve(book.epubPath))
}))

export default router