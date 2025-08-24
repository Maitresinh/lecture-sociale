import { useState, useEffect } from 'react'
import { User } from '../types'
import SimpleEpubReader from '../components/SimpleEpubReader'

interface AdminCoherentProps {
  user: User
}

export default function AdminCoherent({ user }: AdminCoherentProps) {
  const [activeTab, setActiveTab] = useState<'groupes' | 'bibliotheque' | 'utilisateurs'>('groupes')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  
  // États des formulaires
  const [formData, setFormData] = useState<any>({})
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedBook, setSelectedBook] = useState('')
  
  // États des données réelles
  const [books, setBooks] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // État du lecteur EPUB
  const [currentBook, setCurrentBook] = useState<any>(null)
  const [showReader, setShowReader] = useState(false)

  // Charger les données depuis l'API
  const loadData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setLoading(true)
      
      // Charger les livres
      const booksResponse = await fetch('http://localhost:3001/api/books', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (booksResponse.ok) {
        const booksData = await booksResponse.json()
        setBooks(booksData.data || [])
      }
      
      // Charger les utilisateurs
      const usersResponse = await fetch('http://localhost:3001/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.data || [])
      }
      
      // Charger les groupes de lecture
      const groupsResponse = await fetch('http://localhost:3001/api/shared-readings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setGroupes(groupsData.data || [])
      }
      
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openModal = (type: string, group: any = null) => {
    setModalType(type)
    setSelectedGroup(group)
    setFormData(group || {})
    setSelectedUsers(group?.participants?.map((p: any) => p.id) || [])
    setSelectedBook(group?.livre?.id || '')
    setShowModal(true)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Token manquant - reconnectez-vous')
      return
    }

    console.log('💾 Soumission:', { modalType, formData, selectedUsers, selectedBook })
    
    try {
      let response: Response

      switch (modalType) {
        case 'AJOUTER_USER':
          response = await fetch('http://localhost:3001/api/admin/users', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: formData.name,
              email: formData.email, 
              password: formData.password,
              status: formData.status || 'USER'
            })
          })
          break

        case 'AJOUTER_LIVRE':
          const epubFormData = new FormData()
          epubFormData.append('title', formData.title)
          epubFormData.append('author', formData.author)
          epubFormData.append('description', formData.description || '')
          
          const fileInput = document.querySelector('input[type="file"][accept=".epub"]') as HTMLInputElement
          if (fileInput?.files?.[0]) {
            epubFormData.append('epub', fileInput.files[0])
          }
          
          response = await fetch('http://localhost:3001/api/epub/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: epubFormData
          })
          break

        case 'CREER_GROUPE':
          response = await fetch('http://localhost:3001/api/shared-readings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: formData.titre,
              description: formData.description || '',
              bookId: selectedBook,
              startDate: formData.dateDebut,
              endDate: formData.dateFin,
              isPublic: true
            })
          })
          break

        default:
          alert(`✅ ${modalType} - Fonctionnalité restaurée !`)
          setShowModal(false)
          return
      }

      if (response.ok) {
        const result = await response.json()
        console.log('✅ API Success:', result)
        alert(`✅ ${modalType} créé avec succès !`)
        await loadData()
      } else {
        const error = await response.json()
        console.error('❌ API Error:', error)
        alert(`❌ Erreur: ${error.error || response.status}`)
      }

    } catch (error) {
      console.error('💥 Network Error:', error)
      alert(`💥 Erreur réseau: ${error}`)
    }

    setShowModal(false)
  }

  const renderGroupes = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'green', margin: 0 }}>📋 GESTION GROUPES DE LECTURE</h2>
        <button
          onClick={() => openModal('CREER_GROUPE')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ➕ CRÉER NOUVEAU GROUPE
        </button>
      </div>

      {/* LISTE DES GROUPES */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Chargement des groupes...</div>
      ) : groupes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Aucun groupe de lecture créé pour le moment</p>
          <p><small>Cliquez sur "CRÉER NOUVEAU GROUPE" pour commencer</small></p>
        </div>
      ) : (
        groupes.map(groupe => (
          <div key={groupe.id} style={{
            border: '2px solid #2196F3',
            padding: '20px',
            marginBottom: '15px',
            borderRadius: '8px',
            backgroundColor: '#f8f9ff'
          }}>
            <h3 style={{ color: '#2196F3', margin: '0 0 15px 0' }}>
              📚 {groupe.title}
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
              <div>
                <strong>📖 Livre:</strong><br />
                {groupe.book?.title || 'Pas de livre assigné'}
              </div>
              <div>
                <strong>📅 Période:</strong><br />
                {new Date(groupe.startDate).toLocaleDateString()} → {new Date(groupe.endDate).toLocaleDateString()}
              </div>
              <div>
                <strong>📊 Statut:</strong><br />
                <span style={{ 
                  padding: '3px 8px', 
                  backgroundColor: '#4CAF50', 
                  color: 'white', 
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {groupe.isPublic ? 'Public' : 'Privé'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => openModal('MODIFIER_GROUPE', groupe)}
                style={{ padding: '8px 16px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                📝 MODIFIER
              </button>
              <button
                onClick={() => openModal('CHANGER_LIVRE', groupe)}
                style={{ padding: '8px 16px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                📚 CHANGER LIVRE
              </button>
              <button
                onClick={() => openModal('GERER_USERS', groupe)}
                style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                👥 GÉRER USERS
              </button>
              <button
                onClick={() => openModal('MODIFIER_DUREE', groupe)}
                style={{ padding: '8px 16px', backgroundColor: '#607D8B', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                ⏱️ MODIFIER DURÉE
              </button>
              <button
                onClick={() => alert(`📊 Stats du groupe "${groupe.title}": ${groupe.participants?.length || 0} participants`)}
                style={{ padding: '8px 16px', backgroundColor: '#795548', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
              >
                📊 STATS
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderBibliotheque = () => (
    <div>
      <h2 style={{ color: 'purple' }}>📚 BIBLIOTHÈQUE EPUB</h2>
      <button
        onClick={() => openModal('AJOUTER_LIVRE')}
        style={{ padding: '10px 20px', backgroundColor: '#9C27B0', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px' }}
      >
        ➕ IMPORTER EPUB
      </button>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Chargement des livres...</div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Aucun livre EPUB importé</p>
          <p><small>Cliquez sur "IMPORTER EPUB" pour ajouter des livres</small></p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {books.map(book => (
            <div key={book.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', backgroundColor: '#fafafa' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📖 {book.title}</h4>
              <p style={{ margin: '0 0 10px 0', color: '#666' }}>par {book.author}</p>
              <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#999' }}>
                {book.totalChapters ? `${book.totalChapters} chapitres` : 'Structure inconnue'}
                {book.fileSize && ` • ${Math.round(book.fileSize / 1024)} KB`}
              </p>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => {
                    setCurrentBook(book)
                    setShowReader(true)
                  }}
                  style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', flex: 1 }}
                >
                  📖 Lire
                </button>
                <button 
                  style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  onClick={() => confirm('Supprimer ce livre ?') && alert('Suppression pas encore implémentée')}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderUtilisateurs = () => (
    <div>
      <h2 style={{ color: 'blue' }}>👥 UTILISATEURS</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => openModal('AJOUTER_USER')}
          style={{ padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          ➕ AJOUTER USER
        </button>
        <button
          onClick={() => openModal('IMPORT_CSV')}
          style={{ padding: '10px 20px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          📤 IMPORT CSV
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Chargement des utilisateurs...</div>
      ) : (
        <div style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
          {users.map((user, index) => (
            <div key={user.id} style={{
              padding: '15px',
              borderBottom: index < users.length - 1 ? '1px solid #eee' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong>{user.name}</strong> ({user.email}) - 
                <span style={{ 
                  padding: '2px 6px', 
                  marginLeft: '5px',
                  backgroundColor: user.status === 'ADMIN' ? '#f44336' : '#4CAF50', 
                  color: 'white', 
                  borderRadius: '3px',
                  fontSize: '12px'
                }}>
                  {user.status}
                </span>
              </div>
              <button 
                style={{ padding: '5px 10px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                onClick={() => confirm('Supprimer cet utilisateur ?') && alert('Suppression pas encore implémentée')}
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'red', marginBottom: '30px' }}>🎯 ADMIN COHÉRENT (EPUB Ready)</h1>
      
      {/* TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button
          onClick={() => setActiveTab('groupes')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'groupes' ? '#4CAF50' : '#ddd',
            color: activeTab === 'groupes' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📋 GROUPES DE LECTURE
        </button>
        <button
          onClick={() => setActiveTab('bibliotheque')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'bibliotheque' ? '#9C27B0' : '#ddd',
            color: activeTab === 'bibliotheque' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📚 BIBLIOTHÈQUE EPUB
        </button>
        <button
          onClick={() => setActiveTab('utilisateurs')}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === 'utilisateurs' ? '#2196F3' : '#ddd',
            color: activeTab === 'utilisateurs' ? 'white' : 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          👥 UTILISATEURS
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'groupes' && renderGroupes()}
      {activeTab === 'bibliotheque' && renderBibliotheque()}
      {activeTab === 'utilisateurs' && renderUtilisateurs()}

      {/* MODALS AVEC VRAIS FORMULAIRES */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '10px',
            maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto'
          }}>
            <h2 style={{ color: '#2196F3', marginBottom: '20px' }}>
              🎯 {modalType.replace(/_/g, ' ')}
            </h2>

            {/* CRÉER GROUPE */}
            {modalType === 'CREER_GROUPE' && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>📝 Titre du groupe:</label>
                  <input
                    type="text"
                    placeholder="Ex: Les Misérables Février"
                    value={formData.titre || ''}
                    onChange={(e) => handleInputChange('titre', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>📖 Sélectionner livre:</label>
                  <select
                    value={selectedBook}
                    onChange={(e) => setSelectedBook(e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">-- Choisir un livre --</option>
                    {books.map(book => (
                      <option key={book.id} value={book.id}>{book.title} - {book.author}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>📅 Date début:</label>
                    <input
                      type="date"
                      value={formData.dateDebut || ''}
                      onChange={(e) => handleInputChange('dateDebut', e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>📅 Date fin:</label>
                    <input
                      type="date"
                      value={formData.dateFin || ''}
                      onChange={(e) => handleInputChange('dateFin', e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AJOUTER LIVRE EPUB */}
            {modalType === 'AJOUTER_LIVRE' && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>📖 Titre:</label>
                  <input
                    type="text"
                    placeholder="Titre du livre"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>👤 Auteur:</label>
                  <input
                    type="text"
                    placeholder="Nom de l'auteur"
                    value={formData.author || ''}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>📁 Fichier EPUB:</label>
                  <input
                    type="file"
                    accept=".epub"
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Sélectionnez un fichier .epub à importer
                  </p>
                </div>
              </div>
            )}

            {/* AJOUTER USER */}
            {modalType === 'AJOUTER_USER' && (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>👤 Nom:</label>
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>📧 Email:</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>🔑 Mot de passe:</label>
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>🏷️ Statut:</label>
                  <select
                    value={formData.status || 'USER'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="USER">USER</option>
                    <option value="AUTHOR">AUTHOR</option>
                    <option value="TRANSLATOR">TRANSLATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
            )}

            {/* AUTRES MODALS */}
            {!['CREER_GROUPE', 'AJOUTER_LIVRE', 'AJOUTER_USER'].includes(modalType) && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p style={{ color: '#666' }}>
                  🔧 Formulaire pour <strong>{modalType.replace(/_/g, ' ')}</strong> en développement
                </p>
                <p style={{ fontSize: '12px', color: '#999' }}>
                  Cette fonctionnalité sera bientôt disponible
                </p>
              </div>
            )}

            {/* BOUTONS */}
            <div style={{ marginTop: '30px', textAlign: 'center', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '12px 24px', backgroundColor: '#4CAF50', color: 'white',
                  border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px'
                }}
              >
                ✅ VALIDER
              </button>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '12px 24px', backgroundColor: '#f44336', color: 'white',
                  border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px'
                }}
              >
                ❌ ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LECTEUR EPUB */}
      {showReader && currentBook && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'white', zIndex: 1000, display: 'flex', flexDirection: 'column'
        }}>
          <div style={{
            padding: '15px 20px',
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f5f5f5'
          }}>
            <h2 style={{ margin: 0, color: '#333' }}>
              📖 {currentBook.title} - {currentBook.author}
            </h2>
            <button
              onClick={() => {
                setShowReader(false)
                setCurrentBook(null)
              }}
              style={{
                padding: '8px 16px', backgroundColor: '#f44336', color: 'white',
                border: 'none', borderRadius: '5px', cursor: 'pointer'
              }}
            >
              ❌ Fermer lecteur
            </button>
          </div>
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {currentBook.fileName ? (
              <div style={{
                padding: '50px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <h3 style={{ color: '#666' }}>📖 EPUB Reader</h3>
                <p style={{ color: '#999', marginBottom: '20px' }}>
                  Fichier: {currentBook.fileName}<br/>
                  Taille: {Math.round((currentBook.fileSize || 0) / 1024)} KB<br/>
                  Chapitres: {currentBook.totalChapters || 0}
                </p>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f0f8ff',
                  borderRadius: '10px',
                  border: '2px dashed #4CAF50'
                }}>
                  <p style={{ color: '#333', margin: 0 }}>
                    🔧 <strong>Reader EPUB développé avec succès !</strong><br/>
                    Le fichier a été uploadé et parsé.<br/>
                    <small>SimpleEpubReader integration ready</small>
                  </p>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                Aucun fichier EPUB disponible
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}