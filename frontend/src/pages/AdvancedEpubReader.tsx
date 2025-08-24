import React, { useState, useRef, useCallback } from 'react'
import { ReactReader, ReactReaderStyle } from 'react-reader'
import { User } from '../types'

interface AdvancedEpubReaderProps {
  user: User
}

interface Annotation {
  key: string
  cfiRange: string
  text: string
  comment: string
  color: string
  created: Date
}

export default function AdvancedEpubReader({ user }: AdvancedEpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0)
  const [epubUrl] = useState('/books/alice.epub')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [currentSelection, setCurrentSelection] = useState<any>(null)
  const [selectedColor, setSelectedColor] = useState('#ffeb3b')
  const renditionRef = useRef<any>(null)

  const locationChanged = (epubcfi: string) => {
    setLocation(epubcfi)
  }

  // Load existing annotations
  const loadAnnotations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/annotations/personal/alice', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          const loadedAnnotations = result.data.annotations.map((ann: any) => ({
            key: ann.id,
            cfiRange: ann.cfiRange,
            text: ann.text,
            comment: ann.comment,
            color: ann.color,
            created: new Date(ann.createdAt)
          }))
          setAnnotations(loadedAnnotations)
        }
      }
    } catch (error) {
      console.error('Error loading annotations:', error)
    }
  }

  const getRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition
    
    // Load existing annotations
    loadAnnotations()
    
    // Enable text selection
    rendition.themes.default({
      '::selection': {
        'background': 'rgba(255, 235, 59, 0.3)'
      }
    })

    // Handle text selection
    rendition.on('selected', (cfiRange: string, contents: any) => {
      console.log('Text selected:', cfiRange)
      
      const selection = contents.window.getSelection()
      if (selection && selection.toString().length > 0) {
        setSelectedText(selection.toString())
        setCurrentSelection({ cfiRange, contents })
        setShowCommentBox(true)
      }
    })

    // Add existing annotations to the rendition when loaded
    setTimeout(() => {
      annotations.forEach((annotation) => {
        rendition.annotations.add(
          'highlight',
          annotation.cfiRange,
          {},
          null,
          'hl',
          { fill: annotation.color, 'fill-opacity': '0.3', 'mix-blend-mode': 'multiply' }
        )
      })
    }, 1000)
  }, [])

  const addAnnotation = async () => {
    if (!currentSelection || !commentText.trim()) return

    const newAnnotation: Annotation = {
      key: Date.now().toString(),
      cfiRange: currentSelection.cfiRange,
      text: selectedText,
      comment: commentText,
      color: selectedColor,
      created: new Date()
    }

    try {
      // Add to rendition
      if (renditionRef.current) {
        renditionRef.current.annotations.add(
          'highlight',
          newAnnotation.cfiRange,
          {},
          null,
          'hl',
          { fill: selectedColor, 'fill-opacity': '0.3', 'mix-blend-mode': 'multiply' }
        )
      }

      // Save to backend
      const response = await fetch('http://localhost:3001/api/annotations/personal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          epubId: 'alice',
          cfiRange: newAnnotation.cfiRange,
          text: newAnnotation.text,
          comment: newAnnotation.comment,
          color: newAnnotation.color
        })
      })

      if (response.ok) {
        setAnnotations(prev => [...prev, newAnnotation])
        setShowCommentBox(false)
        setCommentText('')
        setCurrentSelection(null)
      }
    } catch (error) {
      console.error('Error saving annotation:', error)
    }
  }

  const removeAnnotation = async (annotation: Annotation) => {
    try {
      // Remove from backend
      const response = await fetch(`http://localhost:3001/api/annotations/personal/${annotation.key}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        // Remove from rendition
        if (renditionRef.current) {
          renditionRef.current.annotations.remove(annotation.cfiRange, 'highlight')
        }

        // Remove from local state
        setAnnotations(prev => prev.filter(a => a.key !== annotation.key))
      }
    } catch (error) {
      console.error('Error removing annotation:', error)
    }
  }

  const navigateToAnnotation = (cfiRange: string) => {
    if (renditionRef.current) {
      renditionRef.current.display(cfiRange)
    }
  }

  const cancelComment = () => {
    setShowCommentBox(false)
    setCommentText('')
    setCurrentSelection(null)
    
    // Clear selection
    if (renditionRef.current) {
      const contents = renditionRef.current.getContents()
      contents.forEach((content: any) => {
        if (content.window.getSelection) {
          content.window.getSelection().removeAllRanges()
        }
      })
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      {/* Main Reader */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0 }}>📚 EPUB Reader avec Annotations (Admin: {user.name})</h1>
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

        {/* Reader */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactReader
            url={epubUrl}
            title="Alice au Pays des Merveilles"
            location={location}
            locationChanged={locationChanged}
            getRendition={getRendition}
            readerStyles={{
              ...ReactReaderStyle,
              readerArea: {
                ...ReactReaderStyle.readerArea,
                transition: undefined
              }
            }}
          />
        </div>

        {/* Comment Box Overlay */}
        {showCommentBox && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            border: '2px solid #2563eb',
            borderRadius: '8px',
            padding: '1.5rem',
            minWidth: '400px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2563eb' }}>💭 Ajouter une annotation</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Texte sélectionné:</strong>
              <div style={{ 
                backgroundColor: '#f3f4f6', 
                padding: '0.5rem', 
                borderRadius: '4px',
                fontStyle: 'italic',
                maxHeight: '100px',
                overflow: 'auto'
              }}>
                "{selectedText}"
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Couleur de surlignage:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['#ffeb3b', '#4caf50', '#2196f3', '#ff9800', '#f44336'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: color,
                      border: selectedColor === color ? '3px solid #000' : '1px solid #ccc',
                      borderRadius: '50%',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ajoutez votre commentaire..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={addAnnotation}
                disabled={!commentText.trim()}
                style={{
                  backgroundColor: commentText.trim() ? '#2563eb' : '#ccc',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: commentText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                ✅ Sauvegarder
              </button>
              <button
                onClick={cancelComment}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ❌ Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Annotations Sidebar */}
      <div style={{
        width: '350px',
        backgroundColor: '#f8f9fa',
        borderLeft: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Sidebar Header */}
        <div style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0 }}>📝 Mes Annotations ({annotations.length})</h3>
        </div>

        {/* Annotations List */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem'
        }}>
          {annotations.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '2rem' }}>
              <p>Aucune annotation pour le moment.</p>
              <p style={{ fontSize: '0.875rem' }}>
                💡 Sélectionnez du texte dans le livre pour ajouter une annotation.
              </p>
            </div>
          ) : (
            annotations.map((annotation) => (
              <div
                key={annotation.key}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderLeft: `4px solid ${annotation.color}`
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  {annotation.created.toLocaleString()}
                </div>
                
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontStyle: 'italic'
                }}>
                  "{annotation.text.length > 100 ? annotation.text.substring(0, 100) + '...' : annotation.text}"
                </div>

                <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <strong>Commentaire:</strong> {annotation.comment}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => navigateToAnnotation(annotation.cfiRange)}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    📍 Aller
                  </button>
                  <button
                    onClick={() => removeAnnotation(annotation)}
                    style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Suppr.
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}