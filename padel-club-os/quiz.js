/* Padel Club OS · lead quiz (7 Nov 2026, Global Armenian Summit).
   Jerry: «со слайдов про Padel OS мы переходили на сайт. На сайте небольшой квиз с формой захвата,
   и после формы очень явно предложить законнектиться в LinkedIn».
   Opens from [data-quiz] buttons, the floating pill, and by itself on ?quiz=1 (the TV and stand QR codes).
   4 taps + name + contact + consent → POST padelbattle.am/api/public/os/lead (os_leads, consent row, card to Yury).
   Done screen: one big «Connect on LinkedIn». Answers survive a reload (localStorage). */
(function () {
  var API = 'https://padelbattle.am/api/public/os/lead';
  var LI_URL = 'https://www.linkedin.com/in/yu-ry/';
  var TG_URL = 'https://t.me/jerry_sahon';
  var PRIVACY = 'https://padelbattle.am/privacy';
  var KEY = 'pcos_quiz1';
  var STEPS = [
    { key: 'runs', q: 'What do you run?', list: [['padel', 'Padel or tennis club'], ['sport', 'Sports or fitness venue'], ['venue', 'Restaurant, hotel, venue'], ['invest', 'Investor or partner'], ['curious', 'Just curious']] },
    { key: 'region', q: 'Where?', list: [['am', 'Armenia'], ['cis', 'Russia, CIS'], ['eu', 'Europe'], ['us', 'USA, Canada'], ['me', 'Middle East'], ['other', 'Other']] },
    { key: 'pains', q: 'What hurts most?', hint: 'Pick up to 3', multi: 3, list: [['empty', 'Empty hours'], ['replies', 'Slow replies in chats'], ['data', 'No data on guests'], ['marketing', 'Marketing eats time'], ['sell', "Staff don't sell"]] },
    { key: 'wants', q: 'What do you want?', list: [['audit', 'Free audit of my venue'], ['demo', '15-min demo'], ['partner', 'Partnership or investment'], ['updates', 'Just updates']] },
    { key: 'contact' }
  ];
  var LI_SVG = '<svg viewBox="0 0 44 44" aria-hidden="true"><rect width="44" height="44" rx="9" fill="#0a66c2"/><path fill="#fff" d="M11.5 17.5h4.6V32h-4.6zM13.8 10.4a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4zM19 17.5h4.4v2h.1c.6-1.2 2.1-2.4 4.4-2.4 4.7 0 5.6 3.1 5.6 7.1V32h-4.6v-6.9c0-1.6 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7v7H19z"/></svg>';
  var LI_SM = '<svg viewBox="0 0 44 44" width="22" height="22" aria-hidden="true"><rect width="44" height="44" rx="8" fill="#fff"/><path fill="#0a66c2" d="M11.5 17.5h4.6V32h-4.6zM13.8 10.4a2.7 2.7 0 1 1 0 5.4 2.7 2.7 0 0 1 0-5.4zM19 17.5h4.4v2h.1c.6-1.2 2.1-2.4 4.4-2.4 4.7 0 5.6 3.1 5.6 7.1V32h-4.6v-6.9c0-1.6 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7v7H19z"/></svg>';

  function fresh() { return { step: 0, a: { pains: [] }, name: '', contact: '', ok: false, sent: false }; }
  var S = fresh();
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && typeof saved === 'object' && saved.a) S = Object.assign(fresh(), saved); } catch (e) {}
  if (S.step > 4) S.step = 4;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var q = new URLSearchParams(location.search);
  function attr() {
    var a = { src: q.get('utm_source') || 'os_site', med: q.get('utm_medium') || 'direct', cmp: q.get('utm_campaign') || 'os_quiz', landing: 'yury.digital/padel-club-os' };
    try { if (document.referrer && !/yury\.digital/.test(document.referrer)) a.first_src = new URL(document.referrer).hostname; } catch (e) {}
    return a;
  }

  // ---- markup
  var root = document.createElement('div');
  root.className = 'pq';
  root.innerHTML =
    '<button type="button" class="pq-pill" id="pqPill" hidden><img src="assets/os-ball-96.webp" alt="" width="22" height="22">Free audit <span>30 sec</span></button>' +
    '<div class="pq-back" id="pqBack" hidden></div>' +
    '<section class="pq-sheet" id="pqSheet" role="dialog" aria-modal="true" aria-labelledby="pqTitle" hidden>' +
      '<div class="pq-head"><div class="pq-brand"><img src="assets/os-ball-96.webp" alt="" width="26" height="26"><b id="pqTitle">Free audit of your club</b></div>' +
      '<button type="button" class="pq-x" id="pqX" aria-label="Close">×</button></div>' +
      '<div class="pq-bar"><button type="button" class="pq-prev" id="pqPrev" hidden>‹ Back</button><div class="pq-track"><i id="pqProg"></i></div><small id="pqCnt">1/5</small></div>' +
      '<div class="pq-body" id="pqBody" aria-live="polite"></div>' +
    '</section>';
  document.body.appendChild(root);
  var $ = function (id) { return document.getElementById(id); };
  var sheet = $('pqSheet'), back = $('pqBack'), pill = $('pqPill'), body = $('pqBody');
  var lastFocus = null;

  function open(from) {
    lastFocus = document.activeElement;
    sheet.hidden = false; back.hidden = false;
    requestAnimationFrame(function () { root.classList.add('is-open'); });
    document.documentElement.classList.add('pq-lock');
    pill.hidden = true;
    render();
    setTimeout(function () { var f = sheet.querySelector('.pq-opt,.pq-go,input'); if (f && !('ontouchstart' in window)) f.focus(); }, 60);
  }
  function close() {
    root.classList.remove('is-open');
    document.documentElement.classList.remove('pq-lock');
    setTimeout(function () { sheet.hidden = true; back.hidden = true; pillState(); }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function render() {
    var n = STEPS.length;
    $('pqProg').style.width = (S.sent ? 100 : Math.round(S.step / n * 100)) + '%';
    $('pqCnt').textContent = S.sent ? '✓' : (S.step + 1) + '/' + n;
    $('pqPrev').hidden = S.sent || S.step === 0;
    if (S.sent) return done();
    var st = STEPS[S.step];
    if (st.key === 'contact') return form();
    var cur = S.a[st.key];
    body.innerHTML = '<p class="pq-q">' + esc(st.q) + '</p>' + (st.hint ? '<p class="pq-hint">' + esc(st.hint) + '</p>' : '') +
      '<div class="pq-opts">' + st.list.map(function (o) {
        var on = st.multi ? cur.indexOf(o[0]) >= 0 : cur === o[0];
        return '<button type="button" class="pq-opt" data-v="' + o[0] + '" aria-pressed="' + on + '"><i></i>' + esc(o[1]) + '</button>';
      }).join('') + '</div>' +
      (st.multi ? '<button type="button" class="pq-go" id="pqNext"' + (cur.length ? '' : ' disabled') + '>Next</button>' : '');
    body.querySelectorAll('.pq-opt').forEach(function (b) {
      b.onclick = function () {
        var v = b.getAttribute('data-v');
        if (st.multi) {
          var i = S.a.pains.indexOf(v);
          if (i >= 0) S.a.pains.splice(i, 1); else { if (S.a.pains.length >= st.multi) S.a.pains.shift(); S.a.pains.push(v); }
          save(); render(); return;
        }
        S.a[st.key] = v; b.setAttribute('aria-pressed', 'true'); save();
        setTimeout(function () { S.step++; save(); render(); }, 170);
      };
    });
    if (st.multi) $('pqNext').onclick = function () { if (!S.a.pains.length) return; S.step++; save(); render(); };
  }

  function form() {
    body.innerHTML = '<p class="pq-q">Where do we send your audit?</p>' +
      '<label class="pq-f">Your name<input type="text" id="pqName" autocomplete="name" maxlength="80" value="' + esc(S.name) + '"></label>' +
      '<label class="pq-f">Telegram, WhatsApp or email<input type="text" id="pqContact" autocomplete="email" inputmode="email" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="@nick · +374… · name@mail.com" value="' + esc(S.contact) + '"></label>' +
      '<input class="pq-hp" type="text" id="pqWeb" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<label class="pq-ok"><input type="checkbox" id="pqOk"' + (S.ok ? ' checked' : '') + '><span>I agree that Yury Sakhonchyk (Padel Club OS) stores my answers and contact to reply to me. <a href="' + PRIVACY + '" target="_blank" rel="noopener">Privacy policy</a></span></label>' +
      '<p class="pq-err" id="pqErr"></p>' +
      '<button type="button" class="pq-go" id="pqSend">Get my free audit</button>' +
      '<p class="pq-who">Yury answers within 24 hours.</p>';
    ['pqName', 'pqContact'].forEach(function (id) { $(id).oninput = function () { S.name = $('pqName').value; S.contact = $('pqContact').value; save(); }; });
    $('pqOk').onchange = function () { S.ok = $('pqOk').checked; save(); };
    $('pqSend').onclick = send;
  }

  function send() {
    var err = $('pqErr'); err.textContent = '';
    S.name = $('pqName').value.trim(); S.contact = $('pqContact').value.trim(); S.ok = $('pqOk').checked; save();
    if (S.name.length < 2) { err.textContent = 'What is your name?'; $('pqName').focus(); return; }
    if (S.contact.length < 4) { err.textContent = 'Telegram, WhatsApp or email, please.'; $('pqContact').focus(); return; }
    if (!S.ok) { err.textContent = 'Please tick the consent box.'; return; }
    var b = $('pqSend'); b.disabled = true; b.textContent = 'Sending…';
    var fail = function (msg) { if (msg) err.textContent = msg; else err.innerHTML = 'No connection. Try again or write <a href="' + TG_URL + '" target="_blank" rel="noopener">t.me/jerry_sahon</a>.'; b.disabled = false; b.textContent = 'Get my free audit'; };
    fetch(API, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      answers: S.a, name: S.name, contact: S.contact, consent: true, lang: 'en', attr: attr(), website: $('pqWeb').value
    }) }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (x) {
      if (!x.ok) return fail(x.j && x.j.error);
      S.sent = true; save(); render();
    }).catch(function () { fail(); });
  }

  function done() {
    var first = (S.name || '').split(' ')[0];
    body.innerHTML = '<div class="pq-done"><h3>Thanks' + (first ? ', ' + esc(first) : '') + '!</h3><p>Yury will message you within 24 hours.</p>' +
      '<div class="pq-li"><span class="pq-eb">One more step</span>' +
        '<div class="pq-who2">' + LI_SVG + '<div><b>Yury Sakhonchyk</b><span>Founder &amp; CEO, Padel Club OS</span></div></div>' +
        '<a class="pq-lib" id="pqLi" href="' + LI_URL + '" target="_blank" rel="noopener">' + LI_SM + 'Connect on LinkedIn</a>' +
        '<p class="pq-note">Add a note: <b>Summit \'26</b></p></div>' +
      '<button type="button" class="pq-ghost" id="pqStay">Keep exploring the site</button>' +
      '<a class="pq-tg" href="' + TG_URL + '" target="_blank" rel="noopener">Message Yury in Telegram</a>' +
      '<button type="button" class="pq-again" id="pqAgain">One more answer</button></div>';
    $('pqStay').onclick = close;
    $('pqAgain').onclick = function () { S = fresh(); save(); render(); };
  }

  // floating pill: after the hero, or at once for QR visitors; never while the sheet is open
  function pillState() {
    if (!sheet.hidden) { pill.hidden = true; return; }
    var hero = document.querySelector('.hero');
    var past = !hero || hero.getBoundingClientRect().bottom < 80;
    pill.hidden = !(past || q.get('quiz') === '1');
    pill.classList.toggle('is-done', !!S.sent);
    pill.innerHTML = S.sent ? LI_SM + 'Connect on LinkedIn' : '<img src="assets/os-ball-96.webp" alt="" width="22" height="22">Free audit <span>30 sec</span>';
  }
  pill.onclick = function () { if (S.sent) { window.open(LI_URL, '_blank', 'noopener'); return; } open('pill'); };
  addEventListener('scroll', pillState, { passive: true });

  $('pqX').onclick = close; back.onclick = close;
  $('pqPrev').onclick = function () { if (S.step > 0) { S.step--; save(); render(); } };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) close(); });
  document.addEventListener('click', function (e) { var t = e.target.closest && e.target.closest('[data-quiz]'); if (t) { e.preventDefault(); open('cta'); } });

  pillState();
  // the TV and stand QR codes add ?quiz=1: open once the hero has been seen for a moment
  if (q.get('quiz') === '1' && !S.sent) setTimeout(function () { open('qr'); }, 900);
})();
