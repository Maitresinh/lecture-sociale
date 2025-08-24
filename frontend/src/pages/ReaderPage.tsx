import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Users, Clock, ArrowLeft, Share2 } from 'lucide-react'
import SimpleEpubReader from '../components/SimpleEpubReader'
import { User, SharedReading, Annotation } from '../types'
import { calculateTimeRemaining, formatDateTime } from '../lib/utils'

interface ReaderPageProps {
  user: User
}

export default function ReaderPage({ user }: ReaderPageProps) {
  const { sharedReadingId } = useParams<{ sharedReadingId: string }>()
  const navigate = useNavigate()
  
  const [sharedReading, setSharedReading] = useState<SharedReading | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [currentCfi, setCurrentCfi] = useState('')
  const [progress, setProgress] = useState(0)
  const progressTimeout = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!sharedReadingId) return

    const loadSharedReading = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }

        // Charger les données de la lecture partagée
        const response = await fetch(`http://localhost:3001/api/shared-readings/${sharedReadingId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          const reading = result.data
          
          // Trouver la progression de l'utilisateur actuel
          const userParticipant = reading.participants.find((p: any) => p.userId === user.id)
          if (userParticipant) {
            setProgress(userParticipant.progress || 0)
          }
          
          setSharedReading(reading)
          setAnnotations(reading.annotations || [])
        } else {
          // Si pas d'accès, essayer de voir si c'est une lecture publique
          console.error('Erreur lors du chargement de la lecture')
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        setLoading(false)
      }
    }

    loadSharedReading()
  }, [sharedReadingId, user.id])

  const handleAddAnnotation = async (newAnnotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt' | 'user'>) => {
    // TODO: Appel API pour ajouter l'annotation
    const annotation: Annotation = {
      ...newAnnotation,
      id: `ann-${Date.now()}`,
      sharedReadingId: sharedReadingId!,
      user: user,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setAnnotations(prev => [...prev, annotation])
  }

  const handleLocationChange = (cfi: string, newProgress: number) => {
    setCurrentCfi(cfi)
    setProgress(newProgress)
    
    // Annuler le timeout précédent s'il existe
    if (progressTimeout.current) {
      clearTimeout(progressTimeout.current)
    }
    
    // Sauvegarder la progression après un délai (throttling)
    progressTimeout.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token || !sharedReadingId) return

        await fetch(`http://localhost:3001/api/shared-readings/${sharedReadingId}/progress`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            progress: newProgress,
            cfi: cfi
          })
        })
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la progression:', error)
      }
    }, 1000) // Attendre 1 seconde avant de sauvegarder
  }

  const shareReading = () => {
    if (!sharedReading) return

    const shareText = `Je lis "${sharedReading.book.title}" de ${sharedReading.book.author} en lecture collaborative ! #LectureSociale`
    const shareUrl = window.location.href

    if (navigator.share) {
      navigator.share({
        title: sharedReading.title,
        text: shareText,
        url: shareUrl
      })
    } else {
      // Fallback vers Twitter
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
      window.open(twitterUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!sharedReading) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Lecture non trouvée</h1>
        <p className="text-muted-foreground mb-4">
          Cette lecture n'existe pas ou vous n'y avez pas accès.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  const timeRemaining = calculateTimeRemaining(sharedReading.endDate)

  return (
    <div className="h-screen flex flex-col">
      {/* En-tête de la lecture */}
      <div className="bg-card border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-accent rounded-md transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            
            <div>
              <h1 className="font-semibold text-lg line-clamp-1">
                {sharedReading.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {sharedReading.book.author} • {sharedReading.book.title}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Participants */}
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{sharedReading.participants.length}</span>
            </div>

            {/* Temps restant */}
            {timeRemaining.total > 0 && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-primary">
                    {timeRemaining.days > 0 && `${timeRemaining.days}j `}
                    {String(timeRemaining.hours).padStart(2, '0')}:
                    {String(timeRemaining.minutes).padStart(2, '0')}:
                    {String(timeRemaining.seconds).padStart(2, '0')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    jusqu'au {formatDateTime(sharedReading.endDate)}
                  </div>
                </div>
              </div>
            )}

            {/* Partage */}
            <button
              onClick={shareReading}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Partager cette lecture"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progression</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lecteur EPUB */}
      <div className="flex-1 overflow-hidden">
        <SimpleEpubReader
          epubUrl={`http://localhost:3001${sharedReading.book.epubUrl}`}
          user={user}
          annotations={annotations}
          onAddAnnotation={handleAddAnnotation}
          onLocationChange={handleLocationChange}
        />
      </div>
    </div>
  )
}