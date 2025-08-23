import { useEffect, useRef, useState } from 'react'
import ePub, { Book, Rendition } from 'epubjs'
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  BookOpen, 
  MessageCircle,
  Share2,
  Palette
} from 'lucide-react'
import { Annotation, User } from '../types'

interface EpubReaderProps {
  epubUrl: string
  user: User
  annotations: Annotation[]
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt' | 'user'>) => void
  onLocationChange: (cfi: string, progress: number) => void
}

export default function EpubReader({ 
  epubUrl, 
  user, 
  annotations, 
  onAddAnnotation, 
  onLocationChange 
}: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<Book | null>(null)
  const renditionRef = useRef<Rendition | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionCfi, setSelectionCfi] = useState('')
  const [annotationContent, setAnnotationContent] = useState('')
  
  // Paramètres de lecture
  const [fontSize, setFontSize] = useState(18)
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light')
  const [fontFamily, setFontFamily] = useState('serif')

  useEffect(() => {
    if (!viewerRef.current || !epubUrl) return

    const initReader = async () => {
      try {
        // Créer le livre
        const book = ePub(epubUrl)
        bookRef.current = book

        // Créer le rendu
        const rendition = book.renderTo(viewerRef.current!, {
          width: '100%',
          height: '100%',
          spread: 'none'
        })
        renditionRef.current = rendition

        // Afficher le livre
        await rendition.display()

        // Appliquer les styles
        applyStyles()

        // Gérer les événements de sélection
        rendition.on('selected', (cfiRange: string, contents: any) => {
          const selection = contents.window.getSelection()
          if (selection && selection.toString().trim()) {
            setSelectedText(selection.toString().trim())
            setSelectionCfi(cfiRange)
          }
        })

        // Gérer les changements de localisation
        rendition.on('relocated', (location: any) => {
          const cfi = location.start.cfi
          const progress = location.start.percentage || 0
          
          setCurrentLocation(cfi)
          onLocationChange(cfi, progress)
        })

        // Charger les annotations existantes
        loadAnnotations()

        setIsLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement du livre:', error)
        setIsLoading(false)
      }
    }

    initReader()

    // Nettoyage
    return () => {
      if (renditionRef.current) {
        renditionRef.current.destroy()
      }
    }
  }, [epubUrl])

  const applyStyles = () => {
    if (!renditionRef.current) return

    const themes = {
      light: {
        body: { color: '#000', background: '#fff' }
      },
      dark: {
        body: { color: '#fff', background: '#1a1a1a' }
      },
      sepia: {
        body: { color: '#5c4b37', background: '#f7f3e9' }
      }
    }

    const fontFamilies = {
      serif: 'Georgia, serif',
      'sans-serif': 'Arial, sans-serif',
      monospace: 'Monaco, monospace'
    }

    renditionRef.current.themes.register(theme, themes[theme])
    renditionRef.current.themes.select(theme)
    
    renditionRef.current.themes.fontSize(`${fontSize}px`)
    renditionRef.current.themes.font(fontFamilies[fontFamily as keyof typeof fontFamilies])
  }

  const loadAnnotations = () => {
    if (!renditionRef.current) return

    // Effacer les annotations existantes
    renditionRef.current.annotations.remove('highlight')

    // Ajouter les nouvelles annotations
    annotations.forEach(annotation => {
      renditionRef.current!.annotations.add(
        'highlight',
        annotation.cfi,
        {},
        () => {
          // Action au clic sur l'annotation
          showAnnotationDetails(annotation)
        },
        'annotation-highlight',
        { fill: '#ffeb3b', 'fill-opacity': '0.3' }
      )
    })
  }

  const showAnnotationDetails = (annotation: Annotation) => {
    // TODO: Afficher les détails de l'annotation
    console.log('Annotation cliquée:', annotation)
  }

  const nextPage = () => {
    renditionRef.current?.next()
  }

  const prevPage = () => {
    renditionRef.current?.prev()
  }

  const addAnnotation = () => {
    if (!selectedText || !selectionCfi || !annotationContent.trim()) return

    const newAnnotation = {
      sharedReadingId: '', // À remplir par le parent
      userId: user.id,
      content: annotationContent,
      cfi: selectionCfi,
      selectedText: selectedText,
      page: 1, // TODO: Calculer la page actuelle
      isPublic: true
    }

    onAddAnnotation(newAnnotation)
    
    // Réinitialiser
    setSelectedText('')
    setSelectionCfi('')
    setAnnotationContent('')
  }

  const shareSelection = () => {
    if (!selectedText) return

    const shareText = `"${selectedText}"\n\n#LectureSociale`
    
    // Partage Twitter
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(twitterUrl, '_blank')
  }

  useEffect(() => {
    applyStyles()
  }, [fontSize, theme, fontFamily])

  useEffect(() => {
    loadAnnotations()
  }, [annotations])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-primary mb-4 animate-pulse" />
          <p className="text-muted-foreground">Chargement du livre...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center space-x-2">
          <button
            onClick={prevPage}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Page précédente"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextPage}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Page suivante"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`p-2 rounded-md transition-colors ${
              showAnnotations ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            title="Annotations"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors ${
              showSettings ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            title="Paramètres d'affichage"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Lecteur principal */}
        <div className="flex-1 relative">
          <div ref={viewerRef} className="epub-reader" />
          
          {/* Overlay pour sélection */}
          {selectedText && (
            <div className="absolute top-4 right-4 bg-card border rounded-lg p-4 shadow-lg max-w-sm">
              <p className="text-sm font-medium mb-2">Texte sélectionné :</p>
              <p className="text-sm text-muted-foreground italic mb-3 max-h-20 overflow-y-auto">
                "{selectedText}"
              </p>
              
              <textarea
                value={annotationContent}
                onChange={(e) => setAnnotationContent(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="w-full p-2 border rounded text-sm mb-3 resize-none"
                rows={2}
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={addAnnotation}
                  className="flex-1 px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                  disabled={!annotationContent.trim()}
                >
                  Annoter
                </button>
                <button
                  onClick={shareSelection}
                  className="px-3 py-1 border rounded text-sm hover:bg-accent"
                  title="Partager sur Twitter"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedText('')
                    setSelectionCfi('')
                    setAnnotationContent('')
                  }}
                  className="px-3 py-1 border rounded text-sm hover:bg-accent"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panneau des paramètres */}
        {showSettings && (
          <div className="w-80 border-l bg-card p-4 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Palette className="h-5 w-5" />
              <h3 className="font-semibold">Paramètres d'affichage</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Taille de police
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  A-
                </button>
                <span className="text-sm">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  A+
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Thème</label>
              <div className="space-y-2">
                {[
                  { key: 'light', label: 'Clair' },
                  { key: 'dark', label: 'Sombre' },
                  { key: 'sepia', label: 'Sépia' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="theme"
                      value={key}
                      checked={theme === key}
                      onChange={(e) => setTheme(e.target.value as typeof theme)}
                      className="text-primary"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Police</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans-serif</option>
                <option value="monospace">Monospace</option>
              </select>
            </div>
          </div>
        )}

        {/* Panneau des annotations */}
        {showAnnotations && (
          <div className="w-80 border-l bg-card p-4">
            <div className="flex items-center space-x-2 mb-4">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Annotations</h3>
              <span className="text-sm text-muted-foreground">
                ({annotations.length})
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {annotations.map((annotation) => (
                <div key={annotation.id} className="border rounded p-3 text-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-xs text-muted-foreground">
                      {annotation.user.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(annotation.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="italic text-muted-foreground mb-2 text-xs">
                    "{annotation.selectedText}"
                  </p>
                  
                  {annotation.content && (
                    <p className="text-sm">{annotation.content}</p>
                  )}
                </div>
              ))}

              {annotations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Aucune annotation pour le moment</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}