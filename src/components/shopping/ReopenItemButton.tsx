'use client'

import { useState } from 'react'
import { Undo2 } from 'lucide-react'

import { reopenShoppingItem } from '@/lib/shopping/actions'

interface ReopenItemButtonProps {
  itemId: string
}

export function ReopenItemButton({ itemId }: ReopenItemButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleReopen = async () => {
    setIsPending(true)
    try {
      const result = await reopenShoppingItem(itemId)
      if (result.success) {
        window.location.reload()
      } else {
        alert(result.message)
      }
    } catch {
      alert('Fehler beim Wiederöffnen')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleReopen}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 disabled:opacity-50 text-sm"
    >
      <Undo2 className="w-4 h-4" />
      {isPending ? '...' : 'Wieder öffnen'}
    </button>
  )
}
