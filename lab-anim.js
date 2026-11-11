/* lab-anim.js : animasi teks halaman laboratorium */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* logo: tiap huruf naik bergantian, lalu berkilau */
  var brand = $('.brand');
  if (brand && !reduce) {
    var t = brand.textContent; brand.setAttribute('aria-label', t); brand.textContent = '';
    t.split('').forEach(function (ch, i) {
      var s = document.createElement('span'); s.className = 'lt'; s.style.setProperty('--i', i); s.setAttribute('aria-hidden', 'true'); s.textContent = ch; brand.appendChild(s);
    });
    setTimeout(function () { brand.classList.add('shine'); }, 1400);
  }

  /* judul menu: kata naik satu per satu */
  $$('nav button').forEach(function (btn, k) {
    btn.style.setProperty('--k', k);
    var b = $('b', btn);
    if (!b || reduce) return;
    var words = b.textContent.trim().split(/\s+/);
    b.setAttribute('aria-label', words.join(' ')); b.textContent = '';
    words.forEach(function (w, i) {
      var o = document.createElement('span'), n = document.createElement('i');
      o.className = 'lw'; o.setAttribute('aria-hidden', 'true'); n.textContent = w; n.style.setProperty('--i', i); n.style.setProperty('--b', (.15 + k * .12) + 's');
      o.appendChild(n); b.appendChild(o); if (i < words.length - 1) b.appendChild(document.createTextNode(' '));
    });
    /* riak saat diklik */
    btn.addEventListener('pointerdown', function (e) {
      if (reduce) return;
      var r = btn.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = document.createElement('span');
      s.className = 'rip'; s.style.width = s.style.height = d + 'px';
      s.style.left = (e.clientX - r.left - d / 2) + 'px'; s.style.top = (e.clientY - r.top - d / 2) + 'px';
      btn.appendChild(s); setTimeout(function () { s.remove(); }, 650);
    });
  });

  /* mesin ketik */
  function typeInto(el, text, speed, done) {
    if (reduce) { el.textContent = text; if (done) done(); return; }
    el._tk = (el._tk || 0) + 1; var id = el._tk, i = 0;
    el.classList.add('typing'); el.textContent = '';
    (function step() {
      if (el._tk !== id) return;
      i++; el.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(step, speed + Math.random() * speed * .6);
      else { setTimeout(function () { if (el._tk === id) el.classList.remove('typing'); }, 900); if (done) done(); }
    })();
  }

  /* sapaan: "Halo, nama!" */
  var hello = $('.hello'), who = $('#who');
  if (who && window.AnstruAuth && AnstruAuth.session) {
    AnstruAuth.session().then(function (s) {
      var name = s && s.name ? s.name : '';
      setTimeout(function () { typeInto(who, name ? 'Halo, ' + name + '!' : 'Selamat belajar!', 45); }, 900);
    }).catch(function () {});
  }

  /* tips yang berganti: diketik ulang tiap berubah */
  var tip = $('#tip');
  if (tip && 'MutationObserver' in window) {
    new MutationObserver(function () {
      if (tip.classList.contains('typing')) return;   /* perubahan dari mesin ketik sendiri */
      var txt = tip.textContent; if (txt) typeInto(tip, txt, 14);
    }).observe(tip, { childList: true, characterData: true, subtree: true });
    var first = tip.textContent;
    if (first) setTimeout(function () { typeInto(tip, first, 14); }, 1300);
  }
})();
