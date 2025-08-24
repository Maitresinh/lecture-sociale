import { useState } from 'react'
import { User } from '../types'

interface AdminBasicProps {
  user: User
}

export default function AdminBasic({ user }: AdminBasicProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'books'>('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState('')

  const handleAction = (action: string) => {
    setModalContent(action)
    setShowModal(true)
    console.log(`🎯 Action triggered: ${action}`)
  }

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <div>
            <h3 style={{ color: 'green' }}>📊 DASHBOARD:</h3>
            <p>✅ Tableau de bord administrateur</p>
            <div style={{ padding: '15px', backgroundColor: 'yellow', marginTop: '15px' }}>
              <h4>🧪 TEST API DASHBOARD:</h4>
              <button 
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#f44336', 
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  fetch('http://localhost:3001/api/admin/dashboard', {
                    headers: {
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  })
                  .then(r => r.json())
                  .then(data => alert(JSON.stringify(data, null, 2)))
                  .catch(e => alert('ERROR: ' + e.message))
                }}
              >
                Test Dashboard API
              </button>
            </div>
          </div>
        )
      case 'users':
        return (
          <div>
            <h3 style={{ color: 'green' }}>👥 USERS:</h3>
            <p>✅ Gestion des utilisateurs</p>
            <div style={{ padding: '15px', backgroundColor: '#e6f3ff', marginTop: '15px' }}>
              <h4>📋 Actions utilisateurs:</h4>
              <button 
                onClick={() => handleAction('AJOUTER_UTILISATEUR')}
                style={{ padding: '8px 16px', margin: '5px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                ➕ Ajouter Utilisateur
              </button>
              <button 
                onClick={() => handleAction('IMPORT_CSV')}
                style={{ padding: '8px 16px', margin: '5px', backgroundColor: '#FF9800', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                📤 Import CSV
              </button>
              <button 
                onClick={() => handleAction('LISTE_UTILISATEURS')}
                style={{ padding: '8px 16px', margin: '5px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                📊 Liste Utilisateurs
              </button>
            </div>
          </div>
        )
      case 'books':
        return (
          <div>
            <h3 style={{ color: 'green' }}>📚 BOOKS:</h3>
            <p>✅ Gestion des livres</p>
            <div style={{ padding: '15px', backgroundColor: '#fff0e6', marginTop: '15px' }}>
              <h4>📖 Actions livres:</h4>
              <button 
                onClick={() => handleAction('AJOUTER_LIVRE')}
                style={{ padding: '8px 16px', margin: '5px', backgroundColor: '#E91E63', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                📚 Ajouter Livre
              </button>
              <button 
                onClick={() => handleAction('LISTE_LIVRES')}
                style={{ padding: '8px 16px', margin: '5px', backgroundColor: '#9C27B0', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                📋 Liste Livres
              </button>
              <button 
                onClick={() => handleAction('CREER_LECTURE_PARTAGEE')}
                style={{ padding: '8px 16px', margin: '5px', backgroundColor: '#607D8B', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                🔄 Créer Lecture Partagée
              </button>
            </div>
          </div>
        )
      default:
        return <p>Sélectionnez un onglet</p>
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'red', fontSize: '32px', marginBottom: '20px' }}>
        🚨 ADMIN ULTRA-BASIC
      </h1>
      
      <div style={{ 
        border: '3px solid red', 
        padding: '20px', 
        marginBottom: '20px',
        backgroundColor: '#ffe6e6'
      }}>
        <h2>USER INFO:</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Status:</strong> {user.status}</p>
        <p><strong>Is Admin:</strong> {user.status === 'ADMIN' ? '✅ YES' : '❌ NO'}</p>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* SIDEBAR ULTRA SIMPLE */}
        <div style={{ 
          width: '200px', 
          border: '3px solid blue',
          padding: '20px',
          backgroundColor: '#e6f2ff'
        }}>
          <h3 style={{ color: 'blue' }}>MENU TABS:</h3>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '10px', 
              margin: '5px 0',
              backgroundColor: activeTab === 'dashboard' ? '#1B5E20' : '#4CAF50',
              color: 'white',
              border: activeTab === 'dashboard' ? '3px solid yellow' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal'
            }}
          >
            📊 Dashboard {activeTab === 'dashboard' ? '✅' : ''}
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '10px', 
              margin: '5px 0',
              backgroundColor: activeTab === 'users' ? '#0D47A1' : '#2196F3',
              color: 'white',
              border: activeTab === 'users' ? '3px solid yellow' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'users' ? 'bold' : 'normal'
            }}
          >
            👥 Users {activeTab === 'users' ? '✅' : ''}
          </button>
          <button 
            onClick={() => setActiveTab('books')}
            style={{ 
              display: 'block', 
              width: '100%', 
              padding: '10px', 
              margin: '5px 0',
              backgroundColor: activeTab === 'books' ? '#E65100' : '#FF9800',
              color: 'white',
              border: activeTab === 'books' ? '3px solid yellow' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'books' ? 'bold' : 'normal'
            }}
          >
            📚 Books {activeTab === 'books' ? '✅' : ''}
          </button>
        </div>

        {/* CONTENT ULTRA SIMPLE */}
        <div style={{ 
          flex: 1, 
          border: '3px solid green',
          padding: '20px',
          backgroundColor: '#e6ffe6'
        }}>
          <div>
            <h3 style={{ color: 'green' }}>CONTENT AREA - ACTIVE TAB: {activeTab.toUpperCase()}</h3>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* MODAL SIMPLE */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '500px',
            width: '90%',
            border: '3px solid #2196F3'
          }}>
            <h2 style={{ color: '#2196F3', marginBottom: '20px' }}>
              🎯 ACTION: {modalContent.replace(/_/g, ' ')}
            </h2>
            
            {modalContent === 'AJOUTER_UTILISATEUR' && (
              <div>
                <p>📝 <strong>Formulaire d'ajout d'utilisateur</strong></p>
                <input placeholder="Nom" style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }} />
                <input placeholder="Email" style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }} />
                <input placeholder="Mot de passe" type="password" style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }} />
                <select style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }}>
                  <option>USER</option>
                  <option>AUTHOR</option>
                  <option>TRANSLATOR</option>
                  <option>ADMIN</option>
                </select>
              </div>
            )}
            
            {modalContent === 'AJOUTER_LIVRE' && (
              <div>
                <p>📚 <strong>Formulaire d'ajout de livre</strong></p>
                <input placeholder="Titre du livre" style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }} />
                <input placeholder="Auteur" style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }} />
                <textarea placeholder="Description" style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc', height: '80px' }}></textarea>
                <input type="file" accept=".epub" style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0', border: '1px solid #ccc' }} />
              </div>
            )}
            
            {modalContent === 'LISTE_UTILISATEURS' && (
              <div>
                <p>👥 <strong>Liste des utilisateurs</strong></p>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                  <div style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                    👤 {user.name} ({user.email}) - {user.status}
                  </div>
                  <div style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                    👤 Marie Dubois (marie@example.com) - AUTHOR
                  </div>
                </div>
              </div>
            )}
            
            {modalContent === 'LISTE_LIVRES' && (
              <div>
                <p>📖 <strong>Liste des livres</strong></p>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                  <div style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                    📚 Les Misérables - Victor Hugo
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '10px',
                  borderRadius: '5px'
                }}
                onClick={() => alert(`Action ${modalContent} executée !`)}
              >
                ✅ VALIDER
              </button>
              <button 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '5px'
                }}
                onClick={() => setShowModal(false)}
              >
                ❌ FERMER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}