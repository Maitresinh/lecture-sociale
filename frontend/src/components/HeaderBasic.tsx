import { Link } from 'react-router-dom'
import { User } from '../types'

interface HeaderBasicProps {
  user: User | null
  onLogout: () => void
}

export default function HeaderBasic({ user, onLogout }: HeaderBasicProps) {
  return (
    <header style={{
      backgroundColor: '#1976D2',
      color: 'white',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div>
        <Link 
          to="/" 
          style={{ 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '24px', 
            fontWeight: 'bold' 
          }}
        >
          📚 LECTURE SOCIALE
        </Link>
      </div>

      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link 
          to="/lectures-publiques" 
          style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}
        >
          🌍 Lectures Publiques
        </Link>

        {user ? (
          <>
            {user.status === 'ADMIN' && (
              <Link 
                to="/admin" 
                style={{ 
                  color: 'yellow', 
                  textDecoration: 'none', 
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                🔧 ADMIN
              </Link>
            )}
            
            <span style={{ fontSize: '14px' }}>
              👤 {user.name} ({user.status})
            </span>
            
            <button 
              onClick={onLogout}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid white',
                color: 'white',
                padding: '5px 10px',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
            >
              🚪 Logout
            </button>
          </>
        ) : (
          <Link 
            to="/login" 
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              textDecoration: 'none',
              padding: '8px 16px',
              borderRadius: '3px'
            }}
          >
            🔐 Login
          </Link>
        )}
      </nav>
    </header>
  )
}