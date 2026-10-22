import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

export const CleaningTaskOptions: CollectionConfig = {
  slug: 'cleaning-task-options',
  labels: {
    singular: 'Option (Andere Aufgabe)',
    plural: 'Optionen (Andere Aufgabe)',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'isActive', 'sortOrder'],
    description:
      'Auswahlliste, aus der Nutzer beim Abhaken der Aufgabe "Anderes" wählen. Hier Titel, Beschreibung, Aktiv-Status und Sortierreihenfolge pflegen.',
  },
  access: {
    read: authenticated,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titel',
      admin: {
        description: 'z.B. "Fenster putzen", "Müll rausbringen"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beschreibung',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Aktiv',
      defaultValue: true,
    },
    {
      name: 'sortOrder',
      type: 'number',
      label: 'Sortierreihenfolge',
      defaultValue: 0,
    },
  ],
}
