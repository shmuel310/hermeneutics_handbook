/* ==========================================================================
   HERMENEUTICA: Client-Side Interactive Controller (assets/js/handbook.js)
   - Instant Bilingual Engine (EN ⇄ zh-TW) with localStorage persistence
   - Triple-Layer SBL Footnote Glass Popover & Searchable Bento Apparatus
   - Sticky Left Sidebar Scroll-Spy across Sections 01–06
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'hermeneutica_lang';
  let lastClickedPill = null;

  function getActiveLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'zh' || saved === 'en') ? saved : 'en';
  }

  function applyLanguage(lang) {
    document.body.setAttribute('data-active-lang', lang);
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-Hant' : 'en');
    localStorage.setItem(STORAGE_KEY, lang);

    const toggleLabel = document.getElementById('lang-toggle-label');
    if (toggleLabel) {
      toggleLabel.textContent = lang === 'en' ? '繁體中文 · ZH' : 'English · EN';
    }

    const searchInput = document.getElementById('fn-search-input');
    if (searchInput) {
      searchInput.placeholder = lang === 'en'
        ? 'Filter 50+ SBL footnotes by scholar, work, or topic...'
        : '搜尋此章 50+ 則學術腳註（學者、書名或關鍵字）...';
    }
  }

  function initLanguageToggle() {
    applyLanguage(getActiveLang());
    const btn = document.getElementById('lang-toggle-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        const next = getActiveLang() === 'en' ? 'zh' : 'en';
        applyLanguage(next);
      });
    }
  }

  function initFootnotePopovers() {
    let popover = document.getElementById('fn-glass-popover');
    if (!popover) {
      popover = document.createElement('div');
      popover.id = 'fn-glass-popover';
      popover.innerHTML =
        '<div class="popover-header"><span id="popover-fn-num">FOOTNOTE</span><span>SBL / TURABIAN</span></div>' +
        '<div id="popover-fn-body"></div>';
      document.body.appendChild(popover);
    }

    const numEl = document.getElementById('popover-fn-num');
    const bodyEl = document.getElementById('popover-fn-body');
    let hideTimeout = null;

    function showPopoverForPill(pill) {
      clearTimeout(hideTimeout);
      const fnNum = pill.getAttribute('data-fn');
      if (!fnNum) return;
      const fnItem = document.getElementById('fn-' + fnNum);
      if (!fnItem) return;

      const lang = getActiveLang();
      const langSpan = fnItem.querySelector('[data-lang="' + lang + '"]') || fnItem.querySelector('.fn-text');
      if (!langSpan) return;

      const padded = String(fnNum).padStart(2, '0');
      numEl.textContent = (lang === 'en' ? 'NOTE ' : '學術腳註 ') + padded;
      bodyEl.innerHTML = langSpan.innerHTML;

      popover.classList.add('visible');

      const rect = pill.getBoundingClientRect();
      const popWidth = Math.min(410, window.innerWidth - 24);
      let left = rect.left + (rect.width / 2) - (popWidth / 2);
      left = Math.max(12, Math.min(left, window.innerWidth - popWidth - 12));

      let top = rect.bottom + 10;
      if (top + 160 > window.innerHeight) {
        top = Math.max(12, rect.top - 150);
      }

      popover.style.left = left + 'px';
      popover.style.top = top + 'px';
    }

    function scheduleHide() {
      hideTimeout = setTimeout(function () {
        popover.classList.remove('visible');
      }, 180);
    }

    document.querySelectorAll('.fn-pill').forEach(function (pill) {
      pill.addEventListener('mouseenter', function () {
        showPopoverForPill(pill);
      });
      pill.addEventListener('mouseleave', scheduleHide);
      pill.addEventListener('focus', function () {
        showPopoverForPill(pill);
      });
      pill.addEventListener('blur', scheduleHide);
      pill.addEventListener('click', function () {
        lastClickedPill = pill;
      });
    });

    popover.addEventListener('mouseenter', function () {
      clearTimeout(hideTimeout);
    });
    popover.addEventListener('mouseleave', scheduleHide);

    document.querySelectorAll('.fn-back-link').forEach(function (backLink) {
      backLink.addEventListener('click', function (e) {
        const fnNum = backLink.getAttribute('data-fn-back');
        if (lastClickedPill && lastClickedPill.getAttribute('data-fn') === fnNum) {
          e.preventDefault();
          lastClickedPill.scrollIntoView({ behavior: 'smooth', block: 'center' });
          lastClickedPill.focus();
          return;
        }
        const activeContainer = document.querySelector('[data-lang="' + getActiveLang() + '"] .fn-pill[data-fn="' + fnNum + '"]')
          || document.querySelector('.fn-pill[data-fn="' + fnNum + '"]');
        if (activeContainer) {
          e.preventDefault();
          activeContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    });
  }

  function initFootnoteSearch() {
    const input = document.getElementById('fn-search-input');
    const countBadge = document.getElementById('fn-visible-count');
    if (!input) return;

    const items = Array.from(document.querySelectorAll('.footnote-card-item'));
    const total = items.length;

    input.addEventListener('input', function () {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(function (li) {
        const text = li.textContent.toLowerCase();
        const match = !q || text.indexOf(q) !== -1;
        li.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      if (countBadge) {
        countBadge.textContent = shown + ' / ' + total;
      }
    });
  }

  function initScrollSpy() {
    const sections = Array.from(document.querySelectorAll('.bento-section-card[id]'));
    const navLinks = Array.from(document.querySelectorAll('.sidebar-nav-link[data-sec-target]'));
    if (!sections.length || !navLinks.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(function (link) {
            if (link.getAttribute('data-sec-target') === id) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, { rootMargin: '-18% 0px -65% 0px', threshold: 0 });

    sections.forEach(function (sec) {
      observer.observe(sec);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLanguageToggle();
    initFootnotePopovers();
    initFootnoteSearch();
    initScrollSpy();
  });
})();
