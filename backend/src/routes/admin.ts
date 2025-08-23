import express from 'express'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate, authorize } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

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

export default router