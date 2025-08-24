import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '../types'

interface LoginBasicProps {
  onLogin: (user: User) => void
}

export default function LoginBasic({ onLogin }: LoginBasicProps) {
  const [email, setEmail] = useState('admin@lecture-sociale.fr')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugInfo('')

    console.log('🔐 LoginBasic - Attempting login:', { email, password: '***' })

    try {
      setDebugInfo('1️⃣ Sending login request...')
      
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      console.log('📡 LoginBasic - Response status:', response.status)
      setDebugInfo(`2️⃣ Response status: ${response.status}`)

      const result = await response.json()
      console.log('📦 LoginBasic - Response data:', result)
      setDebugInfo(`3️⃣ Response: ${JSON.stringify(result, null, 2)}`)

      if (response.ok && result.success) {
        console.log('✅ LoginBasic - Login successful')
        setDebugInfo('4️⃣ Login successful! Saving token and user...')
        
        // Sauvegarder le token
        localStorage.setItem('token', result.data.token)
        
        // Appeler onLogin avec l'utilisateur
        onLogin(result.data.user)
        
        setDebugInfo('5️⃣ Redirecting to home...')
        navigate('/')
      } else {
        console.error('❌ LoginBasic - Login failed:', result)
        setError(result.error || `Server error: ${response.status}`)
        setDebugInfo(`❌ Login failed: ${result.error || response.status}`)
      }
    } catch (err) {
      console.error('💥 LoginBasic - Network error:', err)
      setError(`Network error: ${err}`)
      setDebugInfo(`💥 Network error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '40px auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif' 
    }}>
      <div style={{
        border: '3px solid blue',
        padding: '30px',
        backgroundColor: '#e6f2ff'
      }}>
        <h1 style={{ color: 'blue', fontSize: '28px', marginBottom: '20px' }}>
          🔐 LOGIN ULTRA-BASIC
        </h1>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              📧 Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ccc',
                borderRadius: '5px'
              }}
              placeholder="admin@lecture-sociale.fr"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              🔑 Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: '2px solid #ccc',
                borderRadius: '5px'
              }}
              placeholder="admin123"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '18px',
              backgroundColor: loading ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ LOADING...' : '🚀 SE CONNECTER'}
          </button>
        </form>

        {error && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#ffe6e6',
            border: '2px solid red',
            borderRadius: '5px'
          }}>
            <h3 style={{ color: 'red', margin: '0 0 10px 0' }}>❌ ERREUR:</h3>
            <p style={{ color: 'red', margin: 0 }}>{error}</p>
          </div>
        )}

        {debugInfo && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#fff3e0',
            border: '2px solid orange',
            borderRadius: '5px'
          }}>
            <h3 style={{ color: 'orange', margin: '0 0 10px 0' }}>🐛 DEBUG INFO:</h3>
            <pre style={{ 
              margin: 0, 
              fontSize: '12px', 
              whiteSpace: 'pre-wrap',
              color: '#333' 
            }}>
              {debugInfo}
            </pre>
          </div>
        )}

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e8f5e8',
          border: '1px solid green',
          borderRadius: '5px'
        }}>
          <h4 style={{ color: 'green', margin: '0 0 10px 0' }}>💡 COMPTES DE TEST:</h4>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>Admin:</strong> admin@lecture-sociale.fr / admin123
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>
            <strong>Auteur:</strong> marie@example.com / password123
          </p>
        </div>
      </div>
    </div>
  )
}