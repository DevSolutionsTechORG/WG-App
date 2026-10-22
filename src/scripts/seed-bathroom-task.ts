import { getPayload } from 'payload'
import config from '../payload.config.js'

const TITLE = 'Badezimmer Reinigen'
const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'task-templates',
  where: { title: { equals: TITLE } },
  limit: 1,
})

if (existing.docs.length > 0) {
  console.log(`"${TITLE}" existiert bereits (${existing.docs[0].id}) — nichts zu tun.`)
} else {
  // Eigene Rotationsgruppe: Templates werden newest-first gelesen, ein neues
  // Template in einer BESTEHENDEN Gruppe bekäme dort Index 0 und würde die
  // Rotation aller anderen Aufgaben dieser Gruppe verschieben.
  const all = await payload.find({ collection: 'task-templates', limit: 200 })
  const nextGroup = all.docs.reduce((max, t) => Math.max(max, t.rotationGroup ?? 0), -1) + 1

  const doc = await payload.create({
    collection: 'task-templates',
    data: {
      title: TITLE,
      description:
        'Reinigen von Toilette, Pissuar, Dusche inkl. Duschrinne und Wischen der Ablage sowie des Mülleimer Deckels.',
      rotationGroup: nextGroup,
      frequency: 'biweekly',
    },
    overrideAccess: true,
  })
  console.log(
    `"${TITLE}" angelegt (${doc.id}, Rotations-Gruppe ${nextGroup}).\n` +
      `Jetzt im Admin-Panel unter "Nur für diese Nutzer" die Teilnehmer setzen.`,
  )
}

process.exit(0)
