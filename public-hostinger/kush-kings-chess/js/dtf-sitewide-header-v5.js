(() => {
  const header = document.querySelector('[data-dtf-shell="header-v5"]');
  if (!header) return;

  const menu = header.querySelector('.dtf-global-menu');
  const nav = header.querySelector('.dtf-global-nav');

  function setOpen(open) {
    if (!menu || !nav) return;
    nav.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close primary navigation' : 'Open primary navigation');
  }

  if (menu && nav) {
    menu.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        menu.focus();
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1120) setOpen(false);
    });
  }
})();
