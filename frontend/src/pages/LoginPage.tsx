import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User as UserIcon, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { User } from '../types'

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // TODO: Appel API de connexion
        // Pour l'instant, simulation
        const mockUser: User = {
          id: 'user1',
          email: formData.email,
          name: formData.email.split('@')[0],
          status: formData.email === 'admin@example.com' ? 'admin' : 'user',
          createdAt: new Date()
        }
        
        localStorage.setItem('token', 'mock-token')
        onLogin(mockUser)
        navigate('/')
      } else {
        // TODO: Appel API d'inscription
        if (formData.password !== formData.confirmPassword) {
          alert('Les mots de passe ne correspondent pas')
          return
        }

        const mockUser: User = {
          id: 'new-user',
          email: formData.email,
          name: formData.name,
          status: 'user',
          createdAt: new Date()
        }
        
        localStorage.setItem('token', 'mock-token')
        onLogin(mockUser)
        navigate('/')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="bg-card p-8 rounded-lg border shadow-sm">
        <div className="text-center mb-8">
          <UserIcon className="h-12 w-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin 
              ? 'Connectez-vous pour accéder à vos lectures' 
              : 'Créez votre compte pour commencer à lire'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Nom complet
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required={!isLogin}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Votre nom complet"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="votre@email.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-10 pr-10 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:underline"
          >
            {isLogin 
              ? 'Pas de compte ? Inscrivez-vous' 
              : 'Déjà un compte ? Connectez-vous'
            }
          </button>
        </div>

        {isLogin && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Comptes de démonstration :</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Admin : admin@example.com<br />
              Utilisateur : user@example.com
            </p>
          </div>
        )}
      </div>
    </div>
  )
}