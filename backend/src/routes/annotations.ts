import express from 'express'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Validation schemas
const createAnnotationSchema = Joi.object({
  sharedReadingId: Joi.string().required(),
  content: Joi.string().min(1).max(1000).required(),
  cfi: Joi.string().required(),
  selectedText: Joi.string().min(1).max(500).required(),
  page: Joi.number().integer().min(1).required(),
  isPublic: Joi.boolean().default(true)
})

const updateAnnotationSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required()
})

// @desc    Obtenir les annotations d'une lecture partagée
// @route   GET /api/annotations/shared-reading/:sharedReadingId
// @access  Private
router.get('/shared-reading/:sharedReadingId', authenticate, asyncHandler(async (req, res) => {
  const { sharedReadingId } = req.params
  const userId = req.user.id

  // Vérifier que l'utilisateur a accès à cette lecture
  const sharedReading = await prisma.sharedReading.findUnique({
    where: { id: sharedReadingId },
    include: {
      participants: {
        where: { userId }
      }
    }
  })

  if (!sharedReading) {
    return res.status(404).json({
      success: false,
      error: 'Lecture partagée non trouvée'
    })
  }

  const hasAccess = sharedReading.isPublic || 
                   sharedReading.createdBy === userId ||
                   sharedReading.participants.length > 0

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      error: 'Accès non autorisé'
    })
  }

  const annotations = await prisma.annotation.findMany({
    where: {
      sharedReadingId,
      OR: [
        { isPublic: true },
        { userId }
      ]
    },
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
    orderBy: [
      { page: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  res.json({
    success: true,
    data: annotations
  })
}))

// @desc    Créer une annotation
// @route   POST /api/annotations
// @access  Private
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { error } = createAnnotationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    })
  }

  const { sharedReadingId, content, cfi, selectedText, page, isPublic } = req.body
  const userId = req.user.id

  // Vérifier que l'utilisateur participe à cette lecture
  const participant = await prisma.sharedReadingParticipant.findUnique({
    where: {
      sharedReadingId_userId: {
        sharedReadingId,
        userId
      }
    }
  })

  if (!participant) {
    return res.status(403).json({
      success: false,
      error: 'Vous devez participer à cette lecture pour ajouter des annotations'
    })
  }

  const annotation = await prisma.annotation.create({
    data: {
      sharedReadingId,
      userId,
      content,
      cfi,
      selectedText,
      page,
      isPublic
    },
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
  })

  res.status(201).json({
    success: true,
    data: annotation
  })
}))

// @desc    Mettre à jour une annotation
// @route   PUT /api/annotations/:id
// @access  Private
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const { error } = updateAnnotationSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    })
  }

  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id

  // Vérifier que l'annotation existe et appartient à l'utilisateur
  const existingAnnotation = await prisma.annotation.findUnique({
    where: { id }
  })

  if (!existingAnnotation) {
    return res.status(404).json({
      success: false,
      error: 'Annotation non trouvée'
    })
  }

  if (existingAnnotation.userId !== userId) {
    return res.status(403).json({
      success: false,
      error: 'Vous ne pouvez modifier que vos propres annotations'
    })
  }

  const annotation = await prisma.annotation.update({
    where: { id },
    data: { content },
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
  })

  res.json({
    success: true,
    data: annotation
  })
}))

// @desc    Supprimer une annotation
// @route   DELETE /api/annotations/:id
// @access  Private
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  // Vérifier que l'annotation existe
  const existingAnnotation = await prisma.annotation.findUnique({
    where: { id }
  })

  if (!existingAnnotation) {
    return res.status(404).json({
      success: false,
      error: 'Annotation non trouvée'
    })
  }

  // Vérifier les permissions (propriétaire ou admin)
  if (existingAnnotation.userId !== userId && req.user.status !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Vous ne pouvez supprimer que vos propres annotations'
    })
  }

  await prisma.annotation.delete({
    where: { id }
  })

  res.json({
    success: true,
    message: 'Annotation supprimée'
  })
}))

// @desc    Créer une citation à partir d'une annotation
// @route   POST /api/annotations/:id/cite
// @access  Private
router.post('/:id/cite', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params
  const { platforms } = req.body
  const userId = req.user.id

  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      sharedReading: {
        include: {
          book: true
        }
      },
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  if (!annotation) {
    return res.status(404).json({
      success: false,
      error: 'Annotation non trouvée'
    })
  }

  const citation = await prisma.citation.create({
    data: {
      annotationId: id,
      userId,
      text: annotation.selectedText,
      author: annotation.sharedReading.book.author,
      bookTitle: annotation.sharedReading.book.title,
      sharedOnPlatforms: platforms || []
    }
  })

  res.status(201).json({
    success: true,
    data: citation
  })
}))

// @desc    Obtenir les statistiques d'annotations par temps/personne/date
// @route   GET /api/annotations/stats/:sharedReadingId
// @access  Private (Admin only)
router.get('/stats/:sharedReadingId', 
  authenticate, 
  asyncHandler(async (req, res) => {
    const { sharedReadingId } = req.params
    const userId = req.user.id

    // Vérifier l'accès (créateur ou admin)
    const sharedReading = await prisma.sharedReading.findUnique({
      where: { id: sharedReadingId }
    })

    if (!sharedReading) {
      return res.status(404).json({
        success: false,
        error: 'Lecture partagée non trouvée'
      })
    }

    if (sharedReading.createdBy !== userId && req.user.status !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      })
    }

    // Statistiques par utilisateur
    const statsByUser = await prisma.annotation.groupBy({
      by: ['userId'],
      where: { sharedReadingId },
      _count: {
        id: true
      }
    })

    // Statistiques par jour
    const statsByDay = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM annotations 
      WHERE shared_reading_id = ${sharedReadingId}
      GROUP BY DATE(created_at)
      ORDER BY date
    `

    // Statistiques par heure
    const statsByHour = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM annotations 
      WHERE shared_reading_id = ${sharedReadingId}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY hour
    `

    // Enrichir avec les informations utilisateur
    const userIds = statsByUser.map(stat => stat.userId)
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        name: true,
        status: true,
        avatar: true
      }
    })

    const statsByUserWithDetails = statsByUser.map(stat => ({
      ...stat,
      user: users.find(u => u.id === stat.userId)
    }))

    res.json({
      success: true,
      data: {
        byUser: statsByUserWithDetails,
        byDay: statsByDay,
        byHour: statsByHour
      }
    })
  })
)

export default router