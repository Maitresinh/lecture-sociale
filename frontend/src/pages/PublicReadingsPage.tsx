import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  Users, 
  Clock, 
  Search, 
  Filter,
  Calendar,
  User,
  MessageCircle
} from 'lucide-react'
import { SharedReading } from '../types'
import { calculateTimeRemaining, formatDate } from '../lib/utils'

export default function PublicReadingsPage() {
  const [readings, setReadings] = useState<SharedReading[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'ended'>('active')

  useEffect(() => {
    loadReadings()
  }, [searchTerm, filterStatus])

  const loadReadings = async () => {
    setLoading(true)
    try {
      // Charger les vraies lectures depuis l'API
      const response = await fetch('http://localhost:3001/api/shared-readings/public')
      if (response.ok) {
        const result = await response.json()
        let readings = result.data.sharedReadings || []
        
        // Filtrage simple côté client
        if (searchTerm) {
          readings = readings.filter((reading: SharedReading) =>
            reading.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reading.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reading.book.author.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        const now = new Date()
        if (filterStatus === 'active') {
          readings = readings.filter((r: SharedReading) => 
            new Date(r.startDate) <= now && new Date(r.endDate) >= now
          )
        } else if (filterStatus === 'upcoming') {
          readings = readings.filter((r: SharedReading) => new Date(r.startDate) > now)
        } else if (filterStatus === 'ended') {
          readings = readings.filter((r: SharedReading) => new Date(r.endDate) < now)
        }

        setReadings(readings)
      } else {
        console.error('API failed, no readings available')
        setReadings([])
      }
    } catch (error) {
      console.error('Error loading readings:', error)
      setReadings([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (reading: SharedReading) => {
    const now = new Date()
    const startDate = new Date(reading.startDate)
    const endDate = new Date(reading.endDate)

    if (now < startDate) {
      return {
        status: 'upcoming',
        label: 'À venir',
        color: 'text-blue-600 bg-blue-100',
        timeInfo: `Débute le ${formatDate(startDate)}`
      }
    } else if (now > endDate) {
      return {
        status: 'ended',
        label: 'Terminée',
        color: 'text-gray-600 bg-gray-100',
        timeInfo: `Terminée le ${formatDate(endDate)}`
      }
    } else {
      const timeRemaining = calculateTimeRemaining(endDate)
      return {
        status: 'active',
        label: 'En cours',
        color: 'text-green-600 bg-green-100',
        timeInfo: timeRemaining.total > 0 ? 
          `${timeRemaining.days > 0 ? `${timeRemaining.days}j ` : ''}${timeRemaining.hours}h ${timeRemaining.minutes}m restantes` :
          'Se termine bientôt'
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Lectures Partagées</h1>
        <p className="text-muted-foreground text-lg">
          Découvrez et rejoignez des lectures collaboratives passionnantes
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par titre, livre ou auteur..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Filtre par statut */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="pl-10 pr-8 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring appearance-none bg-background"
            >
              <option value="all">Toutes les lectures</option>
              <option value="active">En cours</option>
              <option value="upcoming">À venir</option>
              <option value="ended">Terminées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des lectures */}
      {readings.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {readings.map((reading) => {
            const statusInfo = getStatusInfo(reading)
            
            return (
              <div key={reading.id} className="bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image de couverture */}
                <div className="aspect-[3/4] bg-muted relative">
                  {reading.book.coverUrl ? (
                    <img 
                      src={reading.book.coverUrl} 
                      alt={reading.book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Badge de statut */}
                  <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-2 mb-1">
                      {reading.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {reading.book.author} • {reading.book.title}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {reading.description}
                  </p>

                  {/* Informations temporelles */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{statusInfo.timeInfo}</span>
                  </div>

                  {/* Créateur et participants */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Par</span>
                      <span className="font-medium">{reading.creator.name}</span>
                      {reading.creator.status !== 'USER' && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {reading.creator.status === 'ADMIN' ? 'Admin' :
                           reading.creator.status === 'AUTHOR' ? 'Auteur' :
                           reading.creator.status === 'TRANSLATOR' ? 'Traducteur' :
                           'Invité'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{reading.participants.length} participants</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      <span>{reading._count?.annotations || reading.annotations?.length || 0} annotations</span>
                    </div>
                  </div>

                  {/* Action */}
                  {statusInfo.status !== 'ended' ? (
                    <JoinReadingButton reading={reading} statusInfo={statusInfo} />
                  ) : (
                    <Link 
                      to={`/lecture/${reading.id}`}
                      className="block w-full text-center px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
                    >
                      Voir les annotations
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune lecture trouvée</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all' ? 
              'Essayez de modifier vos critères de recherche' :
              'Aucune lecture publique n\'est disponible pour le moment'
            }
          </p>
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
              }}
              className="px-4 py-2 text-primary hover:underline"
            >
              Voir toutes les lectures
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function JoinReadingButton({ reading, statusInfo }: { reading: SharedReading, statusInfo: any }) {
  const navigate = useNavigate()
  const [isJoining, setIsJoining] = useState(false)

  const handleJoin = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch(`http://localhost:3001/api/shared-readings/${reading.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      })

      if (response.ok) {
        // Rejoindre réussi, rediriger vers la lecture
        navigate(`/lecture/${reading.id}`)
      } else {
        const error = await response.json()
        if (error.error === 'Vous participez déjà à cette lecture') {
          // Déjà participant, aller directement à la lecture
          navigate(`/lecture/${reading.id}`)
        } else {
          alert(`Erreur: ${error.error}`)
        }
      }
    } catch (error) {
      alert(`Erreur: ${error}`)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <button 
      onClick={handleJoin}
      disabled={isJoining}
      className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {isJoining ? 'Connexion...' : 
       statusInfo.status === 'upcoming' ? 'Rejoindre' : 'Continuer la lecture'}
    </button>
  )
}