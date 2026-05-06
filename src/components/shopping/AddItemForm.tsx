'use client'

import { Plus } from 'lucide-react'
import { createShoppingItem } from '@/lib/shopping/actions'
import { useState } from 'react'

export function AddItemForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [formData, setFormData] = useState<{
    title: string
    category: 'food' | 'cleaning' | 'other'
    priority: 'high' | 'medium' | 'low'
    description: string
    quantity: string
    unit: string
  }>({
    title: '',
    category: 'food',
    priority: 'medium',
    description: '',
    quantity: '',
    unit: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)

    try {
      const result = await createShoppingItem({
        title: formData.title,
        category: formData.category,
        priority: formData.priority,
        description: formData.description || undefined,
        quantity: formData.quantity ? parseInt(formData.quantity) : undefined,
        unit: formData.unit || undefined,
      })

      if (result.success) {
        setFormData({
          title: '',
          category: 'food',
          priority: 'medium',
          description: '',
          quantity: '',
          unit: '',
        })
        setIsOpen(false)
        window.location.reload()
      } else {
        alert(result.message)
      }
    } catch {
      alert('Fehler beim Hinzufügen')
    } finally {
      setIsPending(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Artikel hinzufügen
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow border p-4 space-y-4">
      <h3 className="font-medium">Neuer Artikel</h3>

      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="z.B. Milch"
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Kategorie *</label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value as typeof formData.category })
            }
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="food">Lebensmittel</option>
            <option value="cleaning">Reinigung</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Priorität *</label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value as typeof formData.priority })
            }
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="high">Hoch</option>
            <option value="medium">Mittel</option>
            <option value="low">Niedrig</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Menge</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="1"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Einheit</label>
          <input
            type="text"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            placeholder="z.B. Packung, kg"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notizen</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional: Details, Marke, etc."
          rows={2}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Wird hinzugefügt...' : 'Hinzufügen'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 text-muted-foreground hover:text-foreground"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
