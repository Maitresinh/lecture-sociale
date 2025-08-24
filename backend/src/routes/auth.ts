import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'
import { PrismaClient } from '@prisma/client'
import { asyncHandler } from '../middleware/errorHandler'
import { authenticate } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

// Utilitaire pour générer un token JWT
const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

// @desc    Inscription
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { error } = registerSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    })
  }

  const { name, email, password } = req.body

  // Vérifier si l'utilisateur existe déjà
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'Un compte avec cet email existe déjà'
    })
  }

  // Hasher le mot de passe
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      avatar: true,
      createdAt: true
    }
  })

  const token = generateToken(user.id)

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  })
}))

// @desc    Connexion
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { error } = loginSchema.validate(req.body)
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    })
  }

  const { email, password } = req.body

  // Trouver l'utilisateur avec le mot de passe
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      success: false,
      error: 'Email ou mot de passe invalide'
    })
  }

  const token = generateToken(user.id)

  // Retourner sans le mot de passe
  const { password: _, ...userWithoutPassword } = user

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token
    }
  })
}))

// @desc    Obtenir l'utilisateur actuel
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  })
}))

// @desc    Déconnexion (côté client principalement)
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticate, (req, res) => {
  // En JWT, la déconnexion se fait côté client en supprimant le token
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  })
})

export default router