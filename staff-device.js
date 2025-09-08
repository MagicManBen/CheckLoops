(function () {
  // Simple mobile UA + width check
  function isMobileUA() {
    const ua = navigator.userAgent || '';
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|Opera Mini|IEMobile/i.test(ua);
  }

  async function exists(path) {
    try {
      const res = await fetch(path, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    } catch (_) {
      return false;
    }
  }

  async function redirectIfMobile() {
    try {
      const url = new URL(location.href);
      // don't redirect if explicitly asked for desktop
      if (url.searchParams.get('view') === 'desktop') return;
      // don't redirect mobile pages to themselves
      if (url.pathname.includes('.mobile.')) return;
      // only handle .html pages
      if (!url.pathname.endsWith('.html')) return;

      const small = (window.innerWidth || screen.width || 0) <= 480;
      const wantsMobile = isMobileUA() || small;
      if (!wantsMobile) return;

      // build candidate mobile path (insert .mobile before .html)
      const mobilePath = url.pathname.replace(/\.html$/, '.mobile.html');
      const mobileUrl = url.origin + mobilePath + url.search;

      if (await exists(mobileUrl)) {
        // use replace so back doesn't lead back to redirect
        location.replace(mobileUrl);
      }
    } catch (e) {
      // swallow errors to avoid breaking page load
      console.warn('staff-device redirect error', e);
    }
  }

  // auto-run as soon as reasonable
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', redirectIfMobile);
  } else {
    redirectIfMobile();
  }
})();
  }
})();
