import express from 'express'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Configuration multer pour l'avatar
const storage = multer.diskStorage({
  destination: 'uploads/avatars/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Seuls les fichiers image sont acceptés'))
    }
  }
})

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  email: Joi.string().email().optional()
})

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
})

const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid('USER', 'TRANSLATOR', 'AUTHOR', 'GUEST', 'ADMIN').required()
})

// @desc    Obtenir le profil utilisateur
// @route   GET /api/users/profile
// @access  Private
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      avatar: true,
      createdAt: true,
      _count: {
        select: {
          createdReadings: true,
          participations: true,
          annotations: true
        }
      }
    }
  })

  res.json({
    success: true,
    data: user
  })
}))

// @desc    Mettre à jour le profil
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', 
  authenticate,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const { error } = updateProfileSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const { name, email } = req.body
    const userId = req.user.id
    const avatarFile = req.file

    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) {
      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      })

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Cet email est déjà utilisé'
        })
      }

      updateData.email = email
    }
    if (avatarFile) updateData.avatar = `/uploads/avatars/${avatarFile.filename}`

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        avatar: true,
        createdAt: true
      }
    })

    res.json({
      success: true,
      data: user
    })
  })
)

// @desc    Changer le mot de passe
// @route   PUT /api/users/password
// @access  Private
router.put('/password', authenticate, asyncHandler(async (req, res) => {
  const { error } = changePasswordSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    })
  }

  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  // Vérifier le mot de passe actuel
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    return res.status(400).json({
      success: false,
      error: 'Mot de passe actuel incorrect'
    })
  }

  // Hasher le nouveau mot de passe
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(newPassword, salt)

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  })

  res.json({
    success: true,
    message: 'Mot de passe mis à jour avec succès'
  })
}))

// @desc    Obtenir les statistiques utilisateur
// @route   GET /api/users/stats
// @access  Private
router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id

  const [
    readingsCreated,
    readingsParticipated,
    totalAnnotations,
    totalCitations,
    recentActivity
  ] = await Promise.all([
    prisma.sharedReading.count({
      where: { createdBy: userId }
    }),
    prisma.sharedReadingParticipant.count({
      where: { userId }
    }),
    prisma.annotation.count({
      where: { userId }
    }),
    prisma.citation.count({
      where: { userId }
    }),
    prisma.annotation.findMany({
      where: { userId },
      include: {
        sharedReading: {
          select: {
            title: true,
            book: {
              select: {
                title: true,
                author: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
  ])

  res.json({
    success: true,
    data: {
      readingsCreated,
      readingsParticipated,
      totalAnnotations,
      totalCitations,
      recentActivity
    }
  })
}))

// Routes d'administration

// @desc    Obtenir tous les utilisateurs
// @route   GET /api/users
// @access  Private (Admin only)
router.get('/', 
  authenticate, 
  authorize('ADMIN'), 
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
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
          avatar: true,
          createdAt: true,
          _count: {
            select: {
              createdReadings: true,
              participations: true,
              annotations: true
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

// @desc    Mettre à jour le statut d'un utilisateur
// @route   PUT /api/users/:id/status
// @access  Private (Admin only)
router.put('/:id/status',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { error } = updateUserStatusSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const { id } = req.params
    const { status } = req.body

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      })
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        avatar: true,
        createdAt: true
      }
    })

    res.json({
      success: true,
      data: updatedUser
    })
  })
)

// @desc    Supprimer un utilisateur
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const { id } = req.params

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdReadings: true,
            annotations: true
          }
        }
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      })
    }

    // Vérifier s'il y a des dépendances
    if (user._count.createdReadings > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un utilisateur qui a créé des lectures partagées'
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

export default router