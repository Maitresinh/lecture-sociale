import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadReadings()
  }, [searchTerm, filterStatus, currentPage])

  const loadReadings = async () => {
    setLoading(true)
    try {
      // TODO: Remplacer par un appel API réel
      const mockReadings: SharedReading[] = [
        {
          id: '1',
          bookId: '1',
          title: 'Découvrons ensemble Les Misérables',
          description: 'Une lecture collaborative du chef-d\'œuvre de Victor Hugo. Plongeons dans cette fresque sociale du XIXe siècle et partageons nos réflexions sur ce récit intemporel.',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          isPublic: true,
          book: {
            id: '1',
            title: 'Les Misérables',
            author: 'Victor Hugo',
            description: 'Roman historique français',
            coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop',
            epubUrl: '/books/les-miserables.epub',
            totalPages: 1200,
            createdAt: new Date()
          },
          createdBy: 'admin',
          creator: {
            id: 'admin',
            name: 'Marie Dubois',
            email: 'marie@example.com',
            status: 'admin',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
            createdAt: new Date()
          },
          participants: Array.from({ length: 15 }, (_, i) => ({
            id: `p${i}`,
            sharedReadingId: '1',
            userId: `user${i}`,
            user: {
              id: `user${i}`,
              name: `Lecteur ${i + 1}`,
              email: `lecteur${i + 1}@example.com`,
              status: 'user' as const,
              createdAt: new Date()
            },
            joinedAt: new Date(),
            progress: Math.random()
          })),
          annotations: [],
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          bookId: '2',
          title: 'Voyage au centre de la Terre - Club de lecture',
          description: 'Embarquons pour une aventure extraordinaire avec Jules Verne ! Une lecture parfaite pour découvrir les merveilles de la science-fiction classique.',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-03-15'),
          isPublic: true,
          book: {
            id: '2',
            title: 'Voyage au centre de la Terre',
            author: 'Jules Verne',
            description: 'Roman d\'aventures et de science-fiction',
            coverUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
            epubUrl: '/books/voyage-centre-terre.epub',
            totalPages: 300,
            createdAt: new Date()
          },
          createdBy: 'user1',
          creator: {
            id: 'user1',
            name: 'Pierre Martin',
            email: 'pierre@example.com',
            status: 'author',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
            createdAt: new Date()
          },
          participants: Array.from({ length: 8 }, (_, i) => ({
            id: `p2${i}`,
            sharedReadingId: '2',
            userId: `user2${i}`,
            user: {
              id: `user2${i}`,
              name: `Aventurier ${i + 1}`,
              email: `aventurier${i + 1}@example.com`,
              status: 'user' as const,
              createdAt: new Date()
            },
            joinedAt: new Date(),
            progress: Math.random()
          })),
          annotations: [],
          createdAt: new Date('2024-01-15')
        },
        {
          id: '3',
          bookId: '3',
          title: 'Le Petit Prince - Lecture philosophique',
          description: 'Redécouvrons ensemble ce conte philosophique intemporel. Une lecture qui nous invite à retrouver notre regard d\'enfant sur le monde.',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans une semaine
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Dans un mois
          isPublic: true,
          book: {
            id: '3',
            title: 'Le Petit Prince',
            author: 'Antoine de Saint-Exupéry',
            description: 'Conte philosophique et poétique',
            coverUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop',
            epubUrl: '/books/petit-prince.epub',
            totalPages: 120,
            createdAt: new Date()
          },
          createdBy: 'user3',
          creator: {
            id: 'user3',
            name: 'Sophie Laurent',
            email: 'sophie@example.com',
            status: 'translator',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b2e0a45b?w=100&h=100&fit=crop&crop=face',
            createdAt: new Date()
          },
          participants: Array.from({ length: 3 }, (_, i) => ({
            id: `p3${i}`,
            sharedReadingId: '3',
            userId: `user3${i}`,
            user: {
              id: `user3${i}`,
              name: `Rêveur ${i + 1}`,
              email: `reveur${i + 1}@example.com`,
              status: 'user' as const,
              createdAt: new Date()
            },
            joinedAt: new Date(),
            progress: 0
          })),
          annotations: [],
          createdAt: new Date()
        }
      ]

      // Filtrage simple côté client (en production, cela se ferait côté serveur)
      let filteredReadings = mockReadings

      if (searchTerm) {
        filteredReadings = filteredReadings.filter(reading =>
          reading.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reading.book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reading.book.author.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      const now = new Date()
      if (filterStatus === 'active') {
        filteredReadings = filteredReadings.filter(r => 
          new Date(r.startDate) <= now && new Date(r.endDate) >= now
        )
      } else if (filterStatus === 'upcoming') {
        filteredReadings = filteredReadings.filter(r => new Date(r.startDate) > now)
      } else if (filterStatus === 'ended') {
        filteredReadings = filteredReadings.filter(r => new Date(r.endDate) < now)
      }

      setReadings(filteredReadings)
      setLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
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
                      {reading.creator.status !== 'user' && (
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {reading.creator.status === 'admin' ? 'Admin' :
                           reading.creator.status === 'author' ? 'Auteur' :
                           reading.creator.status === 'translator' ? 'Traducteur' :
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
                      <span>{reading.annotations.length} annotations</span>
                    </div>
                  </div>

                  {/* Action */}
                  {statusInfo.status !== 'ended' ? (
                    <Link 
                      to={`/lecture/${reading.id}`}
                      className="block w-full text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {statusInfo.status === 'upcoming' ? 'Rejoindre' : 'Continuer la lecture'}
                    </Link>
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