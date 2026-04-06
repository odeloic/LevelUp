interface QuickLogTask {
  id:            number
  title:         string
  description:   string | null
  cadence:       string
  isDeliverable: number
  phaseId:       number
  phaseSlug:     string
}

export function useQuickLog() {
  const open = useState<boolean>('quickLogOpen', () => false)
  const task = useState<QuickLogTask | null>('quickLogTask', () => null)
  return { open, task }
}
