import { User } from '../types'

interface AdminPageDebugProps {
  user: User
}

export default function AdminPageDebug({ user }: AdminPageDebugProps) {
  console.log('AdminPageDebug - user:', user)
  
  const testTabs = [
    { id: 'test1', label: 'Test 1' },
    { id: 'test2', label: 'Test 2' },
    { id: 'test3', label: 'Test 3' }
  ]

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="border border-red-500 p-4 mb-4">
        <h1 className="text-2xl font-bold text-red-600">DEBUG ADMIN PAGE</h1>
        <p>User Name: {user.name}</p>
        <p>User Status: {user.status}</p>
        <p>Should show admin tabs: {user.status === 'ADMIN' ? 'YES' : 'NO'}</p>
      </div>

      <div className="flex space-x-8">
        {/* Navigation test */}
        <div className="w-64 space-y-1 border border-blue-500 p-2">
          <h3 className="font-bold text-blue-600">TEST TABS:</h3>
          {testTabs.map((tab) => (
            <button
              key={tab.id}
              className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              <span>📁</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 border border-green-500 p-4">
          <h3 className="font-bold text-green-600">CONTENT AREA</h3>
          <p>This is where the admin content should appear</p>
        </div>
      </div>
    </div>
  )
}