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

  const pillBase = 'px-4 py-2 rounded-full text-sm font-medium transition-all'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showAll && (
        <button
          onClick={() => onSelect(null)}
          className={pillBase}
          style={
            selectedUserId === null
              ? { background: 'var(--accent)', color: '#0f0f0e' }
              : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-warm)' }
          }
        >
          All
        </button>
      )}

      {users.map(user => (
        <div key={user.id} className="relative group flex items-center">
          <button
            onClick={() => onSelect(user.id)}
            className={pillBase}
            style={
              selectedUserId === user.id
                ? { background: 'var(--accent)', color: '#0f0f0e' }
                : { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-warm)' }
            }
          >
            {user.name}
          </button>

          {confirmDelete === user.id ? (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={() => handleDelete(user.id)}
                className="px-2 py-1 text-xs rounded-full font-medium transition-colors"
                style={{ background: 'var(--danger)', color: '#fff' }}
                aria-label={`Confirm delete ${user.name}`}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-2 py-1 text-xs rounded-full font-medium transition-colors"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-warm)' }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(user.id)}
              className="ml-1 w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all text-xs"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-muted)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent' }}
              aria-label={`Remove ${user.name}`}
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
            className="px-3 py-2 rounded-full text-sm w-32 focus:outline-none focus:ring-1"
            style={{
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-warm-strong)',
            }}
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="px-3 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#0f0f0e' }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewName('') }}
            className="px-2 py-2 text-sm transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all text-lg"
          style={{
            border: '1px dashed var(--accent)',
            color: 'var(--accent)',
            background: 'transparent',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-muted)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          title="Add user"
        >
          +
        </button>
      )}
    </div>
  )
}
