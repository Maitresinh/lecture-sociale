import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, BookOpen, ArrowRight } from 'lucide-react'
import { User, SharedReading } from '../types'
import { calculateTimeRemaining, formatDate } from '../lib/utils'

interface HomePageProps {
  user: User | null
}

export default function HomePage({ user }: HomePageProps) {
  const [myReadings, setMyReadings] = useState<SharedReading[]>([])
  const [featuredReadings, setFeaturedReadings] = useState<SharedReading[]>([])

  useEffect(() => {
    // TODO: Récupérer les données depuis l'API
    // Pour l'instant, données fictives
    if (user) {
      const mockMyReadings: SharedReading[] = [
        {
          id: '1',
          bookId: '1',
          title: 'Lecture collaborative - Les Misérables',
          description: 'Découvrons ensemble ce chef-d\'oeuvre de Victor Hugo',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          isPublic: true,
          book: {
            id: '1',
            title: 'Les Misérables',
            author: 'Victor Hugo',
            description: 'Un roman historique français qui décrit la vie de diverses personnes en France au début du XIXe siècle.',
            epubUrl: '/books/les-miserables.epub',
            totalPages: 1200,
            createdAt: new Date()
          },
          createdBy: 'admin',
          creator: {
            id: 'admin',
            name: 'Admin',
            email: 'admin@lecture-sociale.fr',
            status: 'admin',
            createdAt: new Date()
          },
          participants: [],
          annotations: [],
          createdAt: new Date()
        }
      ]
      setMyReadings(mockMyReadings)
    }

    // Lectures en vedette
    const mockFeatured: SharedReading[] = [
      {
        id: '2',
        bookId: '2',
        title: 'Club de lecture - Voyage au centre de la Terre',
        description: 'Une aventure extraordinaire de Jules Verne',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        isPublic: true,
        book: {
          id: '2',
          title: 'Voyage au centre de la Terre',
          author: 'Jules Verne',
          description: 'Roman d\\'aventures et de science-fiction.',
          epubUrl: '/books/voyage-centre-terre.epub',
          totalPages: 300,
          createdAt: new Date()
        },
        createdBy: 'user1',
        creator: {
          id: 'user1',
          name: 'Marie Dubois',
          email: 'marie@example.com',
          status: 'user',
          createdAt: new Date()
        },
        participants: [],
        annotations: [],
        createdAt: new Date()
      }
    ]
    setFeaturedReadings(mockFeatured)
  }, [user])

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <BookOpen className="h-16 w-16 mx-auto text-primary mb-6" />
        <h1 className="text-4xl font-bold mb-4">
          Bienvenue sur Lecture Sociale
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Découvrez une nouvelle façon de lire : partagez vos lectures, 
          annotez ensemble, et enrichissez votre expérience littéraire 
          avec une communauté passionnée.
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 border rounded-lg">
            <Users className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Lecture Collaborative</h3>
            <p className="text-muted-foreground text-sm">
              Rejoignez des groupes de lecture et partagez vos réflexions
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <BookOpen className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Annotations Partagées</h3>
            <p className="text-muted-foreground text-sm">
              Ajoutez vos commentaires et découvrez ceux des autres lecteurs
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <ArrowRight className="h-8 w-8 text-primary mb-4" />
            <h3 className="font-semibold mb-2">Partage Social</h3>
            <p className="text-muted-foreground text-sm">
              Partagez vos citations favorites sur les réseaux sociaux
            </p>
          </div>
        </div>

        <div className="space-x-4">
          <Link 
            to="/login" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Commencer la lecture
          </Link>
          <Link 
            to="/lectures-publiques" 
            className="inline-flex items-center px-6 py-3 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Explorer les lectures
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Bonjour {user.name} ! 👋
        </h1>
        <p className="text-muted-foreground">
          Prêt pour votre prochaine aventure littéraire ?
        </p>
      </div>

      {/* Mes lectures en cours */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Mes lectures en cours</h2>
        {myReadings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myReadings.map((reading) => (
              <ReadingCard key={reading.id} reading={reading} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border rounded-lg bg-muted/20">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas encore rejoint de lecture collaborative
            </p>
            <Link 
              to="/lectures-publiques"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Explorer les lectures disponibles
            </Link>
          </div>
        )}
      </section>

      {/* Lectures en vedette */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Lectures en vedette</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredReadings.map((reading) => (
            <ReadingCard key={reading.id} reading={reading} />
          ))}
        </div>
      </section>
    </div>
  )
}

function ReadingCard({ reading }: { reading: SharedReading }) {
  const timeRemaining = calculateTimeRemaining(reading.endDate)

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="aspect-[3/4] bg-muted rounded mb-4 flex items-center justify-center">
        {reading.book.coverUrl ? (
          <img 
            src={reading.book.coverUrl} 
            alt={reading.book.title}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <BookOpen className="h-16 w-16 text-muted-foreground" />
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold line-clamp-2">{reading.title}</h3>
        <p className="text-sm text-muted-foreground">
          {reading.book.author} • {reading.book.title}
        </p>
        
        {timeRemaining.total > 0 ? (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>
              {timeRemaining.days > 0 && `${timeRemaining.days}j `}
              {timeRemaining.hours}h {timeRemaining.minutes}m restantes
            </span>
          </div>
        ) : (
          <p className="text-sm text-red-600">Lecture terminée</p>
        )}
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          <span>{reading.participants.length} participants</span>
        </div>
      </div>
      
      <Link 
        to={`/lecture/${reading.id}`}
        className="block w-full mt-4 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        Continuer la lecture
      </Link>
    </div>
  )
}