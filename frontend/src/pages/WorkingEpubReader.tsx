import { useState } from 'react'
import { ReactReader } from 'react-reader'
import { User } from '../types'

interface WorkingEpubReaderProps {
  user: User
}

export default function WorkingEpubReader({ user }: WorkingEpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0)
  const [epubUrl] = useState('/books/alice.epub')

  const locationChanged = (epubcfi: string) => {
    console.log('Location changed:', epubcfi)
    setLocation(epubcfi)
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header simple */}
      <div style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0 }}>📚 EPUB Reader (Admin: {user.name})</h1>
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Retour
        </button>
      </div>

      {/* Reader EPUB */}
      <div style={{ flex: 1 }}>
        <ReactReader
          url={epubUrl}
          title="Alice au Pays des Merveilles"
          location={location}
          locationChanged={locationChanged}
        />
      </div>

      {/* Footer avec infos */}
      <div style={{
        backgroundColor: '#f3f4f6',
        padding: '0.5rem 1rem',
        borderTop: '1px solid #e5e7eb',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        📖 Alice au Pays des Merveilles
      </div>
    </div>
  )
}