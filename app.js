/* yury.digital — motion and the two doors. No framework; one library for the scroll feel. */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1 · cyanotype develop-in: the plate arrives exposed, then resolves. */
  var plate = document.getElementById("plate");
  if (plate) {
    if (reduce) plate.classList.add("lit");
    else setTimeout(function () { plate.classList.add("lit"); }, 420);
  }

  /* 2 · bars grow from zero; the number beside them is already readable. */
  var bars = [].slice.call(document.querySelectorAll("[data-w]"));
  function fill(el) { el.firstElementChild.style.width = el.getAttribute("data-w") + "%"; }
  var crew = [].slice.call(document.querySelectorAll(".crew .b"));
  if (reduce || !("IntersectionObserver" in window)) {
    bars.forEach(fill);
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, i = bars.indexOf(el);
        setTimeout(function () { fill(el); }, i > -1 ? i * 110 : 0);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    bars.forEach(function (b) { b.firstElementChild.style.width = "0"; io.observe(b); });
  }
  crew.forEach(function (b) {
    var w = b.style.width; b.style.width = "0";
    setTimeout(function () { b.style.transition = "width .9s cubic-bezier(.2,.7,.2,1)"; b.style.width = w; }, 300);
  });

  /* 3 · contacts: idle chip → panel on click, never on hover. */
  var hint = document.getElementById("hint"), panel = document.getElementById("panel");
  function setPanel(open) {
    panel.classList.toggle("open", open);
    hint.setAttribute("aria-expanded", open ? "true" : "false");
  }
  hint.addEventListener("click", function () { setPanel(!panel.classList.contains("open")); });
  document.addEventListener("click", function (e) {
    if (!panel.contains(e.target) && e.target !== hint && !hint.contains(e.target)) setPanel(false);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setPanel(false); });

  /* 4 · the door. Three taps, nothing leaves the tab. */
  var Q = [
    { q: "What are you carrying in?", a: [
        ["capital", "an investor"], ["a customer", "a channel"],
        ["a team", "a builder"], ["just curiosity", "a scout"]] },
    { q: "What is your horizon?", a: [
        ["this quarter", "fast"], ["a year", "patient"], ["as long as it takes", "long"]] },
    { q: "How should the first call open?", a: [
        ["with the numbers", "numbers"], ["with the product", "product"], ["with the person", "person"]] }
  ];
  var pick = [null, null, null];
  var quiz = document.getElementById("quiz"), qopen = document.getElementById("qopen");

  function render() {
    var h = "";
    for (var i = 0; i < Q.length; i++) {
      if (i > 0 && pick[i - 1] === null) break;
      h += '<div class="q"><p>' + Q[i].q + '</p><div class="opts">';
      for (var j = 0; j < Q[i].a.length; j++) {
        h += '<button type="button" data-q="' + i + '" data-j="' + j + '" aria-pressed="' +
             (pick[i] === j ? "true" : "false") + '">' + Q[i].a[j][0] + "</button>";
      }
      h += "</div></div>";
    }
    if (pick[2] !== null) {
      var who = Q[0].a[pick[0]][1], pace = Q[1].a[pick[1]][1], open = Q[2].a[pick[2]][1];
      var line = {
        numbers: "ARR, the cohort and the raise — in the first five minutes.",
        product: "A live search against your own requirement, in the first five minutes.",
        person:  "Fourteen years in one breath, then your turn."
      }[open];
      var pacing = { fast: "Quarter-sized", patient: "Year-sized", long: "No clock on it" }[pace];
      h += '<p class="qout">→ ' + pacing + ', and you come as <b>' + who + "</b>.<br>" +
           line + '<br><br><a class="btn" href="https://t.me/jerry_sahon?text=' +
           encodeURIComponent("Hi Yury — " + who + ", " + pace + " horizon, start with the " + open + ".") +
           '" target="_blank" rel="noopener">Say that to me on Telegram</a></p>';
    }
    quiz.innerHTML = h;
  }

  qopen.addEventListener("click", function () {
    var open = !quiz.classList.contains("open");
    quiz.classList.toggle("open", open);
    qopen.setAttribute("aria-expanded", open ? "true" : "false");
    qopen.textContent = open ? "Close" : "Open the door";
    if (open && !quiz.innerHTML) render();
  });
  quiz.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-q]");
    if (!b) return;
    pick[+b.dataset.q] = +b.dataset.j;
    for (var k = +b.dataset.q + 1; k < 3; k++) pick[k] = null;
    render();
  });

  /* 5 · scroll feel: Lenis, pinned, and only when motion is welcome. */
  if (!reduce) {
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/lenis/1.0.42/lenis.min.js";
    s.onload = function () {
      if (!window.Lenis) return;
      var l = new window.Lenis({ duration: 1.05, smoothWheel: true });
      (function raf(t) { l.raf(t); requestAnimationFrame(raf); })(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var el = document.querySelector(a.getAttribute("href"));
          if (!el) return;
          e.preventDefault(); l.scrollTo(el, { offset: -70 });
        });
      });
    };
    document.head.appendChild(s);
  }
})();
