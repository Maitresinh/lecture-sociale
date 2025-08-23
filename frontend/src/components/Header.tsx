import { Link, useNavigate } from 'react-router-dom'
import { User, BookOpen, Settings, LogOut, Menu } from 'lucide-react'
import { User as UserType } from '../types'
import { useState } from 'react'

interface HeaderProps {
  user: UserType | null
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = () => {
    onLogout()
    navigate('/')
    setIsMenuOpen(false)
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Lecture Sociale</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/lectures-publiques" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Lectures Publiques
            </Link>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  Bonjour, {user.name}
                </span>
                
                {user.status === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Connexion</span>
              </Link>
            )}
          </nav>

          {/* Menu mobile */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Menu mobile déployé */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/lectures-publiques"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Lectures Publiques
              </Link>
              
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground border-t pt-4">
                    Connecté comme {user.name}
                  </span>
                  
                  {user.status === 'admin' && (
                    <Link 
                      to="/admin"
                      className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Administration</span>
                    </Link>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login"
                  className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>Connexion</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}