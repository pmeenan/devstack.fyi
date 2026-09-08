// Classic, parser-blocking script: resolve saved preference before first paint.
try {
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.dataset.theme = theme;
  }
} catch {
  // CSS follows the system preference when storage is unavailable.
}
