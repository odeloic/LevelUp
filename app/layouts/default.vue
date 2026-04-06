<script setup lang="ts">
const { data: userState } = await useFetch('/api/user/state')
</script>

<template>
  <div class="min-h-screen bg-white text-zinc-900 font-sans">
    <!-- Top nav -->
    <header class="border-b border-zinc-200">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <NuxtLink to="/" class="text-sm font-semibold tracking-tight text-zinc-900">LevelUp</NuxtLink>
          <nav class="flex items-center gap-6">
            <NuxtLink
              to="/"
              class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              active-class="text-zinc-900 font-medium"
            >Dashboard</NuxtLink>
            <NuxtLink
              to="/log"
              class="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              active-class="text-zinc-900 font-medium"
            >Evidence log</NuxtLink>
          </nav>
        </div>
        <div v-if="userState?.ok" class="flex items-center gap-4 text-sm text-zinc-500">
          <span>Week {{ userState.data.currentWeek }} / 12</span>
          <span class="text-zinc-300">|</span>
          <span>{{ userState.data.streakDays }}d streak</span>
          <span class="text-zinc-300">|</span>
          <span class="font-medium text-zinc-900">{{ userState.data.xp }} XP</span>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-5xl mx-auto px-6 py-10">
      <slot />
    </main>
  </div>
</template>
