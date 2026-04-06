export function useUserState() {
  const { data, refresh } = useFetch('/api/user/state')

  const userState = computed(() => (data.value?.ok ? data.value.data : null))

  return { userState, refresh }
}
