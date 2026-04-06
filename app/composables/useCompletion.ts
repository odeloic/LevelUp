interface CompletionPayload {
  taskId: number
  weekNumber?: number
  dayDate?: string
  prUrl?: string
  notes?: string
}

export function useCompletion() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function logCompletion(payload: CompletionPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch('/api/completions', {
        method: 'POST',
        body: payload,
      })
      return res
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: { message?: string } } })?.data?.error?.message
      error.value = msg ?? 'Failed to log completion'
      throw err
    } finally {
      loading.value = false
    }
  }

  return { logCompletion, loading, error }
}
