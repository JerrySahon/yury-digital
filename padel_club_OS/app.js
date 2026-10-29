(function(){
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  function store(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // Sections arrive once; native scroll stays intact.
  if (!reduced && 'IntersectionObserver' in window) {
    root.classList.add('motion');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, {threshold: .06, rootMargin: '0px 0px -4% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
    addEventListener('load', function(){ setTimeout(function(){
      document.querySelectorAll('.reveal').forEach(function(el){ var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
    }, 60); });
  }

  var header = document.querySelector('.site-header');
  var onScroll = function(){ header.classList.toggle('is-stuck', scrollY > 8); };
  addEventListener('scroll', onScroll, {passive: true}); onScroll();

  // Preview controls: style and headline. On the public site they show only with ?lab.
  var labOn = !root.hasAttribute('data-public') || /(^|[?&#])lab\b/.test(location.search + location.hash);
  if (!labOn) { var lb = document.querySelector('.lab-bar'); if (lb) lb.remove(); }
  else root.classList.add('lab-on');
  function radioGroup(attr, rootAttr, key){
    var btns = Array.prototype.slice.call(document.querySelectorAll('[' + attr + ']'));
    function apply(v, save){
      root.setAttribute(rootAttr, v);
      btns.forEach(function(b){ b.setAttribute('aria-checked', String(b.getAttribute(attr) === v)); });
      if (rootAttr === 'data-h1') document.querySelectorAll('.h1v').forEach(function(h){ h.hidden = h.getAttribute('data-v') !== v; });
      if (save) store(key, v);
    }
    var saved = labOn ? store(key) : null;
    if (saved && btns.some(function(b){ return b.getAttribute(attr) === saved; })) apply(saved, false);
    else apply(root.getAttribute(rootAttr), false);
    btns.forEach(function(b){ b.addEventListener('click', function(){ apply(b.getAttribute(attr), true); }); });
    return btns;
  }
  var styleBtns = radioGroup('data-style-pick', 'data-style', 'pcos-style');
  radioGroup('data-h1-pick', 'data-h1', 'pcos-h1');
  addEventListener('keydown', function(ev){
    if (ev.metaKey || ev.ctrlKey || ev.altKey || (ev.target.closest && ev.target.closest('input,textarea'))) return;
    var n = parseInt(ev.key, 10); if (n >= 1 && n <= styleBtns.length) styleBtns[n-1].click();
  });

  var touched = false;

  // Hero: the OS map. Nodes are HTML; wires and packets are SVG, rebuilt from the real layout.
  var map = document.getElementById('osmap');
  if (map) (function(){
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.getElementById('om-wires');
    var core = document.getElementById('om-core');
    var srcs = Array.prototype.slice.call(map.querySelectorAll('.om-src'));
    var mods = Array.prototype.slice.call(map.querySelectorAll('.om-mod'));
    var team = document.getElementById('m-team'), rev = document.getElementById('m-rev');
    var outs = mods.concat([team]);
    var links = [];
    srcs.forEach(function(n, i){ links.push({a: n, b: core, k: 'in', i: i, n: srcs.length}); });
    outs.forEach(function(n, i){ links.push({a: core, b: n, k: 'out', i: i, n: outs.length}); });
    outs.forEach(function(n, i){ links.push({a: n, b: rev, k: 'res', i: i, n: outs.length}); });
    var first = true, lastW = 0;

    function bx(el){ var r = el.getBoundingClientRect(), o = map.getBoundingClientRect(); return {x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height}; }
    function vertical(){ return getComputedStyle(map).gridTemplateColumns.split(' ').length < 3; }
    function f(n){ return Math.round(n * 10) / 10; }

    function pathFor(L, v){
      var A = bx(L.a), B = bx(L.b), spread;
      if (!v) {
        if (L.k === 'in') {
          spread = B.h * .5 / Math.max(1, L.n - 1);
          var x1 = A.x + A.w, y1 = A.y + A.h / 2, x2 = B.x + B.w * .06, y2 = B.y + B.h * .25 + L.i * spread;
          var d = (x2 - x1) * .55;
          return 'M' + f(x1) + ' ' + f(y1) + ' C' + f(x1 + d) + ' ' + f(y1) + ' ' + f(x2 - d) + ' ' + f(y2) + ' ' + f(x2) + ' ' + f(y2);
        }
        if (L.k === 'out') {
          spread = A.h * .5 / Math.max(1, L.n - 1);
          var sx = A.x + A.w * .94, sy = A.y + A.h * .25 + L.i * spread, ex = B.x, ey = B.y + B.h / 2, dd = (ex - sx) * .55;
          return 'M' + f(sx) + ' ' + f(sy) + ' C' + f(sx + dd) + ' ' + f(sy) + ' ' + f(ex - dd) + ' ' + f(ey) + ' ' + f(ex) + ' ' + f(ey);
        }
        spread = B.h * .6 / Math.max(1, L.n - 1);
        var rx = A.x + A.w, ry = A.y + A.h / 2, tx = B.x, ty = B.y + B.h * .2 + L.i * spread, rd = (tx - rx) * .55;
        return 'M' + f(rx) + ' ' + f(ry) + ' C' + f(rx + rd) + ' ' + f(ry) + ' ' + f(tx - rd) + ' ' + f(ty) + ' ' + f(tx) + ' ' + f(ty);
      }
      // vertical: chips fall into the core, a spine runs down past every module into the result
      var C = bx(core), spine = bx(mods[0]).x - 16;
      if (L.k === 'in') {
        var cx = A.x + A.w / 2, cy = A.y + A.h, tx2 = C.x + C.w * (.3 + .4 * L.i / Math.max(1, L.n - 1)), ty2 = C.y + 4, dy = (ty2 - cy) * .6;
        return 'M' + f(cx) + ' ' + f(cy) + ' C' + f(cx) + ' ' + f(cy + dy) + ' ' + f(tx2) + ' ' + f(ty2 - dy) + ' ' + f(tx2) + ' ' + f(ty2);
      }
      var top = C.y + C.h - 4, mid = C.x + C.w / 2, r = 12;
      var head = 'M' + f(mid) + ' ' + f(top) + ' C' + f(mid) + ' ' + f(top + 34) + ' ' + f(spine) + ' ' + f(top + 14) + ' ' + f(spine) + ' ' + f(top + 56);
      if (L.k === 'out') {
        var my = B.y + B.h / 2;
        return head + ' L' + f(spine) + ' ' + f(my - r) + ' Q' + f(spine) + ' ' + f(my) + ' ' + f(spine + r) + ' ' + f(my) + ' L' + f(B.x) + ' ' + f(my);
      }
      var ay = A.y + A.h / 2, by = B.y + Math.min(30, B.h / 2);
      return 'M' + f(A.x) + ' ' + f(ay) + ' L' + f(spine + r) + ' ' + f(ay) + ' Q' + f(spine) + ' ' + f(ay) + ' ' + f(spine) + ' ' + f(ay + r) + ' L' + f(spine) + ' ' + f(by - r) + ' Q' + f(spine) + ' ' + f(by) + ' ' + f(spine + r) + ' ' + f(by) + ' L' + f(B.x) + ' ' + f(by);
    }

    function build(){
      var v = vertical();
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var now = svg.getCurrentTime ? svg.getCurrentTime() : 0;
      links.forEach(function(L, idx){
        if (v && L.k === 'res' && L.b === rev && L.i < L.n - 1 && false) return;
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', pathFor(L, v));
        p.setAttribute('id', 'omw' + idx);
        p.setAttribute('class', 'w ' + L.k);
        svg.appendChild(p);
        L.p = p;
        var len = p.getTotalLength();
        if (first && !reduced) { p.style.setProperty('--len', Math.ceil(len)); p.classList.add('draw'); p.style.animationDelay = (L.k === 'in' ? 0 : L.k === 'out' ? .35 : .7) + L.i * .05 + 's'; }
        if (reduced) return;
        var count = L.k === 'out' ? 2 : 1;
        var speed = L.k === 'in' ? 70 : L.k === 'out' ? 85 : 60;
        var dur = Math.max(1.8, Math.min(5.5, len / speed));
        for (var c = 0; c < count; c++) {
          var dot = document.createElementNS(NS, 'circle');
          dot.setAttribute('class', 'pk ' + (L.k === 'in' ? 'in' : 'out'));
          dot.setAttribute('r', L.k === 'res' ? 2.4 : 3.2);
          dot.setAttribute('opacity', '0');
          var begin = (now + (first ? 1.1 : 0) + (L.i * .53 + c * dur / count + (L.k === 'out' ? .4 : L.k === 'res' ? .9 : 0)) % dur).toFixed(2) + 's';
          var mo = document.createElementNS(NS, 'animateMotion');
          mo.setAttribute('dur', dur.toFixed(2) + 's'); mo.setAttribute('repeatCount', 'indefinite'); mo.setAttribute('begin', begin);
          mo.setAttribute('calcMode', 'spline'); mo.setAttribute('keyTimes', '0;1'); mo.setAttribute('keyPoints', '0;1'); mo.setAttribute('keySplines', '.45 0 .25 1');
          var mp = document.createElementNS(NS, 'mpath'); mp.setAttribute('href', '#omw' + idx); mp.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#omw' + idx);
          mo.appendChild(mp);
          var op = document.createElementNS(NS, 'animate');
          op.setAttribute('attributeName', 'opacity'); op.setAttribute('values', '0;1;1;0'); op.setAttribute('keyTimes', '0;.12;.84;1');
          op.setAttribute('dur', dur.toFixed(2) + 's'); op.setAttribute('repeatCount', 'indefinite'); op.setAttribute('begin', begin);
          dot.appendChild(mo); dot.appendChild(op);
          L.dots = (L.dots || []); L.dots.push(dot);
          svg.appendChild(dot);
        }
      });
      first = false;
    }

    function focus(node){
      map.classList.add('focus');
      links.forEach(function(L){
        var on = L.a === node || L.b === node || node === core;
        L.p && L.p.classList.toggle('hot', on);
        (L.dots || []).forEach(function(d){ d.classList.toggle('hot', on); });
        if (on) { L.a.classList.add('hot'); L.b.classList.add('hot'); }
      });
      node.classList.add('hot');
    }
    function blur(){
      map.classList.remove('focus');
      map.querySelectorAll('.hot').forEach(function(e){ e.classList.remove('hot'); });
      svg.querySelectorAll('.hot').forEach(function(e){ e.classList.remove('hot'); });
    }
    srcs.concat(outs, [rev, core]).forEach(function(n){
      n.addEventListener('mouseenter', function(){ blur(); focus(n); });
      n.addEventListener('mouseleave', blur);
      n.addEventListener('focus', function(){ blur(); focus(n); });
      n.addEventListener('blur', blur);
    });

    var t; function rebuild(){ clearTimeout(t); t = setTimeout(function(){ if (map.offsetWidth !== lastW) { lastW = map.offsetWidth; build(); } }, 120); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ lastW = map.offsetWidth; build(); }); else { lastW = map.offsetWidth; build(); }
    addEventListener('resize', rebuild);
    addEventListener('load', function(){ lastW = 0; rebuild(); });

    // Pause the map when it is off screen
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){
      es.forEach(function(e){ map.classList.toggle('paused', !e.isIntersecting); if (svg.pauseAnimations) { e.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations(); } });
    }).observe(map);
  })();

  // Ticker: one copy more for a seamless loop
  var tk = document.querySelector('.tk-track');
  if (tk && !reduced) Array.prototype.slice.call(tk.children).forEach(function(li){ var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); tk.appendChild(c); });

  // Fill: every free half-hour on the real TV slide is a Sell button.
  var cells = []; try { cells = JSON.parse(document.getElementById('cells').textContent); } catch (e) {}
  var layer = document.getElementById('tvs-layer');
  var left = document.getElementById('tvs-left'), sold = document.getElementById('tvs-sold'), all = document.getElementById('tvs-all');
  var fmt = function(n){ return '$' + Math.round(n).toLocaleString('en-US'); };
  var total = cells.reduce(function(s, c){ return s + c[6]; }, 0), soldSum = 0;
  function refresh(){
    var leftSum = total - soldSum;
    var leftCells = layer.querySelectorAll('button:not(.sold)').length;
    left.textContent = (leftCells / 2) + ' court-hours · ' + fmt(leftSum);
    sold.textContent = fmt(soldSum);
    if (!leftCells) { all.firstChild.nodeValue = 'All sold. Tap to reset '; }
    var hint = document.getElementById('tvs-hint'); if (hint && soldSum > 0) hint.classList.add('done');
  }
  cells.forEach(function(c){
    var b = document.createElement('button');
    b.type = 'button';
    b.style.left = c[2] + '%'; b.style.top = c[3] + '%'; b.style.width = c[4] + '%'; b.style.height = c[5] + '%';
    b.setAttribute('aria-label', 'Sell ' + c[0] + ' at ' + c[1] + ' for ' + fmt(c[6]));
    b.innerHTML = '<span>Sell</span>';
    b.addEventListener('click', function(){
      var on = !b.classList.contains('sold');
      b.classList.toggle('sold', on); b.querySelector('span').textContent = on ? '✓' : 'Sell';
      soldSum += on ? c[6] : -c[6]; refresh();
    });
    layer.appendChild(b);
  });
  all.addEventListener('click', function(){
    var btns = Array.prototype.slice.call(layer.querySelectorAll('button'));
    var rest = btns.filter(function(b){ return !b.classList.contains('sold'); });
    if (!rest.length) { btns.forEach(function(b){ b.click(); }); all.firstChild.nodeValue = 'Tap to sell them all '; return; }
    rest.forEach(function(b, i){ setTimeout(function(){ b.click(); }, reduced ? 0 : i * 55); });
  });
  if (cells.length) refresh();
  // Beckon: the first free slots pulse until the viewer sells one
  Array.prototype.slice.call(layer.querySelectorAll('button')).slice(0, 3).forEach(function(b){ b.classList.add('beckon'); });
  layer.addEventListener('click', function(){ layer.querySelectorAll('.beckon').forEach(function(b){ b.classList.remove('beckon'); }); }, {once: true});
  all.addEventListener('click', function(){ layer.querySelectorAll('.beckon').forEach(function(b){ b.classList.remove('beckon'); }); var h = document.getElementById('tvs-hint'); if (h) h.classList.add('done'); });

  // Mobile CTA: shows after the hero button scrolls away, hides at the contact block
  var mcta = document.getElementById('m-cta'), heroBtn = document.querySelector('.hero-actions .primary'), contact = document.getElementById('contact');
  if (mcta && heroBtn && 'IntersectionObserver' in window) {
    var past = false, atEnd = false;
    var upd = function(){ mcta.classList.toggle('on', past && !atEnd); };
    new IntersectionObserver(function(es){ es.forEach(function(e){ past = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }); }).observe(heroBtn);
    if (contact) new IntersectionObserver(function(es){ es.forEach(function(e){ atEnd = e.isIntersecting; upd(); }); }).observe(contact);
  }

  // Spoiler, like in a messenger.
  var sp = document.getElementById('spoiler');
  if (sp) sp.addEventListener('click', function(){ sp.setAttribute('aria-expanded', String(sp.getAttribute('aria-expanded') !== 'true')); });

  // Booking: the next working days; each opens the booking page (Telegram until a calendar link is set).
  var booking = document.getElementById('booking');
  var url = (booking && booking.getAttribute('data-url')) || 'https://t.me/jerry_sahon';
  var go = document.getElementById('bk-go'); if (go) go.href = url;
  function nextDays(n){
    var out = [], d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < n) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) out.push(new Date(d)); }
    return out;
  }
  var wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var bk = document.getElementById('bk-days');
  if (bk) nextDays(5).forEach(function(d){
    var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<small>' + wd[d.getDay()] + '</small>' + d.getDate();
    a.setAttribute('aria-label', 'Book a call on ' + d.toDateString());
    bk.appendChild(a);
  });
  var sd = document.getElementById('slot-days');
  if (sd) nextDays(3).forEach(function(d){ var s = document.createElement('span'); s.innerHTML = '<small>' + wd[d.getDay()] + '</small>' + d.getDate(); sd.appendChild(s); });
})();
