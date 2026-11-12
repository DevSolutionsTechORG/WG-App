import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Kein SVG: wird von der eigenen Origin ausgeliefert und kann Skripte enthalten.
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  },
}
