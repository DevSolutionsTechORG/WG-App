import type { CollectionConfig } from 'payload'
import { anyone } from '@/access/anyone'

export const TaskTemplates: CollectionConfig = {
  slug: 'task-templates',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rotationGroup', 'frequency', 'isCustom'],
  },
  access: {
    read: anyone,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Aufgabe',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beschreibung',
    },
    {
      name: 'rotationGroup',
      type: 'number',
      required: true,
      label: 'Rotations-Gruppe',
      admin: {
        description: '0 = Gruppe A (wöchentlich rotierend), 1 = Gruppe B, etc.',
      },
    },
    {
      name: 'frequency',
      type: 'select',
      required: true,
      label: 'Häufigkeit',
      options: [
        { label: 'Wöchentlich', value: 'weekly' },
        { label: 'Zweiwöchentlich', value: 'biweekly' },
        { label: 'Monatlich', value: 'monthly' },
      ],
      defaultValue: 'weekly',
    },
    {
      name: 'isCustom',
      type: 'checkbox',
      label: 'Custom-Task (Anderes)',
      admin: {
        description: 'User kann Notizen hinzufügen',
      },
    },
    {
      name: 'requiresOptions',
      type: 'checkbox',
      label: 'Pflegeoptionen erforderlich',
      admin: {
        description: 'User kann aus Beispiel-Optionen wählen',
      },
    },
  ],
}
