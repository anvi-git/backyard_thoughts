(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';

  async function loadPartial(targetId, file) {
    const target = document.getElementById(targetId);
    if (!target) return;

    try {
      const response = await fetch(file);
      if (!response.ok) return;
      const html = await response.text();
      target.innerHTML = html;
    } catch (e) {
      console.warn('Could not load partial:', file, e);
    }
  }

  function activateNav() {
    const navLinks = document.querySelectorAll('.ht-nav-link, .ht-dropdown-item, .section-nav-item');
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || link.getAttribute('data-page');
      if (href && (href === path || (path === '' && href === 'index.html'))) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        const parentDropdown = link.closest('.ht-nav-dropdown');
        if (parentDropdown) {
          const dropBtn = parentDropdown.querySelector('.ht-nav-dropbtn');
          if (dropBtn) dropBtn.classList.add('active');
        }
      }
    });

    const dropBtns = document.querySelectorAll('.ht-nav-dropbtn');
    dropBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = btn.closest('.ht-nav-dropdown');
        if (dropdown) {
          const isOpen = dropdown.classList.toggle('open');
          btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
      });
    });

    const hamburgerBtn = document.getElementById('ht-hamburger-btn') || document.getElementById('site-hamburger-btn');
    const navMenu = document.getElementById('ht-nav-menu') || document.getElementById('site-nav-menu');
    if (hamburgerBtn && navMenu) {
      hamburgerBtn.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        hamburgerBtn.classList.toggle('open', isOpen);
        hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.ht-nav-dropdown')) {
        document.querySelectorAll('.ht-nav-dropdown.open').forEach(d => {
          d.classList.remove('open');
          const btn = d.querySelector('.ht-nav-dropbtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
      if (navMenu && navMenu.classList.contains('open') && !navMenu.contains(e.target) && !hamburgerBtn?.contains(e.target)) {
        navMenu.classList.remove('open');
        if (hamburgerBtn) {
          hamburgerBtn.classList.remove('open');
          hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.ht-nav-dropdown.open').forEach(d => {
          d.classList.remove('open');
          const btn = d.querySelector('.ht-nav-dropbtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
        if (navMenu && navMenu.classList.contains('open')) {
          navMenu.classList.remove('open');
          if (hamburgerBtn) {
            hamburgerBtn.classList.remove('open');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            hamburgerBtn.focus();
          }
        }
      }
    });
  }

  function handleNewsletterSubscription() {
    document.addEventListener('submit', (event) => {
      const form = event.target.closest('.ht-nl-form, .newsletter-subscribe-form, .footer-subscribe-form');
      if (!form) return;
      const emailInput = form.querySelector('input[type="email"]');
      if (!emailInput) return;
      // Let standard form submit proceed or redirect to Substack
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // Only load partials if target container exists and is empty
    const headerContainer = document.getElementById('site-header');
    if (headerContainer && !headerContainer.children.length) {
      await loadPartial('site-header', 'header.html');
    }
    const footerContainer = document.getElementById('site-footer');
    if (footerContainer && !footerContainer.children.length) {
      await loadPartial('site-footer', 'footer.html');
    }
    activateNav();
    handleNewsletterSubscription();
  });
})();