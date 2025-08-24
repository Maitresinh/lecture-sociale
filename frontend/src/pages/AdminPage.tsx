import { useEffect, useState, useRef } from 'react'
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Settings, 
  BarChart3, 
  Search,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle,
  X,
  UserPlus,
  FileText,
  Eye
} from 'lucide-react'
import { User } from '../types'

interface AdminPageProps {
  user: User
}

type Tab = 'dashboard' | 'users' | 'books' | 'readings' | 'settings'

interface AdminUser {
  id: string
  name: string
  email: string
  status: string
  createdAt: string
  _count: {
    annotations: number
    participations: number
  }
}

interface AdminBook {
  id: string
  title: string
  author: string
  description: string
  coverUrl: string
  createdAt: string
  _count: {
    sharedReadings: number
  }
}

interface AdminSharedReading {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  isPublic: boolean
  book: {
    id: string
    title: string
    author: string
  }
  creator: {
    name: string
  }
  _count: {
    participants: number
    annotations: number
  }
}

export default function AdminPage({ user }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalSharedReadings: 0,
    activeReadings: 0,
    totalAnnotations: 0
  })
  
  // Users management
  const [users, setUsers] = useState<AdminUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [userSearch, setUserSearch] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showImportCSV, setShowImportCSV] = useState(false)
  const [csvData, setCsvData] = useState('')
  
  // Books management
  const [books, setBooks] = useState<AdminBook[]>([])
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [bookSearch, setBookSearch] = useState('')
  const [showAddBook, setShowAddBook] = useState(false)
  
  // Shared readings management
  const [readings, setReadings] = useState<AdminSharedReading[]>([])
  const [showCreateReading, setShowCreateReading] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDashboard()
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'books') loadBooks()
    if (activeTab === 'readings') loadReadings()
  }, [activeTab])
  
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://localhost:3001/api/admin${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur API')
    }
    
    return response.json()
  }
  
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }
  
  const loadDashboard = async () => {
    try {
      const result = await apiCall('/dashboard')
      setStats(result.data.stats)
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    }
  }
  
  const loadUsers = async () => {
    try {
      setLoading(true)
      const result = await apiCall(`/users?search=${userSearch}&limit=100`)
      setUsers(result.data.users)
    } catch (error) {
      showMessage('error', `Erreur chargement utilisateurs: ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  const loadBooks = async () => {
    try {
      setLoading(true)
      const result = await apiCall(`/books?search=${bookSearch}&limit=100`)
      setBooks(result.data.books)
    } catch (error) {
      showMessage('error', `Erreur chargement livres: ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  const loadReadings = async () => {
    try {
      setLoading(true)
      const result = await apiCall('/shared-readings?limit=100')
      setReadings(result.data.sharedReadings)
    } catch (error) {
      showMessage('error', `Erreur chargement lectures: ${error}`)
    } finally {
      setLoading(false)
    }
  }
  
  const deleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return
    
    try {
      await apiCall(`/users/${userId}`, { method: 'DELETE' })
      setUsers(users.filter(u => u.id !== userId))
      showMessage('success', 'Utilisateur supprimé avec succès')
    } catch (error) {
      showMessage('error', `Erreur suppression: ${error}`)
    }
  }
  
  const deleteBook = async (bookId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) return
    
    try {
      await apiCall(`/books/${bookId}`, { method: 'DELETE' })
      setBooks(books.filter(b => b.id !== bookId))
      showMessage('success', 'Livre supprimé avec succès')
    } catch (error) {
      showMessage('error', `Erreur suppression: ${error}`)
    }
  }
  
  const deleteReading = async (readingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette lecture partagée ?')) return
    
    try {
      await apiCall(`/shared-readings/${readingId}`, { method: 'DELETE' })
      setReadings(readings.filter(r => r.id !== readingId))
      showMessage('success', 'Lecture supprimée avec succès')
    } catch (error) {
      showMessage('error', `Erreur suppression: ${error}`)
    }
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Tableau de bord', icon: BarChart3 },
    { id: 'users' as Tab, label: 'Utilisateurs', icon: Users },
    { id: 'books' as Tab, label: 'Livres', icon: BookOpen },
    { id: 'readings' as Tab, label: 'Lectures', icon: Calendar },
    { id: 'settings' as Tab, label: 'Paramètres', icon: Settings }
  ]

  const renderTabContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return <DashboardTab stats={stats} />
      case 'users':
        return (
          <UsersTab
            users={users}
            search={userSearch}
            setSearch={setUserSearch}
            onSearchChange={() => loadUsers()}
            onDelete={deleteUser}
            loading={loading}
            showAddUser={showAddUser}
            setShowAddUser={setShowAddUser}
            showImportCSV={showImportCSV}
            setShowImportCSV={setShowImportCSV}
            csvData={csvData}
            setCsvData={setCsvData}
            onReload={loadUsers}
            showMessage={showMessage}
          />
        )
      case 'books':
        return (
          <BooksTab
            books={books}
            search={bookSearch}
            setSearch={setBookSearch}
            onSearchChange={() => loadBooks()}
            onDelete={deleteBook}
            loading={loading}
            showAddBook={showAddBook}
            setShowAddBook={setShowAddBook}
            onReload={loadBooks}
            showMessage={showMessage}
          />
        )
      case 'readings':
        return (
          <ReadingsTab
            readings={readings}
            books={books}
            users={users}
            onDelete={deleteReading}
            loading={loading}
            showCreateReading={showCreateReading}
            setShowCreateReading={setShowCreateReading}
            onReload={loadReadings}
            showMessage={showMessage}
          />
        )
      case 'settings':
        return <SettingsTab />
      default:
        return null
    }
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
          {/* Message de notification */}
          {message && (
            <div className={`mb-4 p-3 rounded-md flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* Contenu de l'onglet */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

function DashboardTab({ stats }: { stats: any }) {
  const statCards = [
    { title: 'Utilisateurs totaux', value: stats.totalUsers, icon: Users, color: 'text-blue-600' },
    { title: 'Livres disponibles', value: stats.totalBooks, icon: BookOpen, color: 'text-green-600' },
    { title: 'Lectures partagées', value: stats.totalSharedReadings, icon: Calendar, color: 'text-purple-600' },
    { title: 'Annotations totales', value: stats.totalAnnotations, icon: FileText, color: 'text-orange-600' }
  ]

  return (
    <div className="space-y-6">
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
    </div>
  )
}

interface UsersTabProps {
  users: AdminUser[]
  search: string
  setSearch: (search: string) => void
  onSearchChange: () => void
  onDelete: (id: string) => void
  loading: boolean
  showAddUser: boolean
  setShowAddUser: (show: boolean) => void
  showImportCSV: boolean
  setShowImportCSV: (show: boolean) => void
  csvData: string
  setCsvData: (data: string) => void
  onReload: () => void
  showMessage: (type: 'success' | 'error', message: string) => void
}

function UsersTab({
  users,
  search,
  setSearch,
  onSearchChange,
  onDelete,
  loading,
  showAddUser,
  setShowAddUser,
  showImportCSV,
  setShowImportCSV,
  csvData,
  setCsvData,
  onReload,
  showMessage
}: UsersTabProps) {
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', status: 'USER' })

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      showMessage('success', 'Utilisateur créé avec succès')
      setNewUser({ name: '', email: '', password: '', status: 'USER' })
      setShowAddUser(false)
      onReload()
    } catch (error) {
      showMessage('error', `Erreur création utilisateur: ${error}`)
    }
  }

  const handleImportCSV = async () => {
    try {
      const lines = csvData.split('\n').filter(line => line.trim())
      const users = lines.slice(1).map(line => {
        const [name, email, status = 'USER'] = line.split(',').map(cell => cell.trim())
        return { name, email, status }
      })

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/admin/users/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ users })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const result = await response.json()
      showMessage('success', `Import terminé: ${result.data.created} créés, ${result.data.skipped} ignorés`)
      setCsvData('')
      setShowImportCSV(false)
      onReload()
    } catch (error) {
      showMessage('error', `Erreur import CSV: ${error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gestion des utilisateurs</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportCSV(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-border rounded-md hover:bg-accent"
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            <UserPlus className="h-4 w-4" />
            <span>Ajouter un utilisateur</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearchChange()}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md"
        />
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Inscrit le</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">Chargement...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.status === 'AUTHOR' ? 'bg-blue-100 text-blue-800' :
                        user.status === 'TRANSLATOR' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajouter utilisateur */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Ajouter un utilisateur</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Statut</label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="AUTHOR">Auteur</option>
                  <option value="TRANSLATOR">Traducteur</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex-1 border border-border py-2 rounded-md"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {showImportCSV && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Import CSV</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Format: nom,email,statut (une ligne par utilisateur)
            </p>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={`nom,email,statut\nAlice Martin,alice@example.com,USER\nBob Dupont,bob@example.com,AUTHOR`}
              className="w-full h-32 p-2 border border-border rounded-md text-sm"
            />
            <div className="flex space-x-2 pt-4">
              <button
                onClick={handleImportCSV}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-md"
              >
                Importer
              </button>
              <button
                onClick={() => setShowImportCSV(false)}
                className="flex-1 border border-border py-2 rounded-md"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface BooksTabProps {
  books: AdminBook[]
  search: string
  setSearch: (search: string) => void
  onSearchChange: () => void
  onDelete: (id: string) => void
  loading: boolean
  showAddBook: boolean
  setShowAddBook: (show: boolean) => void
  onReload: () => void
  showMessage: (type: 'success' | 'error', message: string) => void
}

function BooksTab({
  books,
  search,
  setSearch,
  onSearchChange,
  onDelete,
  loading,
  showAddBook,
  setShowAddBook,
  onReload,
  showMessage
}: BooksTabProps) {
  const [newBook, setNewBook] = useState({ title: '', author: '', description: '', coverUrl: '' })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      showMessage('error', 'Fichier EPUB requis')
      return
    }

    try {
      const formData = new FormData()
      formData.append('epub', selectedFile)
      formData.append('title', newBook.title)
      formData.append('author', newBook.author)
      formData.append('description', newBook.description)
      formData.append('coverUrl', newBook.coverUrl)

      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/admin/books', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      showMessage('success', 'Livre ajouté avec succès')
      setNewBook({ title: '', author: '', description: '', coverUrl: '' })
      setSelectedFile(null)
      setShowAddBook(false)
      onReload()
    } catch (error) {
      showMessage('error', `Erreur ajout livre: ${error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Gestion des livres</h2>
        <button
          onClick={() => setShowAddBook(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          <Upload className="h-4 w-4" />
          <span>Ajouter un livre</span>
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher un livre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearchChange()}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md"
        />
      </div>

      {/* Grille des livres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-8">Chargement...</p>
        ) : books.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">Aucun livre trouvé</p>
        ) : (
          books.map((book) => (
            <div key={book.id} className="bg-card border rounded-lg p-4">
              {book.coverUrl && (
                <img 
                  src={book.coverUrl} 
                  alt={book.title}
                  className="w-full h-48 object-cover rounded mb-3"
                />
              )}
              <h3 className="font-semibold line-clamp-1">{book.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
              {book.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{book.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {book._count.sharedReadings} lectures
                </span>
                <button
                  onClick={() => onDelete(book.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Ajouter livre */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Ajouter un livre</h3>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fichier EPUB</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".epub"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Auteur</label>
                <input
                  type="text"
                  value={newBook.author}
                  onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newBook.description}
                  onChange={(e) => setNewBook({...newBook, description: e.target.value})}
                  className="w-full p-2 border border-border rounded-md h-20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL de couverture</label>
                <input
                  type="url"
                  value={newBook.coverUrl}
                  onChange={(e) => setNewBook({...newBook, coverUrl: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddBook(false)}
                  className="flex-1 border border-border py-2 rounded-md"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

interface ReadingsTabProps {
  readings: AdminSharedReading[]
  books: AdminBook[]
  users: AdminUser[]
  onDelete: (id: string) => void
  loading: boolean
  showCreateReading: boolean
  setShowCreateReading: (show: boolean) => void
  onReload: () => void
  showMessage: (type: 'success' | 'error', message: string) => void
}

function ReadingsTab({
  readings,
  books,
  users,
  onDelete,
  loading,
  showCreateReading,
  setShowCreateReading,
  onReload,
  showMessage
}: ReadingsTabProps) {
  const [newReading, setNewReading] = useState({
    title: '',
    description: '',
    bookId: '',
    startDate: '',
    endDate: '',
    isPublic: true,
    participantIds: [] as string[]
  })

  const handleCreateReading = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/admin/shared-readings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReading)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      showMessage('success', 'Lecture partagée créée avec succès')
      setNewReading({
        title: '',
        description: '',
        bookId: '',
        startDate: '',
        endDate: '',
        isPublic: true,
        participantIds: []
      })
      setShowCreateReading(false)
      onReload()
    } catch (error) {
      showMessage('error', `Erreur création lecture: ${error}`)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const getStatus = (reading: AdminSharedReading) => {
    const now = new Date()
    const start = new Date(reading.startDate)
    const end = new Date(reading.endDate)
    
    if (now < start) return { label: 'À venir', color: 'bg-blue-100 text-blue-800' }
    if (now > end) return { label: 'Terminée', color: 'bg-gray-100 text-gray-800' }
    return { label: 'En cours', color: 'bg-green-100 text-green-800' }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Lectures partagées</h2>
        <button
          onClick={() => setShowCreateReading(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span>Créer une lecture</span>
        </button>
      </div>

      {/* Liste des lectures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <p className="col-span-full text-center py-8">Chargement...</p>
        ) : readings.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">Aucune lecture trouvée</p>
        ) : (
          readings.map((reading) => {
            const status = getStatus(reading)
            return (
              <div key={reading.id} className="bg-card border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold line-clamp-2 flex-1">{reading.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ml-2 ${status.color}`}>
                    {status.label}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>{reading.book.title}</strong> par {reading.book.author}
                </p>
                
                {reading.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{reading.description}</p>
                )}
                
                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <p>Créé par: {reading.creator.name}</p>
                  <p>Du {formatDate(reading.startDate)} au {formatDate(reading.endDate)}</p>
                  <p>Visibilité: {reading.isPublic ? 'Publique' : 'Privée'}</p>
                  <p>{reading._count.participants} participants • {reading._count.annotations} annotations</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <button className="text-primary hover:text-primary/80 text-sm flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>Voir détails</span>
                  </button>
                  <button
                    onClick={() => onDelete(reading.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Créer lecture */}
      {showCreateReading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Créer une lecture partagée</h3>
            <form onSubmit={handleCreateReading} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={newReading.title}
                  onChange={(e) => setNewReading({...newReading, title: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Livre</label>
                <select
                  value={newReading.bookId}
                  onChange={(e) => setNewReading({...newReading, bookId: e.target.value})}
                  className="w-full p-2 border border-border rounded-md"
                  required
                >
                  <option value="">Sélectionner un livre</option>
                  {books.map(book => (
                    <option key={book.id} value={book.id}>{book.title} - {book.author}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newReading.description}
                  onChange={(e) => setNewReading({...newReading, description: e.target.value})}
                  className="w-full p-2 border border-border rounded-md h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de début</label>
                  <input
                    type="datetime-local"
                    value={newReading.startDate}
                    onChange={(e) => setNewReading({...newReading, startDate: e.target.value})}
                    className="w-full p-2 border border-border rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de fin</label>
                  <input
                    type="datetime-local"
                    value={newReading.endDate}
                    onChange={(e) => setNewReading({...newReading, endDate: e.target.value})}
                    className="w-full p-2 border border-border rounded-md"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newReading.isPublic}
                  onChange={(e) => setNewReading({...newReading, isPublic: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm">Lecture publique</label>
              </div>
              <div className="flex space-x-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-md"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateReading(false)}
                  className="flex-1 border border-border py-2 rounded-md"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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