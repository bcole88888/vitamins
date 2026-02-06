'use client'

import { useEffect, useState, useCallback } from 'react'

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
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchUsers = useCallback(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers)
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleAdd = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      if (res.ok) {
        const user = await res.json()
        setNewName('')
        setAdding(false)
        fetchUsers()
        onSelect(user.id)
      }
    } catch (error) {
      console.error('Error adding user:', error)
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmDelete(null)
        if (selectedUserId === userId) {
          onSelect(null)
        }
        fetchUsers()
      }
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
        <div key={user.id} className="relative group flex items-center">
          <button
            onClick={() => onSelect(user.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedUserId === user.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {user.name}
          </button>

          {confirmDelete === user.id ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => handleDelete(user.id)}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(user.id)}
              className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              title={`Remove ${user.name}`}
            >
              x
            </button>
          )}
        </div>
      ))}

      {adding ? (
        <form
          onSubmit={e => { e.preventDefault(); handleAdd() }}
          className="flex items-center gap-1"
        >
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Name"
            autoFocus
            className="px-3 py-2 border rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName('') }}
            className="px-2 py-2 text-gray-500 hover:text-gray-700 text-sm"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors text-lg"
          title="Add user"
        >
          +
        </button>
      )}
    </div>
  )
}
