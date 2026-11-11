/* home-anim.js : intro, animasi teks, animasi tombol, pemilih warna, ruang kelas bergerak */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- 1. intro ---------- */
  var intro = document.getElementById('hintro');
  var opened = false;

  function ready() {
    setClock();
    startTyped();
  }
  function openIntro() {
    if (opened) return;
    opened = true;
    intro.classList.add('open');
    setTimeout(function () { root.classList.add('hi-go'); ready(); }, 380);
    setTimeout(function () { root.classList.remove('hi-on'); if (intro.parentNode) intro.parentNode.removeChild(intro); }, 1500);
  }
  if (intro && root.classList.contains('hi-on')) {
    setTimeout(openIntro, 3000);
    intro.addEventListener('click', openIntro);
    intro.addEventListener('touchstart', openIntro, { passive: true });
    document.addEventListener('keydown', function (e) {
      if (!opened && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) openIntro();
    });
  } else {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    setTimeout(ready, 0);
  }

  /* ---------- 2. animasi teks: kata naik satu per satu ---------- */
  function split(el, mode) {
    var full = el.textContent.replace(/\s+/g, ' ').trim(), i = 0, frag = document.createDocumentFragment();
    function addWords(text, cls) {
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'), n = document.createElement('span');
        w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        n.className = 'wi' + (cls ? ' ' + cls : ''); n.style.setProperty('--i', i++); n.textContent = part;
        w.appendChild(n); frag.appendChild(w);
      });
    }
    Array.prototype.slice.call(el.childNodes).forEach(function (nd) {
      if (nd.nodeType === 3) addWords(nd.textContent, '');
      else if (nd.nodeType === 1) addWords(nd.textContent, /grad/.test(nd.className) ? 'grad' : '');
    });
    el.setAttribute('aria-label', full);
    el.textContent = '';
    el.appendChild(frag);
    el.classList.add('split', mode);
  }
  var h1 = $('.kelas h1');
  if (h1 && !reduce) split(h1, 'load');

  var heads = $$('h2, .h1l');
  if (!reduce) {
    heads.forEach(function (h) { split(h, 'scroll'); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('sp-in'); io.unobserve(e.target); } });
      }, { threshold: .3 });
      heads.forEach(function (h) { io.observe(h); });
    } else heads.forEach(function (h) { h.classList.add('sp-in'); });
  }

  /* teks mengetik bergantian */
  var typedEl = document.getElementById('typed'), typedOn = false;
  function startTyped() {
    if (typedOn || !typedEl || reduce) return;
    typedOn = true;
    var P = ['balok penopang', 'portal dua kolom', 'pelengkung tiga sendi', 'diagram SFD, BMD, NFD', 'lewat simulasi interaktif'];
    var pi = 0, ci = 0, del = false;
    typedEl.textContent = '';
    (function tick() {
      var p = P[pi];
      if (!del) {
        ci++; typedEl.textContent = p.slice(0, ci);
        if (ci === p.length) { del = true; return setTimeout(tick, 1600); }
        return setTimeout(tick, 60 + Math.random() * 50);
      }
      ci--; typedEl.textContent = p.slice(0, ci);
      if (ci === 0) { del = false; pi = (pi + 1) % P.length; return setTimeout(tick, 380); }
      setTimeout(tick, 28);
    })();
  }

  /* ---------- 3. tombol: panah, riak, magnet ---------- */
  var canHover = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  $$('.btn').forEach(function (b) {
    var sm = b.classList.contains('sm'), ghost = b.classList.contains('ghost'), fab = b.classList.contains('fab');
    if (!sm && !ghost) {
      var a = document.createElement('i'); a.className = 'ar'; a.setAttribute('aria-hidden', 'true'); a.textContent = '→'; b.appendChild(a);
    }
    b.addEventListener('pointerdown', function (e) {
      if (reduce) return;
      var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = document.createElement('span');
      s.className = 'rip'; s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left - d / 2) + 'px'; s.style.top = (e.clientY - r.top - d / 2) + 'px';
      b.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 700);
    });
    if (canHover && !reduce && !sm && !fab) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * .16).toFixed(1) + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * .24).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    }
  });

  /* ---------- 4. pemilih warna ---------- */
  var PALS = [['laut', 'Laut'], ['senja', 'Senja'], ['lembayung', 'Lembayung'], ['aman', 'Ramah buta warna']];
  var palBox = document.getElementById('pal');
  if (palBox) {
    var cur = root.getAttribute('data-pal') || 'laut';
    if (!PALS.some(function (p) { return p[0] === cur; })) cur = 'laut';
    palBox.innerHTML =
      '<button type="button" class="pal-btn" aria-haspopup="true" aria-expanded="false" aria-controls="pal-menu"><i class="pal-dot"></i><span class="lb">Warna</span></button>' +
      '<div class="pal-menu" id="pal-menu" hidden><p>PILIH WARNA TAMPILAN</p>' +
      PALS.map(function (p) { return '<button type="button" data-k="' + p[0] + '" aria-pressed="' + (p[0] === cur) + '"><i class="sw" data-k="' + p[0] + '"></i>' + p[1] + '</button>'; }).join('') +
      '</div>';
    var pb = $('.pal-btn', palBox), pm = $('.pal-menu', palBox);
    var toggle = function (on) { pm.hidden = !on; pb.setAttribute('aria-expanded', on); };
    pb.addEventListener('click', function () { toggle(pm.hidden); });
    document.addEventListener('click', function (e) { if (!palBox.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pm.hidden) { toggle(false); pb.focus(); } });
    $$('button', pm).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.k;
        var apply = function () { root.setAttribute('data-pal', k); };
        if (document.startViewTransition && !reduce) document.startViewTransition(apply); else apply();
        try { localStorage.setItem('anstru_pal', k); } catch (e) {}
        $$('button', pm).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        setTimeout(function () { toggle(false); }, 250);
      });
    });
  }

  /* ---------- 5. ruang kelas bergerak ---------- */
  /* jam dinding mengikuti waktu sungguhan */
  function setClock() {
    var d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() * 60 + s, h = (d.getHours() % 12) * 3600 + m;
    var sh = $('.sh'), mh = $('.mh'), hh = $('.hh');
    if (sh) sh.style.animationDelay = (-s) + 's';
    if (mh) mh.style.animationDelay = (-m) + 's';
    if (hh) hh.style.animationDelay = (-h) + 's';
  }

  /* paralaks: ikut kursor / goyang HP; kalau didiamkan, bergoyang pelan sendiri */
  var stage = $('.stage');
  if (stage && !reduce) {
    var tx = 0, ty = 0, cx = 0, cy = 0, last = 0, visible = true;
    var clamp = function (v) { return Math.max(-1, Math.min(1, v)); };
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width - .5) * 2); ty = clamp(((e.clientY - r.top) / r.height - .5) * 2); last = performance.now();
    });
    stage.addEventListener('pointerleave', function () { last = 0; });
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return;
      tx = clamp(e.gamma / 22); ty = clamp((e.beta - 40) / 22); last = performance.now();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(stage);
    }
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!visible) return;
      if (now - last > 1600) { var t = now / 1000; tx = Math.sin(t * .4) * .75; ty = Math.cos(t * .3) * .45; }
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      stage.style.setProperty('--px', cx.toFixed(3));
      stage.style.setProperty('--py', cy.toFixed(3));
    })(performance.now());
  }

  /* HP miring mengikuti kursor */
  var phone = $('.phone');
  if (phone && canHover && !reduce) {
    var zone = $('.demo2') || phone;
    zone.addEventListener('pointermove', function (e) {
      var r = phone.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2), dy = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      phone.style.setProperty('--ry', (Math.max(-1, Math.min(1, dx)) * 9).toFixed(1) + 'deg');
      phone.style.setProperty('--rx', (Math.max(-1, Math.min(1, dy)) * -7).toFixed(1) + 'deg');
    });
    zone.addEventListener('pointerleave', function () { phone.style.setProperty('--rx', '0deg'); phone.style.setProperty('--ry', '0deg'); });
  }
})();
