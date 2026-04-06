<script setup lang="ts">
interface Task {
  id: number
  title: string
  description: string | null
  cadence: string
  isDeliverable: number
}

const props = defineProps<{
  task: Task | null
  open: boolean
}>()

const emit = defineEmits<{
  close: []
  logged: [xpAwarded: number, phasesUnlocked: boolean]
}>()

const { logCompletion, loading, error } = useCompletion()

const prUrl = ref('')
const notes = ref('')
const validationError = ref<string | null>(null)

watch(() => props.open, (val) => {
  if (val) {
    prUrl.value = ''
    notes.value = ''
    validationError.value = null
    error.value = null
  }
})

const isDeliverable = computed(() => props.task?.isDeliverable === 1)

async function submit() {
  if (!props.task) return
  validationError.value = null

  if (isDeliverable.value && !prUrl.value.trim()) {
    validationError.value = 'PR URL is required for deliverables'
    return
  }

  const payload: Record<string, unknown> = {
    taskId: props.task.id,
    dayDate: new Date().toISOString().slice(0, 10),
  }
  if (prUrl.value.trim()) payload.prUrl = prUrl.value.trim()
  if (notes.value.trim()) payload.notes = notes.value.trim()

  const res = await logCompletion(payload as Parameters<typeof logCompletion>[0])
  if (res?.ok) {
    const afterStates = (res as { ok: true; data: { xpAwarded: number } }).data
    emit('logged', afterStates.xpAwarded, afterStates.xpAwarded >= 100)
    emit('close')
  }
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && task"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 px-4 pb-4 sm:pb-0"
        @click="onBackdropClick"
      >
        <div class="w-full max-w-md bg-white border border-zinc-200 rounded-lg shadow-sm">
          <!-- Header -->
          <div class="px-5 pt-5 pb-4 border-b border-zinc-100">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                  {{ task.cadence.replace('_', ' ') }}
                  <span v-if="isDeliverable" class="ml-1 text-amber-600">· deliverable</span>
                </p>
                <h2 class="text-base font-medium text-zinc-900 leading-snug">{{ task.title }}</h2>
                <p v-if="task.description" class="text-sm text-zinc-500 mt-1">{{ task.description }}</p>
              </div>
              <button
                class="text-zinc-400 hover:text-zinc-600 mt-0.5 flex-shrink-0"
                @click="emit('close')"
                aria-label="Close"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="px-5 py-4 space-y-4">
            <!-- PR URL -->
            <div>
              <label class="block text-xs font-medium text-zinc-700 mb-1.5">
                PR / Link URL
                <span v-if="isDeliverable" class="text-red-500 ml-0.5">*</span>
                <span v-else class="text-zinc-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                v-model="prUrl"
                type="url"
                placeholder="https://github.com/..."
                class="w-full text-sm border border-zinc-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-300"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-xs font-medium text-zinc-700 mb-1.5">
                Notes
                <span class="text-zinc-400 font-normal ml-1">(optional · max 2000 chars)</span>
              </label>
              <textarea
                v-model="notes"
                rows="4"
                maxlength="2000"
                placeholder="What did you learn? Any blockers?"
                class="w-full text-sm border border-zinc-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-300 resize-none font-mono"
              />
              <p class="text-right text-xs text-zinc-400 mt-1">{{ notes.length }} / 2000</p>
            </div>

            <!-- Errors -->
            <p v-if="validationError || error" class="text-sm text-red-600">
              {{ validationError ?? error }}
            </p>
          </div>

          <!-- Footer -->
          <div class="px-5 pb-5">
            <button
              class="w-full bg-zinc-900 text-white text-sm font-medium py-2 rounded hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              :disabled="loading"
              @click="submit"
            >
              {{ loading ? 'Logging...' : 'Log completion' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
