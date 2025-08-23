import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import { logger } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'

// Routes
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import bookRoutes from './routes/books'
import sharedReadingRoutes from './routes/sharedReadings'
import annotationRoutes from './routes/annotations'
import adminRoutes from './routes/admin'

const app = express()
const prisma = new PrismaClient()

// Configuration
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Middleware de sécurité
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// CORS
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite à 100 requêtes par IP
  message: 'Trop de requêtes depuis cette IP'
})
app.use('/api/', limiter)

// Body parsing
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging des requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`)
  next()
})

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/books', bookRoutes)
app.use('/api/shared-readings', sharedReadingRoutes)
app.use('/api/annotations', annotationRoutes)
app.use('/api/admin', adminRoutes)

// Servir les fichiers statiques (EPUBs, images)
app.use('/uploads', express.static('uploads'))

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Route par défaut
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API Lecture Sociale',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      books: '/api/books',
      sharedReadings: '/api/shared-readings',
      annotations: '/api/annotations',
      admin: '/api/admin'
    }
  })
})

// Gestion des erreurs
app.use(errorHandler)

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvée',
    path: req.originalUrl 
  })
})

// Démarrage du serveur
async function startServer() {
  try {
    // Test de la connexion à la base de données
    await prisma.$connect()
    logger.info('Connexion à la base de données établie')
    
    app.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur le port ${PORT}`)
      logger.info(`📖 API disponible sur http://localhost:${PORT}/api`)
      logger.info(`🎯 Frontend autorisé depuis ${FRONTEND_URL}`)
    })
  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur:', error)
    process.exit(1)
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  logger.info('Arrêt du serveur...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Arrêt du serveur...')
  await prisma.$disconnect()
  process.exit(0)
})

startServer()

export { app, prisma }