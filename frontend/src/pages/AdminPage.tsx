import { useEffect, useState } from 'react'
import { 
  Users, 
  BookOpen, 
  MessageCircle, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Settings,
  Upload,
  Plus
} from 'lucide-react'
import { User } from '../types'

interface AdminPageProps {
  user: User
}

interface DashboardStats {
  totalUsers: number
  totalBooks: number
  totalSharedReadings: number
  totalAnnotations: number
  activeReadings: number
  annotationsToday: number
}

interface RecentUser {
  id: string
  name: string
  email: string
  status: string
  createdAt: string
}

interface PopularBook {
  id: string
  title: string
  author: string
  _count: {
    sharedReadings: number
  }
}

export default function AdminPage({ user }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [popularBooks, setPopularBooks] = useState<PopularBook[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // TODO: Remplacer par de vrais appels API
      const mockStats: DashboardStats = {
        totalUsers: 247,
        totalBooks: 35,
        totalSharedReadings: 18,
        totalAnnotations: 1234,
        activeReadings: 12,
        annotationsToday: 45
      }

      const mockRecentUsers: RecentUser[] = [
        {
          id: '1',
          name: 'Alice Martin',
          email: 'alice@example.com',
          status: 'USER',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Bob Dupont',
          email: 'bob@example.com',
          status: 'USER',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]

      const mockPopularBooks: PopularBook[] = [
        {
          id: '1',
          title: 'Les Misérables',
          author: 'Victor Hugo',
          _count: { sharedReadings: 8 }
        },
        {
          id: '2',
          title: 'Voyage au centre de la Terre',
          author: 'Jules Verne',
          _count: { sharedReadings: 5 }
        }
      ]

      setStats(mockStats)
      setRecentUsers(mockRecentUsers)
      setPopularBooks(mockPopularBooks)
      setLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'books', label: 'Livres', icon: BookOpen },
    { id: 'readings', label: 'Lectures partagées', icon: MessageCircle },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre plateforme de lecture sociale
        </p>
      </div>

      <div className="flex space-x-8">
        {/* Navigation latérale */}
        <div className="w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Contenu principal */}
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <DashboardTab 
              stats={stats!} 
              recentUsers={recentUsers} 
              popularBooks={popularBooks} 
            />
          )}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'books' && <BooksTab />}
          {activeTab === 'readings' && <ReadingsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </div>
    </div>
  )
}

function DashboardTab({ 
  stats, 
  recentUsers, 
  popularBooks 
}: { 
  stats: DashboardStats
  recentUsers: RecentUser[]
  popularBooks: PopularBook[]
}) {
  const statCards = [
    {
      title: 'Utilisateurs totaux',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Livres disponibles',
      value: stats.totalBooks,
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      title: 'Lectures partagées',
      value: stats.totalSharedReadings,
      icon: MessageCircle,
      color: 'text-purple-600'
    },
    {
      title: 'Annotations totales',
      value: stats.totalAnnotations,
      icon: TrendingUp,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-card border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Utilisateurs récents */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Nouveaux utilisateurs
          </h3>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <span className="text-xs bg-muted px-2 py-1 rounded">
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Livres populaires */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <BookOpen className="h-5 w-5 mr-2" />
            Livres populaires
          </h3>
          <div className="space-y-3">
            {popularBooks.map((book) => (
              <div key={book.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                </div>
                <span className="text-sm text-primary font-medium">
                  {book._count.sharedReadings} lectures
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Activité d'aujourd'hui
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats.activeReadings}</p>
            <p className="text-sm text-muted-foreground">Lectures actives</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.annotationsToday}</p>
            <p className="text-sm text-muted-foreground">Annotations créées</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{recentUsers.length}</p>
            <p className="text-sm text-muted-foreground">Nouveaux utilisateurs</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsersTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gestion des utilisateurs</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4" />
          <span>Inviter un utilisateur</span>
        </button>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground">
          Interface de gestion des utilisateurs en développement...
        </p>
      </div>
    </div>
  )
}

function BooksTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gestion des livres</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Upload className="h-4 w-4" />
          <span>Ajouter un livre</span>
        </button>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground">
          Interface de gestion des livres en développement...
        </p>
      </div>
    </div>
  )
}

function ReadingsTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Lectures partagées</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          <Plus className="h-4 w-4" />
          <span>Créer une lecture</span>
        </button>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground">
          Interface de gestion des lectures partagées en développement...
        </p>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Paramètres système</h2>

      <div className="bg-card border rounded-lg p-6">
        <p className="text-muted-foreground">
          Paramètres système en développement...
        </p>
      </div>
    </div>
  )
}