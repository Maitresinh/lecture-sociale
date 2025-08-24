import express from 'express'
import multer from 'multer'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'
import Joi from 'joi'
import bcrypt from 'bcryptjs'

const router = express.Router()
const prisma = new PrismaClient()

// Configuration multer pour l'upload de livres
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/books/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/epub+zip' || path.extname(file.originalname).toLowerCase() === '.epub') {
      cb(null, true)
    } else {
      cb(new Error('Seuls les fichiers EPUB sont autorisés'))
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
})

// @desc    Tableau de bord administrateur
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', 
  authenticate, 
  authorize('ADMIN'), 
  asyncHandler(async (req, res) => {
    const [
      totalUsers,
      totalBooks,
      totalSharedReadings,
      totalAnnotations,
      activeReadings,
      recentUsers,
      popularBooks,
      annotationsToday
    ] = await Promise.all([
      prisma.user.count(),
      prisma.book.count(),
      prisma.sharedReading.count(),
      prisma.annotation.count(),
      prisma.sharedReading.count({
        where: {
          endDate: {
            gte: new Date()
          }
        }
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      prisma.book.findMany({
        select: {
          id: true,
          title: true,
          author: true,
          _count: {
            select: {
              sharedReadings: true
            }
          }
        },
        orderBy: {
          sharedReadings: {
            _count: 'desc'
          }
        },
        take: 5
      }),
      prisma.annotation.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalBooks,
          totalSharedReadings,
          totalAnnotations,
          activeReadings,
          annotationsToday
        },
        recentUsers,
        popularBooks
      }
    })
  })
)

// @desc    Statistiques d'utilisation
// @route   GET /api/admin/stats
// @access  Private (Admin only)
router.get('/stats',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const period = req.query.period as string || '30' // jours
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Nouvelles inscriptions par jour
    const userRegistrations = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Array<{ date: Date, count: bigint }>

    // Annotations créées par jour
    const annotationsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM annotations 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Array<{ date: Date, count: bigint }>

    // Lectures partagées créées par jour
    const readingsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM shared_readings 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Array<{ date: Date, count: bigint }>

    // Distribution des statuts utilisateurs
    const usersByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Livres les plus annotés
    const mostAnnotatedBooks = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        _count: {
          select: {
            sharedReadings: {
              where: {
                annotations: {
                  some: {}
                }
              }
            }
          }
        }
      },
      orderBy: {
        sharedReadings: {
          _count: 'desc'
        }
      },
      take: 10
    })

    // Utilisateurs les plus actifs (par nombre d'annotations)
    const mostActiveUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: {
            annotations: true
          }
        }
      },
      orderBy: {
        annotations: {
          _count: 'desc'
        }
      },
      take: 10
    })

    res.json({
      success: true,
      data: {
        timeSeries: {
          userRegistrations: userRegistrations.map(item => ({
            date: item.date,
            count: Number(item.count)
          })),
          annotationsByDay: annotationsByDay.map(item => ({
            date: item.date,
            count: Number(item.count)
          })),
          readingsByDay: readingsByDay.map(item => ({
            date: item.date,
            count: Number(item.count)
          }))
        },
        distribution: {
          usersByStatus
        },
        rankings: {
          mostAnnotatedBooks,
          mostActiveUsers
        }
      }
    })
  })
)

// @desc    Obtenir les lectures partagées avec statistiques détaillées
// @route   GET /api/admin/shared-readings
// @access  Private (Admin only)
router.get('/shared-readings',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const status = req.query.status as string // 'active', 'ended', 'upcoming'

    let dateFilter = {}
    const now = new Date()

    if (status === 'active') {
      dateFilter = {
        startDate: { lte: now },
        endDate: { gte: now }
      }
    } else if (status === 'ended') {
      dateFilter = {
        endDate: { lt: now }
      }
    } else if (status === 'upcoming') {
      dateFilter = {
        startDate: { gt: now }
      }
    }

    const [sharedReadings, total] = await Promise.all([
      prisma.sharedReading.findMany({
        where: dateFilter,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              author: true,
              coverUrl: true
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          _count: {
            select: {
              participants: true,
              annotations: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.sharedReading.count({ where: dateFilter })
    ])

    res.json({
      success: true,
      data: {
        sharedReadings,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  })
)

// @desc    Obtenir les détails d'une lecture partagée pour l'admin
// @route   GET /api/admin/shared-readings/:id
// @access  Private (Admin only)
router.get('/shared-readings/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const sharedReading = await prisma.sharedReading.findUnique({
      where: { id },
      include: {
        book: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true
              }
            }
          },
          orderBy: { joinedAt: 'desc' }
        },
        annotations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!sharedReading) {
      return res.status(404).json({
        success: false,
        error: 'Lecture partagée non trouvée'
      })
    }

    // Statistiques additionnelles
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT a.user_id) as unique_annotators,
        AVG(srp.progress) as avg_progress,
        MAX(srp.progress) as max_progress
      FROM shared_reading_participants srp
      LEFT JOIN annotations a ON a.shared_reading_id = srp.shared_reading_id AND a.user_id = srp.user_id
      WHERE srp.shared_reading_id = ${id}
    ` as Array<{ unique_annotators: bigint, avg_progress: number, max_progress: number }>

    res.json({
      success: true,
      data: {
        sharedReading,
        stats: {
          uniqueAnnotators: Number(stats[0]?.unique_annotators || 0),
          avgProgress: Number(stats[0]?.avg_progress || 0),
          maxProgress: Number(stats[0]?.max_progress || 0)
        }
      }
    })
  })
)

// @desc    Supprimer une lecture partagée
// @route   DELETE /api/admin/shared-readings/:id
// @access  Private (Admin only)
router.delete('/shared-readings/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const sharedReading = await prisma.sharedReading.findUnique({
      where: { id }
    })

    if (!sharedReading) {
      return res.status(404).json({
        success: false,
        error: 'Lecture partagée non trouvée'
      })
    }

    await prisma.sharedReading.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Lecture partagée supprimée avec succès'
    })
  })
)

// @desc    Modérer une annotation (supprimer ou masquer)
// @route   DELETE /api/admin/annotations/:id
// @access  Private (Admin only)
router.delete('/annotations/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const annotation = await prisma.annotation.findUnique({
      where: { id }
    })

    if (!annotation) {
      return res.status(404).json({
        success: false,
        error: 'Annotation non trouvée'
      })
    }

    await prisma.annotation.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Annotation supprimée avec succès'
    })
  })
)

// @desc    Exporter les données d'une lecture partagée
// @route   GET /api/admin/shared-readings/:id/export
// @access  Private (Admin only)
router.get('/shared-readings/:id/export',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params
    const format = req.query.format as string || 'json'

    const sharedReading = await prisma.sharedReading.findUnique({
      where: { id },
      include: {
        book: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        annotations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!sharedReading) {
      return res.status(404).json({
        success: false,
        error: 'Lecture partagée non trouvée'
      })
    }

    if (format === 'csv') {
      // Convertir en CSV (simplified)
      const csvData = sharedReading.annotations.map(ann => ({
        date: ann.createdAt.toISOString(),
        user: ann.user.name,
        page: ann.page,
        selectedText: ann.selectedText,
        comment: ann.content
      }))

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="lecture-${id}-annotations.csv"`)
      
      // Simple CSV conversion (in production, use a proper CSV library)
      const csvHeader = 'Date,Utilisateur,Page,Texte sélectionné,Commentaire\n'
      const csvRows = csvData.map(row => 
        `"${row.date}","${row.user}","${row.page}","${row.selectedText}","${row.comment}"`
      ).join('\n')
      
      res.send(csvHeader + csvRows)
    } else {
      // JSON format
      res.json({
        success: true,
        data: sharedReading
      })
    }
  })
)

// =============== GESTION DES UTILISATEURS ===============

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 50
    const search = req.query.search as string
    const status = req.query.status as string

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    if (status) {
      where.status = status
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              annotations: true,
              participations: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  })
)

// @desc    Créer un nouvel utilisateur
// @route   POST /api/admin/users
// @access  Private (Admin only)
router.post('/users',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      status: Joi.string().valid('USER', 'AUTHOR', 'TRANSLATOR', 'ADMIN').default('USER')
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const { name, email, password, status } = value

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      })
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true
      }
    })

    res.status(201).json({
      success: true,
      data: user
    })
  })
)

// @desc    Supprimer un utilisateur
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete('/users/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      })
    }

    // Ne pas supprimer son propre compte
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      })
    }

    await prisma.user.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    })
  })
)

// @desc    Import CSV d'utilisateurs
// @route   POST /api/admin/users/import
// @access  Private (Admin only)
router.post('/users/import',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { users } = req.body // Array of { name, email, status }

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucun utilisateur fourni'
      })
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as string[]
    }

    for (const userData of users) {
      try {
        const { name, email, status = 'USER' } = userData
        
        if (!name || !email) {
          results.errors.push(`Ligne ignorée: nom ou email manquant`)
          results.skipped++
          continue
        }

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          results.skipped++
          continue
        }

        // Générer un mot de passe temporaire
        const tempPassword = Math.random().toString(36).slice(-8)
        const hashedPassword = await bcrypt.hash(tempPassword, 10)

        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            status
          }
        })

        results.created++
      } catch (error) {
        results.errors.push(`Erreur pour ${userData.email}: ${error}`)
        results.skipped++
      }
    }

    res.json({
      success: true,
      data: results
    })
  })
)

// =============== GESTION DES LIVRES ===============

// @desc    Obtenir tous les livres
// @route   GET /api/admin/books
// @access  Private (Admin only)
router.get('/books',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          _count: {
            select: {
              sharedReadings: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
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
  })
)

// @desc    Upload d'un livre EPUB
// @route   POST /api/admin/books
// @access  Private (Admin only)
router.post('/books',
  authenticate,
  authorize('ADMIN'),
  upload.single('epub'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Fichier EPUB requis'
      })
    }

    const schema = Joi.object({
      title: Joi.string().min(1).max(200).required(),
      author: Joi.string().min(1).max(100).required(),
      description: Joi.string().max(1000).optional(),
      coverUrl: Joi.string().uri().optional()
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const { title, author, description, coverUrl } = value

    const book = await prisma.book.create({
      data: {
        title,
        author,
        description,
        coverUrl,
        epubUrl: `/books/${req.file.filename}`,
        epubPath: req.file.path
      }
    })

    res.status(201).json({
      success: true,
      data: book
    })
  })
)

// @desc    Supprimer un livre
// @route   DELETE /api/admin/books/:id
// @access  Private (Admin only)
router.delete('/books/:id',
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

// =============== CRÉATION DE LECTURES PARTAGÉES ===============

// @desc    Créer une nouvelle lecture partagée
// @route   POST /api/admin/shared-readings
// @access  Private (Admin only)
router.post('/shared-readings',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const schema = Joi.object({
      title: Joi.string().min(3).max(200).required(),
      description: Joi.string().max(1000).optional(),
      bookId: Joi.string().required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().greater(Joi.ref('startDate')).required(),
      isPublic: Joi.boolean().default(true),
      participantIds: Joi.array().items(Joi.string()).optional().default([])
    })

    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const { title, description, bookId, startDate, endDate, isPublic, participantIds } = value

    // Vérifier que le livre existe
    const book = await prisma.book.findUnique({
      where: { id: bookId }
    })

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livre non trouvé'
      })
    }

    // Vérifier que tous les participants existent
    if (participantIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: participantIds
          }
        }
      })

      if (users.length !== participantIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Certains utilisateurs n\'existent pas'
        })
      }
    }

    // Générer un code d'invitation si nécessaire
    const inviteCode = !isPublic ? 
      Math.random().toString(36).substring(2, 15) : null

    const sharedReading = await prisma.sharedReading.create({
      data: {
        title,
        description,
        bookId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPublic,
        inviteCode,
        createdBy: req.user.id,
        participants: {
          create: [
            // Créateur toujours ajouté
            {
              userId: req.user.id,
              progress: 0
            },
            // Autres participants
            ...participantIds.map((userId: string) => ({
              userId,
              progress: 0
            }))
          ]
        }
      },
      include: {
        book: true,
        creator: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true
              }
            }
          }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: sharedReading
    })
  })
)

export default router