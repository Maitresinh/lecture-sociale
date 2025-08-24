import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HeaderBasic from './components/HeaderBasic'
import HomeBasic from './pages/HomeBasic'
import LoginBasic from './pages/LoginBasic'
import AdminMinimal from './pages/AdminMinimal'
import { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const response = await fetch('http://localhost:3001/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              setUser(result.data.user)
            }
          } else {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } catch (error) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }
    
    checkAuth()
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
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderBasic user={user} onLogout={handleLogout} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomeBasic user={user} />} />
          <Route path="/login" element={<LoginBasic onLogin={handleLogin} />} />
          <Route 
            path="/admin" 
            element={
              user?.status === 'ADMIN' ? 
                <AdminMinimal user={user} /> : 
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>❌ Accès non autorisé</p>
                </div>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App