// Runs inline in <head> so saved preferences apply before the first paint.
(() => {
  const root = document.documentElement;
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try {
    const saved = localStorage.getItem('portfolio-theme');
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {}
  function apply() {
    const theme = preference || (system.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#171c19' : '#f6f5ef');
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.hidden = false;
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.setAttribute(
        'aria-label',
        `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
      );
      button.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    }
  }
  apply();
  system.addEventListener('change', () => {
    if (!preference) apply();
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'portfolio-theme' || event.key === null) {
      preference =
        event.newValue === 'dark' || event.newValue === 'light'
          ? event.newValue
          : null;
      apply();
    }
  });
  document.addEventListener(
    'DOMContentLoaded',
    () => {
      apply();
      document.getElementById('theme-toggle')?.addEventListener('click', () => {
        preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem('portfolio-theme', preference);
        } catch {}
        apply();
      });
    },
    { once: true },
  );
})();
