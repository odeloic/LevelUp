<script setup lang="ts">
const { data: userState, refresh: refreshUser } = await useFetch('/api/user/state')
const { isDark, toggle: toggleDark } = useDarkMode()
const { open: quickLogOpen, task: quickLogTask } = useQuickLog()

async function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'l' && e.key !== 'L') return
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return
  if (quickLogOpen.value) return

  const res = await $fetch('/api/tasks/today')
  if (res?.ok && res.data) {
    quickLogTask.value = res.data
    quickLogOpen.value = true
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

function closeQuickLog() {
  quickLogOpen.value = false
  quickLogTask.value = null
}

async function onQuickLogged(_xpAwarded: number, _newlyUnlockedPhaseIds: number[]) {
  await refreshUser()
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans">
    <!-- Top nav -->
    <header class="border-b border-zinc-200 dark:border-zinc-800">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6 sm:gap-8 min-w-0">
          <NuxtLink to="/" class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 flex-shrink-0">LevelUp</NuxtLink>
          <nav class="flex items-center gap-4 sm:gap-6">
            <NuxtLink
              to="/"
              class="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              active-class="text-zinc-900 dark:text-zinc-100 font-medium"
            >Dashboard</NuxtLink>
            <NuxtLink
              to="/log"
              class="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              active-class="text-zinc-900 dark:text-zinc-100 font-medium"
            >Evidence log</NuxtLink>
            <NuxtLink
              to="/settings"
              class="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              active-class="text-zinc-900 dark:text-zinc-100 font-medium"
            >Settings</NuxtLink>
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <!-- Stats: verbose on sm+, compact on mobile -->
          <div v-if="userState?.ok" class="hidden sm:flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>Week {{ userState.data.currentWeek }} / 12</span>
            <span class="text-zinc-300 dark:text-zinc-700">|</span>
            <span>{{ userState.data.totalCompletions }} done</span>
            <span class="text-zinc-300 dark:text-zinc-700">|</span>
            <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ userState.data.xp }} XP</span>
          </div>
          <div v-if="userState?.ok" class="flex sm:hidden items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>W{{ userState.data.currentWeek }}</span>
            <span>·</span>
            <span>{{ userState.data.totalCompletions }}✓</span>
            <span>·</span>
            <span class="font-medium text-zinc-900 dark:text-zinc-100">{{ userState.data.xp }}XP</span>
          </div>

          <!-- Dark mode toggle -->
          <button
            class="p-1.5 rounded text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleDark"
          >
            <!-- Sun icon (shown in dark mode) -->
            <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5" />
              <path stroke-linecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            <!-- Moon icon (shown in light mode) -->
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <slot />
    </main>

    <!-- Global quick-log modal (triggered by L shortcut) -->
    <TaskLogModal
      :task="quickLogTask"
      :open="quickLogOpen"
      @close="closeQuickLog"
      @logged="onQuickLogged"
    />
  </div>
</template>
