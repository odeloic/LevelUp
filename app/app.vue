<script setup lang="ts">
const { init } = useDarkMode()
onMounted(init)
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
