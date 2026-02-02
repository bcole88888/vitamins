'use client'

import { useEffect, useState } from 'react'

interface User {
  id: string
  name: string
}

interface UserSelectorProps {
  selectedUserId: string | null
  onSelect: (userId: string | null) => void
  showAll?: boolean
}

export function UserSelector({ selectedUserId, onSelect, showAll = true }: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(console.error)
  }, [])

  return (
    <div className="flex gap-2">
      {showAll && (
        <button
          onClick={() => onSelect(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedUserId === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
      )}
      {users.map(user => (
        <button
          key={user.id}
          onClick={() => onSelect(user.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedUserId === user.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {user.name}
        </button>
      ))}
    </div>
  )
}
