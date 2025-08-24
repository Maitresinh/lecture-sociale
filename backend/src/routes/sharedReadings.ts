import express from 'express'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Validation schemas
const createSharedReadingSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(1000).optional(),
  bookId: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  isPublic: Joi.boolean().default(true)
})

const joinSchema = Joi.object({
  inviteCode: Joi.string().optional()
})

// @desc    Obtenir toutes les lectures publiques
// @route   GET /api/shared-readings/public
// @access  Public
router.get('/public', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const search = req.query.search as string

  const where = {
    isPublic: true,
    endDate: {
      gte: new Date()
    },
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { book: { title: { contains: search, mode: 'insensitive' } } },
        { book: { author: { contains: search, mode: 'insensitive' } } }
      ]
    })
  } as any

  const [sharedReadings, total] = await Promise.all([
    prisma.sharedReading.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            description: true,
            coverUrl: true,
            totalPages: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            status: true,
            avatar: true
          }
        },
        participants: {
          select: {
            id: true,
            userId: true,
            progress: true
          }
        },
        _count: {
          select: {
            annotations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.sharedReading.count({ where })
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
}))

// @desc    Obtenir les lectures de l'utilisateur
// @route   GET /api/shared-readings/my
// @access  Private
router.get('/my', authenticate, asyncHandler(async (req, res) => {
  const userId = req.user.id

  const sharedReadings = await prisma.sharedReading.findMany({
    where: {
      OR: [
        { createdBy: userId },
        { participants: { some: { userId } } }
      ]
    },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          author: true,
          description: true,
          coverUrl: true,
          totalPages: true
        }
      },
      creator: {
        select: {
          id: true,
          name: true,
          status: true,
          avatar: true
        }
      },
      participants: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          progress: true,
          joinedAt: true
        }
      },
      _count: {
        select: {
          annotations: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  res.json({
    success: true,
    data: sharedReadings
  })
}))

// @desc    Obtenir une lecture partagée
// @route   GET /api/shared-readings/:id
// @access  Private
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  const sharedReading = await prisma.sharedReading.findUnique({
    where: { id },
    include: {
      book: true,
      creator: {
        select: {
          id: true,
          name: true,
          status: true,
          avatar: true
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              status: true,
              avatar: true
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
              status: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
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

  // Vérifier l'accès
  const hasAccess = sharedReading.isPublic || 
                   sharedReading.createdBy === userId ||
                   sharedReading.participants.some(p => p.userId === userId)

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    })
  }

  res.json({
    success: true,
    data: sharedReading
  })
}))

// @desc    Créer une nouvelle lecture partagée
// @route   POST /api/shared-readings
// @access  Private (Admin, Author, Translator)
router.post('/', 
  authenticate, 
  authorize('ADMIN', 'AUTHOR', 'TRANSLATOR'),
  asyncHandler(async (req, res) => {
    const { error } = createSharedReadingSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      })
    }

    const { title, description, bookId, startDate, endDate, isPublic } = req.body
    const userId = req.user.id

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

    // Générer un code d'invitation si la lecture n'est pas publique
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
        createdBy: userId,
        participants: {
          create: {
            userId,
            progress: 0
          }
        }
      },
      include: {
        book: true,
        creator: {
          select: {
            id: true,
            name: true,
            status: true,
            avatar: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                status: true,
                avatar: true
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

// @desc    Rejoindre une lecture partagée
// @route   POST /api/shared-readings/:id/join
// @access  Private
router.post('/:id/join', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const { inviteCode } = req.body

  const sharedReading = await prisma.sharedReading.findUnique({
    where: { id },
    include: {
      participants: true
    }
  })

  if (!sharedReading) {
    return res.status(404).json({
      success: false,
      error: 'Lecture partagée non trouvée'
    })
  }

  // Vérifier si l'utilisateur est déjà participant
  if (sharedReading.participants.some(p => p.userId === userId)) {
    return res.status(400).json({
      success: false,
      error: 'Vous participez déjà à cette lecture'
    })
  }

  // Vérifier l'accès
  if (!sharedReading.isPublic && sharedReading.inviteCode !== inviteCode) {
    return res.status(403).json({
      success: false,
      error: 'Code d\'invitation invalide'
    })
  }

  // Vérifier que la lecture n'est pas terminée
  if (new Date() > sharedReading.endDate) {
    return res.status(400).json({
      success: false,
      error: 'Cette lecture est terminée'
    })
  }

  // Ajouter le participant
  await prisma.sharedReadingParticipant.create({
    data: {
      sharedReadingId: id,
      userId,
      progress: 0
    }
  })

  res.json({
    success: true,
    message: 'Vous avez rejoint la lecture avec succès'
  })
}))

// @desc    Mettre à jour la progression
// @route   PUT /api/shared-readings/:id/progress
// @access  Private
// @desc    Modifier une lecture partagée
// @route   PUT /api/shared-readings/:id
// @access  Private (Admin or Creator)
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  const sharedReading = await prisma.sharedReading.findUnique({
    where: { id }
  })

  if (!sharedReading) {
    return res.status(404).json({
      success: false,
      error: 'Lecture partagée non trouvée'
    })
  }

  // Vérifier les permissions (admin ou créateur)
  if (req.user.status !== 'ADMIN' && sharedReading.createdBy !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes'
    })
  }

  const updateData: any = {}
  if (req.body.title) updateData.title = req.body.title
  if (req.body.description !== undefined) updateData.description = req.body.description
  if (req.body.bookId) updateData.bookId = req.body.bookId
  if (req.body.startDate) updateData.startDate = new Date(req.body.startDate)
  if (req.body.endDate) updateData.endDate = new Date(req.body.endDate)

  const updatedReading = await prisma.sharedReading.update({
    where: { id },
    data: updateData,
    include: {
      book: true,
      creator: {
        select: {
          id: true,
          name: true,
          status: true
        }
      }
    }
  })

  res.json({
    success: true,
    data: updatedReading
  })
}))

// @desc    Gérer les participants d'une lecture partagée
// @route   PUT /api/shared-readings/:id/participants
// @access  Private (Admin or Creator)
router.put('/:id/participants', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const { userIds } = req.body // Array des IDs utilisateurs

  if (!Array.isArray(userIds)) {
    return res.status(400).json({
      success: false,
      error: 'userIds doit être un tableau'
    })
  }

  const sharedReading = await prisma.sharedReading.findUnique({
    where: { id }
  })

  if (!sharedReading) {
    return res.status(404).json({
      success: false,
      error: 'Lecture partagée non trouvée'
    })
  }

  // Vérifier les permissions
  if (req.user.status !== 'ADMIN' && sharedReading.createdBy !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Permissions insuffisantes'
    })
  }

  // Supprimer les anciens participants (sauf le créateur)
  await prisma.sharedReadingParticipant.deleteMany({
    where: {
      sharedReadingId: id,
      userId: {
        not: sharedReading.createdBy
      }
    }
  })

  // Ajouter les nouveaux participants
  if (userIds.length > 0) {
    await prisma.sharedReadingParticipant.createMany({
      data: userIds
        .filter(uid => uid !== sharedReading.createdBy) // Éviter le doublon avec le créateur
        .map(uid => ({
          sharedReadingId: id,
          userId: uid,
          progress: 0
        })),
      skipDuplicates: true
    })
  }

  res.json({
    success: true,
    message: 'Participants mis à jour'
  })
}))

router.put('/:id/progress', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id
  const { progress, cfi } = req.body

  // Vérifier que l'utilisateur participe
  const participant = await prisma.sharedReadingParticipant.findUnique({
    where: {
      sharedReadingId_userId: {
        sharedReadingId: id,
        userId
      }
    }
  })

  if (!participant) {
    return res.status(403).json({
      success: false,
      error: 'Vous ne participez pas à cette lecture'
    })
  }

  // Mettre à jour la progression
  await Promise.all([
    prisma.sharedReadingParticipant.update({
      where: {
        sharedReadingId_userId: {
          sharedReadingId: id,
          userId
        }
      },
      data: {
        progress: Math.min(1, Math.max(0, progress))
      }
    }),
    // Mettre à jour ou créer la session de lecture
    prisma.readingSession.upsert({
      where: {
        sharedReadingId_userId: {
          sharedReadingId: id,
          userId
        }
      },
      create: {
        sharedReadingId: id,
        userId,
        currentCfi: cfi || '',
        progress: progress,
        lastReadAt: new Date()
      },
      update: {
        currentCfi: cfi || '',
        progress: progress,
        lastReadAt: new Date()
      }
    })
  ])

  res.json({
    success: true,
    message: 'Progression mise à jour'
  })
}))

export default router