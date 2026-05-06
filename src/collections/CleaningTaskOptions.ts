import type { CollectionConfig } from 'payload'

export const CleaningTaskOptions: CollectionConfig = {
  slug: 'cleaning-task-options',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'isActive', 'sortOrder'],
  },
  access: {
    read: () => true,
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
