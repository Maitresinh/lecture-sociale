import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err }
  error.message = err.message

  // Log de l'erreur
  logger.error(err)

  // Erreur de validation Prisma
  if (err.name === 'ValidationError') {
    const message = 'Données invalides'
    error = { ...error, statusCode: 400, message }
  }

  // Erreur de contrainte unique Prisma
  if (err.message.includes('Unique constraint failed')) {
    const message = 'Cette valeur existe déjà'
    error = { ...error, statusCode: 400, message }
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token invalide'
    error = { ...error, statusCode: 401, message }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expiré'
    error = { ...error, statusCode: 401, message }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Erreur serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next)