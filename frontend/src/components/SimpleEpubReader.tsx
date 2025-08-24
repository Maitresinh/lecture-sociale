import { useState, useRef } from 'react'
import { ReactReader } from 'react-reader'
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { User, Annotation } from '../types'

interface SimpleEpubReaderProps {
  epubUrl: string
  user: User
  annotations: Annotation[]
  onAddAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt' | 'user'>) => void
  onLocationChange: (cfi: string, progress: number) => void
}

export default function SimpleEpubReader({ 
  epubUrl, 
  user, 
  annotations, 
  onAddAnnotation, 
  onLocationChange 
}: SimpleEpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0)
  const renditionRef = useRef<any>(null)
  
  console.log('SimpleEpubReader - Loading EPUB from:', epubUrl)

  const locationChanged = (epubcfi: string) => {
    setLocation(epubcfi)
    // Calculer la progression approximative
    const progress = 0.1 // TODO: calculer la vraie progression
    onLocationChange(epubcfi, progress)
  }

  const goNext = () => {
    if (renditionRef.current) {
      renditionRef.current.next()
    }
  }

  const goPrev = () => {
    if (renditionRef.current) {
      renditionRef.current.prev()
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={goPrev}
            className="p-2 rounded-md hover:bg-accent"
            title="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goNext}
            className="p-2 rounded-md hover:bg-accent"
            title="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Position: {typeof location === 'string' ? location.slice(0, 20) + '...' : location}
          </span>
          <button className="p-2 rounded-md hover:bg-accent">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Lecteur */}
      <div className="flex-1 relative">
        <ReactReader
          url={epubUrl}
          title="Lecture"
          location={location}
          locationChanged={locationChanged}
          getRendition={(rendition) => {
            renditionRef.current = rendition
            console.log('SimpleEpubReader - Rendition loaded:', rendition)
          }}
          readerStyles={{
            ...ReactReader.defaultStyles,
            readerArea: {
              ...ReactReader.defaultStyles.readerArea,
              transition: undefined,
            },
          }}
        />
      </div>

      {/* Annotations (placeholder) */}
      <div className="p-4 border-t bg-muted/50">
        <p className="text-xs text-muted-foreground">
          Annotations: {annotations.length} | User: {user.name}
        </p>
      </div>
    </div>
  )
}