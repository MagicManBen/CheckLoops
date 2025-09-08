(function(){
  // Simple mobile UA + width check
  function isMobileUA(){
    const ua = navigator.userAgent || '';
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|Opera Mini|IEMobile/i.test(ua);
  }

  async function resourceExists(url){
    try{
      const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    }catch(_){
      return false;
    }
  }

  // Public helper to redirect if a .mobile.html sibling exists
  window.redirectStaffToMobile = async function(opts = { threshold: 768 }) {
    try{
      const url = new URL(location.href);
      // don't redirect if explicitly asked for desktop
      if (url.searchParams.get('view') === 'desktop') return;
      // don't redirect mobile pages to themselves
      if (url.pathname.includes('.mobile.')) return;

      const smallScreen = window.innerWidth && window.innerWidth <= opts.threshold;
      const wantsMobile = isMobileUA() || smallScreen;
      if (!wantsMobile) return;

      // only handle .html pages
      if (!url.pathname.endsWith('.html')) return;

      // build candidate mobile path (insert .mobile before .html)
      const mobilePath = url.pathname.replace(/\.html$/, '.mobile.html');
      const mobileUrl = url.origin + mobilePath + url.search;

      if (await resourceExists(mobileUrl)) {
        // use replace so back doesn't lead back to redirect
        location.replace(mobileUrl);
      }
    }catch(e){
      // swallow errors to avoid breaking page load
      console.warn('redirectStaffToMobile error', e);
    }
  };

  // auto-run as soon as reasonable
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.redirectStaffToMobile());
  } else {
    window.redirectStaffToMobile();
  }
})();
