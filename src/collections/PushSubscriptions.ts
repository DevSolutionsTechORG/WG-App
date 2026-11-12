import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

/**
 * Web-Push-Abos pro Gerät. Enthält die Schlüssel zum Senden an ein Gerät,
 * deshalb nur für Admins sichtbar; Anlegen/Löschen läuft über die Server
 * Actions in lib/push/actions.ts (Local API).
 */
export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  admin: {
    useAsTitle: 'endpoint',
    defaultColumns: ['user', 'endpoint', 'createdAt'],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'endpoint', type: 'text', required: true, unique: true, index: true },
    { name: 'p256dh', type: 'text', required: true },
    { name: 'auth', type: 'text', required: true },
  ],
}
