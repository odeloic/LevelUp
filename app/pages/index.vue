<script setup lang="ts">
const { data: tracksRes, refresh: refreshTracks } = await useFetch('/api/tracks')
const { data: userRes, refresh: refreshUser } = await useFetch('/api/user/state')

const tracks = computed(() => (tracksRes.value?.ok ? tracksRes.value.data : []))
const user = computed(() => (userRes.value?.ok ? userRes.value.data : null))

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
  const result: { task: { id: number; title: string; cadence: string; isDeliverable: number }; phaseId: number; phaseName: string; phaseSlug: string; trackColor: string }[] = []
  for (const track of tracks.value ?? []) {
    for (const phase of track.phases) {
      if (!phase.isUnlocked) continue
      const tasks = phaseTasksMap.value[phase.id] ?? []
      for (const task of tasks) {
        if (task.cadence === 'daily' && !todayCompletedTaskIds.value.has(task.id)) {
          result.push({ task, phaseId: phase.id, phaseName: phase.title, phaseSlug: phase.slug, trackColor: track.color })
        }
      }
    }
  }
  return result
})

// Modal state
const activeTask = ref<typeof quickLogTasks.value[number]['task'] | null>(null)
const activePhaseId = ref<number | null>(null)
const modalOpen = ref(false)

function openModal(item: typeof quickLogTasks.value[number]) {
  activeTask.value = item.task
  activePhaseId.value = item.phaseId
  modalOpen.value = true
}

const xpToast = ref<string | null>(null)
const phaseUnlocked = ref(false)

async function onLogged(xpAwarded: number, newlyUnlockedPhaseIds: number[]) {
  xpToast.value = `+${xpAwarded} XP`
  if (newlyUnlockedPhaseIds.length > 0) {
    phaseUnlocked.value = true
    setTimeout(() => (phaseUnlocked.value = false), 4000)
  }
  setTimeout(() => (xpToast.value = null), 3000)
  await Promise.all([refreshTracks(), refreshUser(), refreshCompletions()])
  // Only invalidate the affected phases so watchEffect re-fetches only what changed
  const toInvalidate = [activePhaseId.value, ...newlyUnlockedPhaseIds].filter(Boolean) as number[]
  toInvalidate.forEach((id) => delete phaseTasksMap.value[id])
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
        class="fixed top-4 right-4 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-4 py-2 rounded shadow"
      >
        {{ xpToast }}
      </div>
    </Transition>

    <!-- Phase unlock toast -->
    <PhaseUnlockToast :show="phaseUnlocked" />

    <!-- Track progress -->
    <section class="mb-10">
      <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Tracks</h1>

      <div v-if="tracks.length === 0" class="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
        <p class="text-sm text-zinc-400 dark:text-zinc-500">No tracks found — run <code class="font-mono text-xs">npm run db:seed</code> to initialize.</p>
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <NuxtLink
          v-for="track in tracks"
          :key="track.id"
          :to="`/tracks/${track.slug}`"
          class="group border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
        >
          <div class="flex items-center gap-3 mb-3">
            <ProgressRing
              :value="track.phases.reduce((a, p) => a + p.completedDeliverableCount, 0) / Math.max(1, track.phases.reduce((a, p) => a + p.deliverableCount, 0))"
              :color="track.color"
              :size="36"
              :stroke-width="3"
            />
            <span class="text-sm font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">{{ track.title }}</span>
          </div>
          <p class="text-xs text-zinc-400 dark:text-zinc-500">
            {{ track.phases.reduce((a, p) => a + p.completedDeliverableCount, 0) }}
            / {{ track.phases.reduce((a, p) => a + p.deliverableCount, 0) }} deliverables
          </p>
        </NuxtLink>
      </div>
    </section>

    <!-- Quick log -->
    <section>
      <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Today's daily tasks</h2>
      <p class="text-sm text-zinc-400 dark:text-zinc-500 mb-4">{{ today }} · press <kbd class="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">L</kbd> from anywhere to log</p>

      <div v-if="quickLogTasks.length === 0" class="py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
        <p class="text-sm text-zinc-400 dark:text-zinc-500">All daily tasks logged for today.</p>
        <p class="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Check back tomorrow to keep your streak going.</p>
      </div>

      <div v-else class="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div
          v-for="item in quickLogTasks"
          :key="item.task.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="{ backgroundColor: item.trackColor }" />
            <div class="min-w-0">
              <p class="text-sm text-zinc-800 dark:text-zinc-200 truncate">{{ item.task.title }}</p>
              <p class="text-xs text-zinc-400 dark:text-zinc-500">{{ item.phaseName }}</p>
            </div>
          </div>
          <button
            class="ml-4 flex-shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            @click="openModal(item)"
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
