import { User } from '../types'
import { Link } from 'react-router-dom'

interface HomeBasicProps {
  user: User | null
}

export default function HomeBasic({ user }: HomeBasicProps) {
  if (!user) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: 'blue', fontSize: '36px', marginBottom: '30px' }}>
          📚 LECTURE SOCIALE - BASIC
        </h1>
        
        <div style={{
          border: '3px solid orange',
          padding: '30px',
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#fff3e0'
        }}>
          <h2 style={{ color: 'orange' }}>🔒 NON CONNECTÉ</h2>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>
            Connectez-vous pour accéder aux lectures collaboratives
          </p>
          
          <Link 
            to="/login"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              backgroundColor: '#2196F3',
              color: 'white',
              textDecoration: 'none',
              fontSize: '18px',
              borderRadius: '5px'
            }}
          >
            🚀 SE CONNECTER
          </Link>
          
          <br />
          <br />
          
          <Link 
            to="/lectures-publiques"
            style={{
              display: 'inline-block',
              padding: '15px 30px',
              backgroundColor: '#4CAF50',
              color: 'white',
              textDecoration: 'none',
              fontSize: '18px',
              borderRadius: '5px'
            }}
          >
            👀 VOIR LECTURES PUBLIQUES
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{
        border: '3px solid green',
        padding: '20px',
        marginBottom: '30px',
        backgroundColor: '#e6ffe6'
      }}>
        <h1 style={{ color: 'green', fontSize: '32px', margin: '0 0 15px 0' }}>
          🎉 BIENVENUE {user.name.toUpperCase()}!
        </h1>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Status:</strong> {user.status}</p>
        <p><strong>Admin Access:</strong> {user.status === 'ADMIN' ? '✅ OUI' : '❌ NON'}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* LECTURES */}
        <div style={{
          border: '2px solid blue',
          padding: '20px',
          backgroundColor: '#e6f2ff'
        }}>
          <h3 style={{ color: 'blue' }}>📖 MES LECTURES</h3>
          <div style={{
            border: '1px solid #ddd',
            padding: '15px',
            backgroundColor: 'white',
            marginBottom: '15px'
          }}>
            <h4>📚 Les Misérables</h4>
            <p>Victor Hugo</p>
            <Link 
              to="/lecture/reading-les-miserables"
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '3px'
              }}
            >
              📄 CONTINUER LA LECTURE
            </Link>
          </div>
        </div>

        {/* ADMIN */}
        {user.status === 'ADMIN' && (
          <div style={{
            border: '2px solid red',
            padding: '20px',
            backgroundColor: '#ffe6e6'
          }}>
            <h3 style={{ color: 'red' }}>🔧 ADMINISTRATION</h3>
            <p>Accès administrateur détecté</p>
            <Link 
              to="/admin"
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#f44336',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '3px',
                fontSize: '16px'
              }}
            >
              🚨 PANNEAU ADMIN
            </Link>
          </div>
        )}

        {/* NAVIGATION */}
        <div style={{
          border: '2px solid purple',
          padding: '20px',
          backgroundColor: '#f3e6ff'
        }}>
          <h3 style={{ color: 'purple' }}>🧭 NAVIGATION</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link 
              to="/lectures-publiques"
              style={{
                padding: '10px',
                backgroundColor: '#9C27B0',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '3px',
                textAlign: 'center'
              }}
            >
              🌍 Lectures Publiques
            </Link>
            
            <button 
              onClick={() => {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                window.location.reload()
              }}
              style={{
                padding: '10px',
                backgroundColor: '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🚪 Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* DEBUG INFO */}
      <div style={{
        marginTop: '30px',
        border: '1px solid #ccc',
        padding: '15px',
        backgroundColor: '#f9f9f9',
        fontSize: '12px'
      }}>
        <h4>🐛 DEBUG INFO:</h4>
        <p><strong>Token présent:</strong> {localStorage.getItem('token') ? '✅ OUI' : '❌ NON'}</p>
        <p><strong>User data:</strong> {JSON.stringify(user, null, 2)}</p>
      </div>
    </div>
  )
}