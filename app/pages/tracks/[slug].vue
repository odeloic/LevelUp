<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data: res, refresh } = await useFetch(`/api/tracks/${slug}`)

const track = computed(() => (res.value?.ok ? res.value.data : null))

// Phase status helpers
function phaseStatus(phase: NonNullable<typeof track.value>['phases'][number]) {
  if (!phase.isUnlocked) return 'locked'
  if (phase.completedDeliverableCount >= phase.deliverableCount && phase.deliverableCount > 0) return 'completed'
  return 'active'
}

// Modal state
const activeTask = ref<{ id: number; title: string; description: string | null; cadence: string; isDeliverable: number } | null>(null)
const modalOpen = ref(false)

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

useHead({ title: track.value ? `${track.value.title} — LevelUp` : 'Track — LevelUp' })
</script>

<template>
  <div v-if="track">
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

    <!-- Header -->
    <div class="flex items-start gap-4 mb-8">
      <div>
        <NuxtLink to="/" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 mb-2 inline-block">&larr; Dashboard</NuxtLink>
        <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{{ track.title }}</h1>
        <p v-if="track.description" class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{{ track.description }}</p>
      </div>
    </div>

    <!-- Phase level map -->
    <div class="relative">
      <!-- Vertical connector line -->
      <div class="absolute left-[19px] top-6 bottom-6 w-px bg-zinc-100 dark:bg-zinc-800 z-0" />

      <div v-if="track.phases.length === 0" class="py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
        <p class="text-sm text-zinc-400 dark:text-zinc-500">No phases found for this track.</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="phase in track.phases"
          :key="phase.id"
          class="relative"
        >
          <div
            class="relative z-10 border rounded-lg transition-colors"
            :class="{
              'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900': phaseStatus(phase) === 'active',
              'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50': phaseStatus(phase) === 'locked',
              'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900': phaseStatus(phase) === 'completed',
            }"
          >
            <div class="flex items-start gap-4 p-4">
              <!-- Status icon -->
              <div
                class="w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0"
                :class="{
                  'border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-900': phaseStatus(phase) === 'active',
                  'border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800': phaseStatus(phase) === 'locked',
                  'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800': phaseStatus(phase) === 'completed',
                }"
              >
                <!-- Completed checkmark -->
                <svg v-if="phaseStatus(phase) === 'completed'" class="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <!-- Lock icon -->
                <svg v-else-if="phaseStatus(phase) === 'locked'" class="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <!-- Active dot -->
                <div v-else class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: track.color }" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <NuxtLink
                    v-if="phaseStatus(phase) !== 'locked'"
                    :to="`/phases/${phase.slug}`"
                    class="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:underline"
                  >{{ phase.title }}</NuxtLink>
                  <span v-else class="text-sm font-medium text-zinc-400 dark:text-zinc-500">{{ phase.title }}</span>
                  <span class="text-xs text-zinc-400 dark:text-zinc-500">Wk {{ phase.weekStart }}–{{ phase.weekEnd }}</span>
                </div>

                <!-- Active: progress -->
                <div v-if="phaseStatus(phase) === 'active'" class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {{ phase.completedDeliverableCount }} / {{ phase.deliverableCount }} deliverables complete
                </div>

                <!-- Completed: summary link -->
                <div v-if="phaseStatus(phase) === 'completed'" class="mt-1">
                  <NuxtLink :to="`/phases/${phase.slug}`" class="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300">
                    View phase &rarr;
                  </NuxtLink>
                </div>

                <!-- Locked: blocking items -->
                <div v-if="phaseStatus(phase) === 'locked' && phase.blockingTasks.length > 0" class="mt-2">
                  <p class="text-xs text-zinc-400 dark:text-zinc-500 mb-1">Blocked by incomplete deliverables:</p>
                  <ul class="space-y-0.5">
                    <li
                      v-for="bt in phase.blockingTasks"
                      :key="bt.id"
                      class="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5"
                    >
                      <svg class="w-3 h-3 text-zinc-300 dark:text-zinc-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {{ bt.title }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
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

  <div v-else class="text-sm text-zinc-400 dark:text-zinc-500">Track not found.</div>
</template>
