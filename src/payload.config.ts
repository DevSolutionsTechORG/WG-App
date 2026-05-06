import { CleaningTaskOptions } from './collections/CleaningTaskOptions'
import { Media } from './collections/Media'
import { ShoppingItems } from './collections/ShoppingItems'
import { TaskAssignments } from './collections/TaskAssignments'
import { TaskCompletionHistory } from './collections/TaskCompletionHistory'
import { TaskTemplates } from './collections/TaskTemplates'
import { Users } from './collections/Users'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import path from 'path'
import sharp from 'sharp'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    autoLogin:
      process.env.NODE_ENV === 'development'
        ? {
            email: process.env.AUTOLOGIN_EMAIL || 'test@example.com',
            password: process.env.AUTOLOGIN_PASSWORD || 'test',
          }
        : false,
  },
  collections: [
    Users,
    Media,
    TaskTemplates,
    TaskAssignments,
    TaskCompletionHistory,
    CleaningTaskOptions,
    ShoppingItems,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
})
