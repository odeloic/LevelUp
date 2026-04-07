<script setup lang="ts">
const { data: userRes, refresh } = await useFetch('/api/user/state')
const { data: xpEventsRes } = await useFetch('/api/xp-events')

const user = computed(() => (userRes.value?.ok ? userRes.value.data : null))
const xpEvents = computed(() => (xpEventsRes.value?.ok ? xpEventsRes.value.data : []))

const { isDark, toggle: toggleDark } = useDarkMode()

// Week start date override
const startedAt = ref('')
const saving = ref(false)
const saveSuccess = ref(false)

watch(user, (u) => {
  if (u && !startedAt.value) startedAt.value = u.startedAt
}, { immediate: true })

async function saveStartDate() {
  if (!startedAt.value) return
  saving.value = true
  saveSuccess.value = false
  try {
    await $fetch('/api/user/state', {
      method: 'PATCH',
      body: { startedAt: startedAt.value },
    })
    await refresh()
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 2000)
  } finally {
    saving.value = false
  }
}

function formatEventType(type: string) {
  const labels: Record<string, string> = {
    daily:         'Daily task',
    weekly:        'Weekly task',
    end_of_phase:  'Phase task',
    deliverable:   'Deliverable',
    phase_unlock:  'Phase unlock',
    streak_7_days: 'Streak bonus (retired)',
  }
  return labels[type] ?? type
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

useHead({ title: 'Settings — LevelUp' })
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-8">Settings</h1>

    <!-- Week Progression -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Week progression</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        Your current week is automatically calculated from your start date.
        <span v-if="user"> Currently <strong class="text-zinc-900 dark:text-zinc-100">Week {{ user.currentWeek }}</strong> of 12.</span>
      </p>

      <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Start date
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model="startedAt"
              type="date"
              class="text-sm border border-zinc-200 dark:border-zinc-700 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <button
              class="text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-1.5 rounded hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 transition-colors"
              :disabled="saving"
              @click="saveStartDate"
            >
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
            <span v-if="saveSuccess" class="text-sm text-emerald-600 dark:text-emerald-400">Saved</span>
          </div>
          <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1.5">
            Changing the start date shifts your week counter. Week 1 begins on this date.
          </p>
        </div>
      </div>
    </section>

    <!-- Appearance -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Appearance</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Stored in localStorage, respects system preference on first load.</p>

      <div class="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200">Dark mode</p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ isDark ? 'Currently on' : 'Currently off' }}</p>
          </div>
          <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            :class="isDark ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-700'"
            @click="toggleDark"
            :aria-label="isDark ? 'Disable dark mode' : 'Enable dark mode'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white dark:bg-zinc-900 shadow transition-transform"
              :class="isDark ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>
    </section>

    <!-- XP History -->
    <section>
      <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">XP history</h2>
      <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
        All XP-earning events.
        <span v-if="user"> Total: <strong class="text-zinc-900 dark:text-zinc-100">{{ user.xp }} XP</strong></span>
      </p>

      <div v-if="xpEvents.length === 0" class="py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-center">
        <p class="text-sm text-zinc-400 dark:text-zinc-500">No XP events yet — complete a task to get started.</p>
      </div>

      <div v-else class="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        <div
          v-for="event in xpEvents"
          :key="event.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <div>
            <p class="text-sm text-zinc-800 dark:text-zinc-200">{{ formatEventType(event.eventType) }}</p>
            <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{{ formatDate(event.occurredAt) }}</p>
          </div>
          <span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">+{{ event.amount }} XP</span>
        </div>
      </div>
    </section>
  </div>
</template>
