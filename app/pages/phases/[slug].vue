<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

// Find the phase across all tracks
const { data: tracksRes } = await useFetch('/api/tracks')
const allTracks = computed(() => (tracksRes.value?.ok ? tracksRes.value.data : []))

const phase = computed(() => {
  for (const track of allTracks.value) {
    const found = track.phases.find((p) => p.slug === slug)
    if (found) return { ...found, trackTitle: track.title, trackSlug: track.slug, trackColor: track.color }
  }
  return null
})

const { data: tasksRes, refresh } = await useFetch(
  () => phase.value ? `/api/phases/${phase.value.id}/tasks` : null,
  { watch: [phase] },
)
const { data: resourcesRes } = await useFetch(
  () => phase.value ? `/api/phases/${phase.value.id}/resources` : null,
  { watch: [phase] },
)

const tasks = computed(() => (tasksRes.value?.ok ? tasksRes.value.data : []))
const resources = computed(() => (resourcesRes.value?.ok ? resourcesRes.value.data : []))

const dailyTasks = computed(() => tasks.value.filter((t) => t.cadence === 'daily'))
const weeklyTasks = computed(() => tasks.value.filter((t) => t.cadence === 'weekly'))
const deliverables = computed(() => tasks.value.filter((t) => t.cadence === 'end_of_phase' || t.isDeliverable === 1))

const activeTab = ref<'daily' | 'weekly' | 'deliverables'>('daily')

// Resource type icon map
const typeLabel: Record<string, string> = {
  book: 'Book',
  blog: 'Article',
  podcast: 'Podcast',
  website: 'Website',
  docs: 'Docs',
  video: 'Video',
}

const resourcesByType = computed(() => {
  const groups: Record<string, typeof resources.value> = {}
  for (const r of resources.value) {
    if (!groups[r.type]) groups[r.type] = []
    groups[r.type].push(r)
  }
  return groups
})

// Modal
const activeTask = ref<typeof tasks.value[number] | null>(null)
const modalOpen = ref(false)

function openModal(task: typeof tasks.value[number]) {
  activeTask.value = task
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
  await refresh()
}

useHead({ title: phase.value ? `${phase.value.title} — LevelUp` : 'Phase — LevelUp' })
</script>

<template>
  <div v-if="phase">
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

    <!-- Breadcrumb + header -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
        <NuxtLink to="/" class="hover:text-zinc-600 dark:hover:text-zinc-300">Dashboard</NuxtLink>
        <span>/</span>
        <NuxtLink :to="`/tracks/${phase.trackSlug}`" class="hover:text-zinc-600 dark:hover:text-zinc-300">{{ phase.trackTitle }}</NuxtLink>
        <span>/</span>
        <span class="text-zinc-600 dark:text-zinc-400">{{ phase.title }}</span>
      </div>
      <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{{ phase.title }}</h1>
      <p v-if="phase.description" class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{{ phase.description }}</p>
      <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Weeks {{ phase.weekStart }}–{{ phase.weekEnd }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Tasks (2/3 width) -->
      <div class="lg:col-span-2">
        <!-- Tab bar -->
        <div class="flex gap-1 border-b border-zinc-200 dark:border-zinc-800 mb-5">
          <button
            v-for="tab in (['daily', 'weekly', 'deliverables'] as const)"
            :key="tab"
            class="px-4 py-2 text-sm border-b-2 -mb-px transition-colors capitalize"
            :class="activeTab === tab
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 font-medium'
              : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'"
            @click="activeTab = tab"
          >
            {{ tab === 'deliverables' ? 'Deliverables' : tab.charAt(0).toUpperCase() + tab.slice(1) }}
          </button>
        </div>

        <!-- Task list -->
        <div class="space-y-2">
          <template v-if="activeTab === 'daily'">
            <div v-if="dailyTasks.length === 0" class="py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
              <p class="text-sm text-zinc-400 dark:text-zinc-500">No daily tasks in this phase.</p>
            </div>
            <div
              v-for="task in dailyTasks"
              :key="task.id"
              class="flex items-center justify-between border border-zinc-100 dark:border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
            >
              <div>
                <p class="text-sm text-zinc-800 dark:text-zinc-200">{{ task.title }}</p>
                <p v-if="task.description" class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ task.description }}</p>
              </div>
              <button
                class="ml-4 flex-shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                @click="openModal(task)"
              >Log</button>
            </div>
          </template>

          <template v-if="activeTab === 'weekly'">
            <div v-if="weeklyTasks.length === 0" class="py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
              <p class="text-sm text-zinc-400 dark:text-zinc-500">No weekly tasks in this phase.</p>
            </div>
            <div
              v-for="task in weeklyTasks"
              :key="task.id"
              class="flex items-center justify-between border border-zinc-100 dark:border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
            >
              <div>
                <p class="text-sm text-zinc-800 dark:text-zinc-200">{{ task.title }}</p>
                <p v-if="task.description" class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ task.description }}</p>
              </div>
              <button
                class="ml-4 flex-shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                @click="openModal(task)"
              >Log</button>
            </div>
          </template>

          <template v-if="activeTab === 'deliverables'">
            <div v-if="deliverables.length === 0" class="py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
              <p class="text-sm text-zinc-400 dark:text-zinc-500">No deliverables in this phase.</p>
            </div>
            <div
              v-for="task in deliverables"
              :key="task.id"
              class="flex items-center justify-between border border-zinc-100 dark:border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors"
            >
              <div>
                <p class="text-sm text-zinc-800 dark:text-zinc-200">{{ task.title }}</p>
                <p v-if="task.description" class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ task.description }}</p>
                <p class="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Requires PR URL</p>
              </div>
              <button
                class="ml-4 flex-shrink-0 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                @click="openModal(task)"
              >Log</button>
            </div>
          </template>
        </div>
      </div>

      <!-- Resources panel (1/3 width) -->
      <div>
        <h2 class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">Resources</h2>
        <div v-if="resources.length === 0" class="py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
          <p class="text-sm text-zinc-400 dark:text-zinc-500">No resources for this phase yet.</p>
        </div>
        <div v-else class="space-y-5">
          <div v-for="(items, type) in resourcesByType" :key="type">
            <p class="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{{ typeLabel[type] ?? type }}</p>
            <ul class="space-y-2">
              <li v-for="r in items" :key="r.id">
                <a
                  v-if="r.url"
                  :href="r.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group block"
                >
                  <p class="text-sm text-zinc-800 dark:text-zinc-200 group-hover:underline">{{ r.title }}</p>
                  <p v-if="r.author" class="text-xs text-zinc-400 dark:text-zinc-500">{{ r.author }}</p>
                  <p v-if="r.description" class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ r.description }}</p>
                </a>
                <div v-else>
                  <p class="text-sm text-zinc-800 dark:text-zinc-200">{{ r.title }}</p>
                  <p v-if="r.author" class="text-xs text-zinc-400 dark:text-zinc-500">{{ r.author }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <TaskLogModal
      :task="activeTask"
      :open="modalOpen"
      @close="modalOpen = false"
      @logged="onLogged"
    />
  </div>

  <div v-else class="text-sm text-zinc-400 dark:text-zinc-500">Phase not found.</div>
</template>
