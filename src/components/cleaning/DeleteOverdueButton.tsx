'use client'

import { Trash2 } from 'lucide-react'
import { deleteOverdueAssignments } from '@/lib/cleaning/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteOverdueButton({ count }: { count: number }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        `${count} überfällige Aufgabe(n) aller Mitbewohner endgültig löschen? Das kann nicht rückgängig gemacht werden.`,
      )
    )
      return
    setIsPending(true)
    try {
      const result = await deleteOverdueAssignments()
      if (!result.success) alert(result.message)
      router.refresh()
    } catch {
      alert('Fehler beim Löschen')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="w-4 h-4" />
      {isPending ? 'Lösche…' : `Alle überfälligen löschen (${count})`}
    </button>
  )
}
