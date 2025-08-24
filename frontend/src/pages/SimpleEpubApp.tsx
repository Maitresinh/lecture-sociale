import { useState } from 'react'
import { User } from '../types'

interface SimpleEpubAppProps {
  user: User
}

export default function SimpleEpubApp({ user }: SimpleEpubAppProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [epubContent, setEpubContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Quelques EPUBs de test disponibles
  const sampleBooks = [
    {
      title: "Alice au Pays des Merveilles",
      author: "Lewis Carroll",
      url: "https://www.gutenberg.org/ebooks/11.epub.noimages"
    },
    {
      title: "Le Petit Prince",  
      author: "Antoine de Saint-Exupéry",
      url: "https://www.gutenberg.org/ebooks/17989.epub.noimages"
    }
  ]

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.name.endsWith('.epub')) {
      setSelectedFile(file)
      setError('')
    } else {
      setError('Veuillez sélectionner un fichier .epub')
    }
  }

  const readEpub = async () => {
    if (!selectedFile) return

    setLoading(true)
    setError('')

    try {
      // Pour l'instant, juste afficher le nom du fichier
      // TODO: Intégrer epub.js ou autre lecteur
      setEpubContent(`
        📖 FICHIER EPUB SÉLECTIONNÉ
        
        Nom: ${selectedFile.name}
        Taille: ${Math.round(selectedFile.size / 1024)} KB
        Type: ${selectedFile.type}
        
        🔧 Reader EPUB en cours de développement...
        
        Le fichier a été correctement détecté !
        Prochaine étape: intégrer epub.js pour la lecture.
      `)
    } catch (err) {
      setError('Erreur lors de la lecture du fichier')
    } finally {
      setLoading(false)
    }
  }

  const loadSampleBook = async (book: any) => {
    setLoading(true)
    setError('')
    
    try {
      setEpubContent(`
        📚 LIVRE SÉLECTIONNÉ
        
        Titre: ${book.title}
        Auteur: ${book.author}
        Source: Project Gutenberg
        
        🔧 Chargement depuis ${book.url}
        
        Le reader EPUB sera intégré ici avec epub.js
        pour permettre la lecture complète du livre.
      `)
    } catch (err) {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* HEADER SIMPLE */}
      <header style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '1rem 2rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0 }}>📚 Lecteur EPUB Simple</h1>
          <div>Bonjour, {user.name}</div>
        </div>
      </header>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        
        {!epubContent ? (
          /* SÉLECTION DE LIVRE */
          <div>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
              Choisissez un livre à lire
            </h2>

            {/* UPLOAD FICHIER */}
            <section style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              <h3>📁 Uploader votre EPUB</h3>
              <input
                type="file"
                accept=".epub"
                onChange={handleFileUpload}
                style={{
                  margin: '1rem 0',
                  padding: '0.5rem',
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '400px'
                }}
              />
              {selectedFile && (
                <div style={{ marginTop: '1rem' }}>
                  <p>✅ Fichier sélectionné: <strong>{selectedFile.name}</strong></p>
                  <button
                    onClick={readEpub}
                    disabled={loading}
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '⏳ Chargement...' : '📖 Lire ce livre'}
                  </button>
                </div>
              )}
            </section>

            {/* LIVRES D'EXEMPLE */}
            <section style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                📚 Ou choisissez un livre d'exemple
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {sampleBooks.map((book, index) => (
                  <div key={index} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{book.title}</h4>
                    <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>par {book.author}</p>
                    <button
                      onClick={() => loadSampleBook(book)}
                      disabled={loading}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      📖 Lire
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem',
                color: '#dc2626'
              }}>
                ❌ {error}
              </div>
            )}
          </div>
        ) : (
          /* AFFICHAGE DU CONTENU */
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            minHeight: '60vh'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2>📖 Lecteur</h2>
              <button
                onClick={() => {
                  setEpubContent('')
                  setSelectedFile(null)
                  setError('')
                }}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer'
                }}
              >
                ← Retour
              </button>
            </div>

            <div style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '2rem',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-line'
            }}>
              {epubContent}
            </div>

            {/* PLACEHOLDER POUR LE READER EPUB.JS */}
            <div style={{
              marginTop: '2rem',
              padding: '2rem',
              border: '2px dashed #e5e7eb',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p>🔧 <strong>Prochaine étape:</strong></p>
              <p>Intégrer epub.js ici pour la lecture complète</p>
              <p>Avec navigation, réglages de police, annotations, etc.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}