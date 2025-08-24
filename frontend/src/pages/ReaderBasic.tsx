import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User } from '../types'

interface ReaderBasicProps {
  user: User
}

export default function ReaderBasic({ user }: ReaderBasicProps) {
  const { sharedReadingId } = useParams<{ sharedReadingId: string }>()
  const navigate = useNavigate()
  const [reading, setReading] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!sharedReadingId) return

    const loadReading = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        console.log('🔍 ReaderBasic - Loading reading:', sharedReadingId)
        const response = await fetch(`http://localhost:3001/api/shared-readings/${sharedReadingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        console.log('📡 ReaderBasic - Response status:', response.status)
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ ReaderBasic - Data received:', result)
          setReading(result.data)
        } else {
          const error = await response.json()
          console.error('❌ ReaderBasic - API Error:', error)
          setError(`API Error: ${error.error || response.status}`)
        }
      } catch (e) {
        console.error('💥 ReaderBasic - Fetch Error:', e)
        setError(`Network Error: ${e}`)
      } finally {
        setLoading(false)
      }
    }

    loadReading()
  }, [sharedReadingId])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: 'blue', fontSize: '24px' }}>🔄 LOADING READER...</h1>
        <p>Reading ID: {sharedReadingId}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: 'red', fontSize: '24px' }}>💥 ERROR</h1>
        <p style={{ color: 'red', fontSize: '18px' }}>{error}</p>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#2196F3', 
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          ← Retour Accueil
        </button>
      </div>
    )
  }

  if (!reading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: 'orange', fontSize: '24px' }}>⚠️ NO DATA</h1>
        <p>Reading not found</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        border: '3px solid green',
        padding: '20px',
        marginBottom: '20px',
        backgroundColor: '#e6ffe6'
      }}>
        <h1 style={{ color: 'green', fontSize: '28px', margin: '0 0 10px 0' }}>
          📖 READER BASIC
        </h1>
        <p><strong>Book:</strong> {reading.book?.title || 'N/A'}</p>
        <p><strong>Author:</strong> {reading.book?.author || 'N/A'}</p>
        <p><strong>Reading Title:</strong> {reading.title || 'N/A'}</p>
        <p><strong>User:</strong> {user.name}</p>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* EPUB INFO */}
        <div style={{
          width: '300px',
          border: '2px solid blue',
          padding: '20px',
          backgroundColor: '#e6f2ff'
        }}>
          <h3 style={{ color: 'blue' }}>📁 FILE INFO:</h3>
          <p><strong>EPUB URL:</strong></p>
          <p style={{ wordBreak: 'break-all', fontSize: '12px' }}>
            {reading.book?.epubUrl || 'N/A'}
          </p>
          <p><strong>Full URL:</strong></p>
          <p style={{ wordBreak: 'break-all', fontSize: '12px' }}>
            http://localhost:3001{reading.book?.epubUrl || ''}
          </p>
          
          <button 
            style={{
              padding: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginTop: '10px'
            }}
            onClick={() => {
              const url = `http://localhost:3001${reading.book?.epubUrl}`
              console.log('🔗 Testing EPUB URL:', url)
              window.open(url, '_blank')
            }}
          >
            🔗 Test EPUB URL
          </button>
        </div>

        {/* SIMPLE TEXT READER */}
        <div style={{
          flex: 1,
          border: '2px solid purple',
          padding: '20px',
          backgroundColor: '#f3e6ff'
        }}>
          <h3 style={{ color: 'purple' }}>📄 SIMPLE TEXT READER:</h3>
          <div style={{
            border: '1px solid #ccc',
            padding: '20px',
            height: '400px',
            overflow: 'auto',
            backgroundColor: 'white',
            fontSize: '16px',
            lineHeight: '1.6'
          }}>
            <h4>Les Misérables - Chapitre 1</h4>
            <p>
              En 1815, M. Charles-François-Bienvenu Myriel était évêque de Digne. 
              C'était un vieillard d'environ soixante-quinze ans; il occupait le 
              siège de Digne depuis 1806.
            </p>
            <p>
              Quoique ce détail ne touche en aucune manière au fond même de ce que 
              nous avons à raconter, il n'est peut-être pas inutile, ne fût-ce que 
              pour être exact en tout, d'indiquer ici les bruits et les propos qui 
              avaient couru sur son compte au moment où il était arrivé dans le diocèse.
            </p>
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              ⚠️ CECI EST DU TEXTE STATIQUE DE TEST
            </p>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginRight: '10px'
            }}>
              ← Page Précédente
            </button>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}>
              Page Suivante →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}