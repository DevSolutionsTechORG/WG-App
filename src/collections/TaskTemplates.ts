import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

export const TaskTemplates: CollectionConfig = {
  slug: 'task-templates',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rotationGroup', 'frequency', 'isCustom'],
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
      name: 'assignedUsers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      label: 'Nur für diese Nutzer',
      admin: {
        description:
          'Leer = alle Mitglieder rotieren. Sonst rotiert die Aufgabe nur unter den hier gewählten Nutzern.',
      },
    },
    {
      name: 'isCustom',
      type: 'checkbox',
      label: 'Freie Aufgabe (Auswahl beim Abhaken)',
      admin: {
        description:
          'User wählt beim Abhaken genau eine Option aus der Auswahlliste unten.',
      },
    },
    {
      name: 'freeTaskOptions',
      type: 'array',
      label: 'Auswahlliste',
      labels: { singular: 'Option', plural: 'Optionen' },
      admin: {
        condition: (data) => !!data?.isCustom,
        description:
          'Aus dieser Liste wählt man beim Abhaken genau eine Aufgabe. Reihenfolge per Drag & Drop.',
      },
      fields: [
        { name: 'title', type: 'text', required: true, label: 'Titel' },
        { name: 'description', type: 'textarea', label: 'Was gehört dazu?' },
      ],
    },
  ],
}
