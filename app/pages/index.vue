<script setup lang="ts">
const { data: tracksRes, refresh: refreshTracks } = await useFetch('/api/tracks')
const { data: userRes, refresh: refreshUser } = await useFetch('/api/user/state')

const tracks = computed(() => (tracksRes.value?.ok ? tracksRes.value.data : []))
const user = computed(() => (userRes.value?.ok ? userRes.value.data : null))

// Today's pending daily tasks: daily cadence tasks in unlocked phases with no completion today
type DailyTask = {
  id: number
  title: string
  phaseName: string
  phaseSlug: string
  trackColor: string
}

const todayTasks = computed<DailyTask[]>(() => {
  if (!tracks.value) return []
  const today = new Date().toISOString().slice(0, 10)
  const result: DailyTask[] = []
  for (const track of tracks.value) {
    for (const phase of track.phases) {
      if (!phase.isUnlocked) continue
      // We'll derive from tasks fetched per phase — but we don't have tasks here yet.
      // The dashboard quick-log will be powered by a separate fetch per active phase.
    }
  }
  return result
})

// Fetch tasks for all unlocked phases to populate quick-log
const { data: allPhasesRes } = await useFetch('/api/phases')
const unlockedPhases = computed(() => (allPhasesRes.value?.ok ? allPhasesRes.value.data : []))

// Fetch today's completions to determine which daily tasks are already done
const today = new Date().toISOString().slice(0, 10)
const { data: completionsRes, refresh: refreshCompletions } = await useFetch('/api/completions')
const todayCompletedTaskIds = computed<Set<number>>(() => {
  if (!completionsRes.value?.ok) return new Set()
  return new Set(
    completionsRes.value.data
      .filter((c) => c.completedAt?.slice(0, 10) === today)
      .map((c) => c.taskId),
  )
})

// Fetch tasks for each unlocked phase
const phaseTasksMap = ref<Record<number, { id: number; title: string; cadence: string; isDeliverable: number }[]>>({})

watchEffect(async () => {
  const phases = unlockedPhases.value
  if (!phases.length) return
  await Promise.all(
    phases.map(async (phase) => {
      if (phaseTasksMap.value[phase.id]) return
      const res = await $fetch(`/api/phases/${phase.id}/tasks`)
      if (res?.ok) phaseTasksMap.value[phase.id] = res.data
    }),
  )
})

const quickLogTasks = computed(() => {
  const result: { task: { id: number; title: string; cadence: string; isDeliverable: number }; phaseName: string; phaseSlug: string; trackColor: string }[] = []
  for (const track of tracks.value ?? []) {
    for (const phase of track.phases) {
      if (!phase.isUnlocked) continue
      const tasks = phaseTasksMap.value[phase.id] ?? []
      for (const task of tasks) {
        if (task.cadence === 'daily' && !todayCompletedTaskIds.value.has(task.id)) {
          result.push({ task, phaseName: phase.title, phaseSlug: phase.slug, trackColor: track.color })
        }
      }
    }
  }
  return result
})

// Modal state
const activeTask = ref<typeof quickLogTasks.value[number]['task'] | null>(null)
const modalOpen = ref(false)

function openModal(task: typeof quickLogTasks.value[number]['task']) {
  activeTask.value = task
  modalOpen.value = true
}

const xpToast = ref<string | null>(null)

async function onLogged(xpAwarded: number, phasesUnlocked: boolean) {
  xpToast.value = `+${xpAwarded} XP${phasesUnlocked ? ' · Phase unlocked!' : ''}`
  setTimeout(() => (xpToast.value = null), 3000)
  await Promise.all([refreshTracks(), refreshUser(), refreshCompletions()])
  phaseTasksMap.value = {}
}
</script>

<template>
  <div>
    <!-- XP toast -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="xpToast"
        class="fixed top-4 right-4 z-50 bg-zinc-900 text-white text-sm px-4 py-2 rounded shadow"
      >
        {{ xpToast }}
      </div>
    </Transition>

    <!-- Track progress -->
    <section class="mb-10">
      <h1 class="text-xl font-semibold text-zinc-900 mb-6">Tracks</h1>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <NuxtLink
          v-for="track in tracks"
          :key="track.id"
          :to="`/tracks/${track.slug}`"
          class="group border border-zinc-200 rounded-lg p-4 hover:border-zinc-400 transition-colors"
        >
          <div class="flex items-center gap-3 mb-3">
            <ProgressRing
              :value="track.phases.reduce((a, p) => a + p.completedDeliverableCount, 0) / Math.max(1, track.phases.reduce((a, p) => a + p.deliverableCount, 0))"
              :color="track.color"
              :size="36"
              :stroke-width="3"
            />
            <span class="text-sm font-medium text-zinc-800 group-hover:text-zinc-900">{{ track.title }}</span>
          </div>
          <p class="text-xs text-zinc-400">
            {{ track.phases.reduce((a, p) => a + p.completedDeliverableCount, 0) }}
            / {{ track.phases.reduce((a, p) => a + p.deliverableCount, 0) }} deliverables
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- Quick log -->
    <section>
      <h2 class="text-base font-semibold text-zinc-900 mb-1">Today's daily tasks</h2>
      <p class="text-sm text-zinc-400 mb-4">{{ today }}</p>

      <div v-if="quickLogTasks.length === 0" class="text-sm text-zinc-400 py-6 border border-dashed border-zinc-200 rounded-lg text-center">
        All daily tasks logged for today.
      </div>

      <div v-else class="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
        <div
          v-for="{ task, phaseName, trackColor } in quickLogTasks"
          :key="task.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ backgroundColor: trackColor }" />
            <div class="min-w-0">
              <p class="text-sm text-zinc-800 truncate">{{ task.title }}</p>
              <p class="text-xs text-zinc-400">{{ phaseName }}</p>
            </div>
          </div>
          <button
            class="ml-4 flex-shrink-0 text-xs font-medium text-zinc-600 border border-zinc-200 rounded px-3 py-1 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
            @click="openModal(task)"
          >
            Log
          </button>
        </div>
      </div>
    </section>

    <TaskLogModal
      :task="activeTask"
      :open="modalOpen"
      @close="modalOpen = false"
      @logged="onLogged"
    />
  </div>
</template>
