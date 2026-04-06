<script setup lang="ts">
const { data: tracksRes } = await useFetch('/api/tracks')
const { data: completionsRes, refresh } = await useFetch('/api/completions')

const tracks = computed(() => (tracksRes.value?.ok ? tracksRes.value.data : []))
const allCompletions = computed(() => (completionsRes.value?.ok ? completionsRes.value.data : []))

// Filters
const filterTrackSlug = ref<string>('')
const filterPhaseSlug = ref<string>('')

const filteredPhases = computed(() => {
  if (!filterTrackSlug.value) return []
  const track = tracks.value.find((t) => t.slug === filterTrackSlug.value)
  return track?.phases ?? []
})

watch(filterTrackSlug, () => {
  filterPhaseSlug.value = ''
})

const filtered = computed(() => {
  let items = allCompletions.value
  if (filterTrackSlug.value) {
    items = items.filter((c) => c.trackSlug === filterTrackSlug.value)
  }
  if (filterPhaseSlug.value) {
    items = items.filter((c) => c.phaseSlug === filterPhaseSlug.value)
  }
  return items
})

// Expand notes
const expandedIds = ref<Set<number>>(new Set())
function toggleNotes(id: number) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

useHead({ title: 'Evidence log — LevelUp' })
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Evidence log</h1>
      <p class="text-sm text-zinc-400 dark:text-zinc-500">{{ filtered.length }} entries</p>
    </div>

    <!-- Filters -->
    <div class="flex gap-3 mb-6 flex-wrap">
      <select
        v-model="filterTrackSlug"
        class="text-sm border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800"
      >
        <option value="">All tracks</option>
        <option v-for="track in tracks" :key="track.slug" :value="track.slug">{{ track.title }}</option>
      </select>

      <select
        v-model="filterPhaseSlug"
        :disabled="!filterTrackSlug"
        class="text-sm border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 disabled:opacity-40"
      >
        <option value="">All phases</option>
        <option v-for="phase in filteredPhases" :key="phase.slug" :value="phase.slug">{{ phase.title }}</option>
      </select>
    </div>

    <!-- Empty state -->
    <div
      v-if="filtered.length === 0"
      class="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center"
    >
      <p class="text-sm text-zinc-400 dark:text-zinc-500">No completions logged yet.</p>
      <p class="text-xs text-zinc-300 dark:text-zinc-600 mt-1">Complete a task from the dashboard to see it here.</p>
    </div>

    <!-- Table -->
    <div v-else class="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
      <div
        v-for="entry in filtered"
        :key="entry.id"
        class="px-5 py-4"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200">{{ entry.taskTitle }}</p>
            <div class="flex items-center gap-3 mt-1 flex-wrap">
              <span class="text-xs text-zinc-400 dark:text-zinc-500">{{ entry.phaseTitle }}</span>
              <span class="text-zinc-200 dark:text-zinc-700 text-xs">·</span>
              <span class="text-xs text-zinc-400 dark:text-zinc-500">{{ formatDate(entry.completedAt) }}</span>
              <template v-if="entry.prUrl">
                <span class="text-zinc-200 dark:text-zinc-700 text-xs">·</span>
                <a
                  :href="entry.prUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline truncate max-w-[200px]"
                >{{ entry.prUrl }}</a>
              </template>
            </div>

            <!-- Notes preview -->
            <template v-if="entry.notes">
              <div
                class="mt-2 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-200"
                @click="toggleNotes(entry.id)"
              >
                <span v-if="!expandedIds.has(entry.id)" class="line-clamp-1">
                  {{ entry.notes.slice(0, 120) }}{{ entry.notes.length > 120 ? '…' : '' }}
                  <span class="text-zinc-400 dark:text-zinc-500 ml-1">expand</span>
                </span>
                <pre v-else class="whitespace-pre-wrap font-sans text-zinc-600 dark:text-zinc-300 border-l-2 border-zinc-100 dark:border-zinc-700 pl-3 mt-1">{{ entry.notes }}</pre>
              </div>
            </template>
          </div>

          <!-- Track label -->
          <div class="flex-shrink-0 mt-1">
            <span class="text-xs text-zinc-400 dark:text-zinc-500">{{ entry.trackTitle }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
