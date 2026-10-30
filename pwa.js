// Registers the offline helper so the site can be saved to a phone's home screen.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* not available here */ });
  });
}
