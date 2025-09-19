/* Lightweight guided tour for staff users. Vanilla JS, no deps. */
(function(){
  if (typeof window === 'undefined') return;

  function createEl(tag, attrs){ const e = document.createElement(tag); Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v)); return e; }

  function showTour(steps){
    if (!steps || !steps.length) return;

    let idx = 0;
    const overlay = createEl('div', { class: 'cl-tour-overlay', id: 'cl-tour-overlay' });
    const highlight = createEl('div', { class: 'cl-tour-highlight', id: 'cl-tour-highlight' });
    const tooltip = createEl('div', { class: 'cl-tour-tooltip', id: 'cl-tour-tooltip' });

    document.body.appendChild(overlay);
    document.body.appendChild(highlight);
    document.body.appendChild(tooltip);

    function positionFor(el){
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width, height: r.height, right: r.right + window.scrollX, bottom: r.bottom + window.scrollY };
    }

    function render(){
      const step = steps[idx];
      let target = document.querySelector(step.selector);
      
      // Skip steps where the target element doesn't exist (e.g., admin features for regular users)
      if (!target) {
        console.log(`Skipping tour step for missing element: ${step.selector}`);
        idx++;
        if (idx >= steps.length) { cleanup(); return; }
        render();
        return;
      }
      
      const rect = positionFor(target);

      // highlight
      highlight.style.top = (rect.top - 8) + 'px';
      highlight.style.left = (rect.left - 8) + 'px';
      highlight.style.width = (rect.width + 16) + 'px';
      highlight.style.height = (rect.height + 16) + 'px';

      // tooltip positioning: prefer right of element, fallback to bottom
      const tooltipEl = tooltip;
      tooltipEl.innerHTML = `<h4>${step.title || ''}</h4><p>${step.body || ''}</p><div class="cl-tour-controls"><span class="tour-progress">${idx + 1} of ${steps.length}</span><button class="cl-tour-skip" id="cl-tour-skip">Skip Tour</button><button class="cl-tour-btn" id="cl-tour-next">${idx === steps.length-1 ? 'Finish' : 'Next'}</button></div>`;

      // try right
      const margin = 12;
      let left = rect.right + margin;
      let top = rect.top;
      if (left + 340 > window.scrollX + window.innerWidth) {
        // place below
        left = rect.left;
        top = rect.bottom + margin;
      }
      // clamp
      if (top + tooltipEl.offsetHeight > window.scrollY + window.innerHeight) top = window.scrollY + window.innerHeight - tooltipEl.offsetHeight - 20;
      tooltipEl.style.left = Math.max(10, left) + 'px';
      tooltipEl.style.top = Math.max(10, top) + 'px';

      // Smooth scroll to ensure the element is visible
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function cleanup(){
      overlay.remove(); highlight.remove(); tooltip.remove();
      window.removeEventListener('resize', render);
      window.removeEventListener('scroll', render);
    }

    overlay.addEventListener('click', ()=>{ cleanup(); });
    window.addEventListener('resize', render);
    window.addEventListener('scroll', render);

    overlay.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') cleanup(); });

    tooltip.addEventListener('click', (e)=>{
      if (e.target.id === 'cl-tour-skip') { cleanup(); }
      if (e.target.id === 'cl-tour-next') {
        idx++; if (idx >= steps.length) { cleanup(); return; }
        render();
      }
    });

    // initial small delay to allow layout
    setTimeout(render, 120);
  }

  // expose small API
  window.CLWelcomeTour = { show: showTour };
})();
