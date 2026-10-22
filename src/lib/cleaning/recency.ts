export const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Reichert Optionen mit dem Zeitpunkt ihrer letzten Erledigung innerhalb der
 * letzten 2 Wochen an (`lastDoneAt`), sonst `null`. Nimmt bei mehreren
 * Treffern den jüngsten.
 */
export function withRecency<T extends { title: string }>(
  options: T[],
  completions: { selectedOption?: string | null; completedAt: string }[],
  now: Date,
): (T & { lastDoneAt: string | null })[] {
  const cutoff = now.getTime() - TWO_WEEKS_MS
  const lastDoneByTitle = new Map<string, string>()

  for (const completion of completions) {
    if (!completion.selectedOption) continue
    const completedAt = new Date(completion.completedAt).getTime()
    if (completedAt < cutoff) continue

    const existing = lastDoneByTitle.get(completion.selectedOption)
    if (!existing || completedAt > new Date(existing).getTime()) {
      lastDoneByTitle.set(completion.selectedOption, completion.completedAt)
    }
  }

  return options.map((option) => ({
    ...option,
    lastDoneAt: lastDoneByTitle.get(option.title) ?? null,
  }))
}
