(function(){
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sections arrive once; native scroll stays intact.
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, {threshold: .06, rootMargin: '0px 0px -4% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
    // Deep links and print-like captures: never leave content hidden.
    window.addEventListener('load', function(){ setTimeout(function(){
      document.querySelectorAll('.reveal').forEach(function(el){
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in');
      });
    }, 60); });
  }

  // Sticky header gets a hairline once the page moves.
  var header = document.querySelector('.site-header');
  var onScroll = function(){ header.classList.toggle('is-stuck', scrollY > 8); };
  addEventListener('scroll', onScroll, {passive: true}); onScroll();

  // Five jobs: one chapter at a time. Click, arrows, Home, End.
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-step]'));
  function select(btn, focus){
    tabs.forEach(function(b){
      var on = b === btn;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(b.getAttribute('aria-controls'));
      if (!panel) return;
      if (on) {
        panel.hidden = false;
        panel.classList.remove('is-entering'); void panel.offsetWidth;
        if (!reduced) panel.classList.add('is-entering');
      } else panel.hidden = true;
    });
    if (focus) btn.focus();
    if (btn.scrollIntoView && btn.parentNode.scrollWidth > btn.parentNode.clientWidth) {
      btn.parentNode.scrollTo({left: btn.offsetLeft - parseFloat(getComputedStyle(btn.parentNode).paddingLeft || 0), behavior: reduced ? 'auto' : 'smooth'});
    }
  }
  tabs.forEach(function(btn, i){
    btn.addEventListener('click', function(){ select(btn); });
    btn.addEventListener('keydown', function(ev){
      var j = i;
      if (ev.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (ev.key === 'ArrowLeft') j = (i + tabs.length - 1) % tabs.length;
      else if (ev.key === 'Home') j = 0;
      else if (ev.key === 'End') j = tabs.length - 1;
      else return;
      ev.preventDefault(); select(tabs[j], true);
    });
  });

  // The OS ball opens the system behind the real club photo.
  var layer = document.getElementById('os-layer');
  var sw = document.getElementById('os-layer-toggle');
  var ball = document.getElementById('os-ball-toggle');
  function toggle(){
    var open = sw.getAttribute('aria-pressed') !== 'true';
    sw.setAttribute('aria-pressed', String(open));
    sw.querySelector('span').textContent = open ? 'Back to the real club' : 'Reveal the OS layer';
    ball.setAttribute('aria-expanded', String(open));
    ball.setAttribute('aria-label', open ? 'Show the real club photo' : 'Reveal the OS layer behind the club screen');
    layer.classList.toggle('is-open', open);
    layer.setAttribute('aria-hidden', String(!open));
    document.getElementById('object-index').textContent = open ? '02 / The operating layer' : '01 / The real club floor';
    document.getElementById('object-action-text').innerHTML = open ? 'Touch the OS ball.<br>Back to the real club.' : 'Touch the OS ball.<br>See the system behind it.';
    document.getElementById('object-source-text').innerHTML = open ? 'Product architecture.<br>Illustrative schematic.' : 'Original photo.<br>Real screen content.';
  }
  sw.addEventListener('click', toggle);
  ball.addEventListener('click', toggle);
})();
