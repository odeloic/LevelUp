export function useDarkMode() {
  const isDark = useState('darkMode', () => false)

  function apply(dark: boolean) {
    isDark.value = dark
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', dark)
      localStorage.setItem('colorScheme', dark ? 'dark' : 'light')
    }
  }

  function init() {
    if (!import.meta.client) return
    const stored = localStorage.getItem('colorScheme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    apply(stored !== null ? stored === 'dark' : prefersDark)
  }

  function toggle() { apply(!isDark.value) }

  return { isDark, init, toggle }
}
