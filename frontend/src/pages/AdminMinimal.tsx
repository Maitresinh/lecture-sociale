import { useState } from 'react'
import { User } from '../types'
import WorkingEpubReader from './WorkingEpubReader'
import AdvancedEpubReader from './AdvancedEpubReader'

interface AdminMinimalProps {
  user: User
}

export default function AdminMinimal({ user }: AdminMinimalProps) {
  const [showReader, setShowReader] = useState<'none' | 'basic' | 'advanced'>('none')

  if (showReader === 'basic') {
    return <WorkingEpubReader user={user} />
  }

  if (showReader === 'advanced') {
    return <AdvancedEpubReader user={user} />
  }

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header Admin */}
      <div style={{
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0 }}>🔧 ADMIN MINIMAL</h1>
        <p style={{ margin: '0.5rem 0 0 0' }}>
          Connecté en tant que: <strong>{user.name}</strong> ({user.email})
        </p>
      </div>

      {/* Section EPUB */}
      <div style={{
        backgroundColor: 'white',
        border: '2px solid #2563eb',
        borderRadius: '8px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#2563eb', marginTop: 0 }}>📚 Lecteur EPUB</h2>
        
        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>📖 Alice au Pays des Merveilles</h3>
          <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
            Lewis Carroll • Project Gutenberg • 134 KB
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
            ✅ Livre téléchargé et prêt à lire
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => setShowReader('basic')}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            📖 LECTEUR BASIC
          </button>
          <button
            onClick={() => setShowReader('advanced')}
            style={{
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '1rem 2rem',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            ✨ LECTEUR AVEC ANNOTATIONS
          </button>
        </div>
      </div>

      {/* Infos technique */}
      <div style={{
        backgroundColor: '#f3f4f6',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        padding: '1rem',
        fontSize: '0.875rem'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>🔧 Infos Techniques</h3>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>✅ Backend Node.js + Express actif</li>
          <li>✅ Base de données SQLite fonctionnelle</li>
          <li>✅ Authentication JWT active</li>
          <li>✅ React-Reader library installée</li>
          <li>✅ Fichier EPUB Alice téléchargé (134 KB)</li>
          <li>✅ Interface admin simplifiée</li>
        </ul>
      </div>

      {/* Bouton retour */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '0.5rem 1rem',
            cursor: 'pointer'
          }}
        >
          ← Retour à l'accueil
        </button>
      </div>
    </div>
  )
}