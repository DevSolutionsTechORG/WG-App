import { CleaningTaskOptions } from './collections/CleaningTaskOptions'
import { Events } from './collections/Events'
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

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'

const payloadSecret = process.env.PAYLOAD_SECRET
if (!isBuildPhase && !payloadSecret) {
  throw new Error(
    'PAYLOAD_SECRET must be set. Generate one with: openssl rand -hex 32',
  )
}
if (!isBuildPhase && payloadSecret && payloadSecret.length < 32) {
  console.warn(
    'PAYLOAD_SECRET is shorter than 32 characters. Rotate to a stronger secret: openssl rand -hex 32',
  )
}

const databaseUrl = process.env.DATABASE_URL
if (!isBuildPhase && !databaseUrl) {
  throw new Error('DATABASE_URL must be set.')
}

const autoLoginEnabled =
  process.env.NODE_ENV === 'development' &&
  !!process.env.AUTOLOGIN_EMAIL &&
  !!process.env.AUTOLOGIN_PASSWORD

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    autoLogin: autoLoginEnabled
      ? {
          email: process.env.AUTOLOGIN_EMAIL!,
          password: process.env.AUTOLOGIN_PASSWORD!,
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
    Events,
  ],
  editor: lexicalEditor(),
  secret: payloadSecret ?? '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: databaseUrl ?? '',
  }),
  sharp,
  plugins: [],
})
