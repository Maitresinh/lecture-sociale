import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ReaderPage from './pages/ReaderPage'
import AdminPage from './pages/AdminPage'
import PublicReadingsPage from './pages/PublicReadingsPage'
import { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au démarrage
    const token = localStorage.getItem('token')
    if (token) {
      // TODO: Vérifier le token avec l'API
      // Pour l'instant, simulation avec localStorage
      const userData = localStorage.getItem('user')
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage user={user} />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/lectures-publiques" element={<PublicReadingsPage />} />
          <Route 
            path="/lecture/:sharedReadingId" 
            element={user ? <ReaderPage user={user} /> : <LoginPage onLogin={handleLogin} />} 
          />
          <Route 
            path="/admin" 
            element={
              user?.status === 'admin' ? 
                <AdminPage user={user} /> : 
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Accès non autorisé</p>
                </div>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App