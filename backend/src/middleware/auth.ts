import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient, UserStatus } from '@prisma/client'
import { asyncHandler } from './errorHandler'

const prisma = new PrismaClient()

interface AuthenticatedRequest extends Request {
  user?: any
}

export const authenticate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    let token

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès requis'
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          avatar: true,
          createdAt: true
        }
      })

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Token invalide'
        })
      }

      req.user = user
      next()
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token invalide'
      })
    }
  }
)

export const authorize = (...roles: UserStatus[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      })
    }

    if (!roles.includes(req.user.status)) {
      return res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      })
    }

    next()
  }
}