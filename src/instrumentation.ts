const HOUR_MS = 60 * 60 * 1000

/**
 * Erzeugt die Putzplan-Aufgaben serverseitig, unabhängig davon, ob jemand die
 * App öffnet: einmal beim Serverstart, danach stündlich (idempotent).
 * ponytail: In-Process-Timer, reicht für eine einzelne Instanz (Railway).
 * Bei mehreren Instanzen/Serverless auf Payload-Jobs (jobs.autoRun) umstellen.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { getPayload } = await import('payload')
  const { default: config } = await import('@/payload.config')
  const { ensureWeekAssignments } = await import('@/lib/cleaning/generate')

  const run = async () => {
    try {
      const payload = await getPayload({ config })
      await ensureWeekAssignments(payload)
    } catch (error) {
      console.error('Putzplan-Generierung fehlgeschlagen:', error)
    }
  }

  void run()
  setInterval(run, HOUR_MS)
}
