/* characters.js - karakter yang matanya mengikuti kursor, menengok ke formulir, memalingkan wajah saat isi kata sandi */
(function () {
  var svg = document.getElementById('cast');
  if (!svg) { window.Cast = { refresh: function () {}, happy: function () {}, sad: function () {} }; return; }

  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  var eyes = [].map.call(svg.querySelectorAll('.eye'), function (g) {
    return { w: g.querySelector('.ew'), p: g.querySelector('.ep') };
  });
  var NAMES = ['purple', 'black', 'orange', 'yellow'];
  var lean = {}, mouth = {};
  NAMES.forEach(function (n) { lean[n] = document.getElementById('c-' + n); mouth[n] = document.getElementById('m-' + n); });

  var POSE = {
    idle:  { purple: '', black: '', orange: '', yellow: '' },
    form:  { purple: 'skewX(-5deg)', black: 'skewX(-4deg)', orange: 'skewX(-2deg)', yellow: 'skewX(-3deg)' },
    peek:  { purple: 'skewX(-9deg)', black: 'skewX(-6deg)', orange: 'skewX(-3deg)', yellow: 'skewX(-5deg)' },
    away:  { purple: 'skewX(9deg)',  black: 'skewX(6deg)',  orange: 'skewX(3deg)',  yellow: 'skewX(5deg)' },
    sad:   { purple: 'skewX(15deg) scaleY(.93)', black: 'skewX(-6deg)', orange: '', yellow: 'skewX(4deg)' },
    happy: { purple: '', black: '', orange: '', yellow: '' }
  };
  var M = {
    idle:  { purple: 'M142 104h20', black: 'M236 192h22', orange: 'M110 306q10 9 20 0', yellow: 'M318 278h26' },
    away:  { purple: 'M147 104h10', black: 'M240 192h14', orange: 'M116 308h8',        yellow: 'M324 278h14' },
    peek:  { purple: 'M147 104a5 6 0 1 0 10 0a5 6 0 1 0-10 0', black: 'M241 192a6 6 0 1 0 12 0a6 6 0 1 0-12 0', orange: 'M115 306a5 6 0 1 0 10 0a5 6 0 1 0-10 0', yellow: 'M325 278a6 6 0 1 0 12 0a6 6 0 1 0-12 0' },
    sad:   { purple: 'M142 109q10-9 20 0', black: 'M236 197q11-9 22 0', orange: 'M110 313q10-10 20 0', yellow: 'M318 282q6-6 13 0t13 0' },
    happy: { purple: 'M140 100q12 14 24 0', black: 'M234 188q13 15 26 0', orange: 'M106 302q14 18 28 0', yellow: 'M316 274q14 16 28 0' }
  };
  M.form = M.idle;

  var state = 'idle', focusEl = null, tgt = { x: innerWidth * 0.3, y: innerHeight * 0.4 }, timer = 0;

  function look() {
    eyes.forEach(function (e) {
      var r = e.w.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx, dy;
      if (state === 'away') { dx = -3.4; dy = -2.8; }
      else if (state === 'sad') { dx = 0; dy = 3.4; }
      else {
        var vx = tgt.x - cx, vy = tgt.y - cy, d = Math.hypot(vx, vy) || 1, k = Math.min(1, d / 140) * 3.6;
        dx = vx / d * k; dy = vy / d * k;
      }
      e.p.style.transform = 'translate(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px)';
    });
  }

  function apply() {
    NAMES.forEach(function (n) {
      lean[n].style.transform = POSE[state][n] || '';
      mouth[n].setAttribute('d', M[state][n]);
    });
    look();
  }

  function setState(s) { state = s; apply(); }

  function aimAtFocus() {
    if (!focusEl) return;
    var r = focusEl.getBoundingClientRect();
    var caret = Math.min(r.width - 6, 10 + (focusEl.value || '').length * 8.5);
    tgt = { x: r.left + caret, y: r.top + r.height / 2 };
  }

  function computeState() {
    if (!focusEl) return 'idle';
    if (focusEl.id === 'pass') return focusEl.type === 'text' ? 'peek' : 'away';
    return 'form';
  }
  function refresh() { if (state === 'sad' || state === 'happy') return; aimAtFocus(); setState(computeState()); }

  document.addEventListener('mousemove', function (e) {
    if (state === 'idle') { tgt = { x: e.clientX, y: e.clientY }; look(); }
  });
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.matches && e.target.matches('#form input[type="text"],#form input[type="email"],#form input[type="password"]')) { focusEl = e.target; refresh(); }
  });
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      var a = document.activeElement;
      if (!a || !a.matches || !a.matches('#form input[type="text"],#form input[type="email"],#form input[type="password"]')) { focusEl = null; refresh(); }
    }, 0);
  });
  document.addEventListener('input', function (e) { if (e.target === focusEl) { aimAtFocus(); look(); } });
  window.addEventListener('resize', look);

  /* berkedip acak */
  if (!reduce) {
    (function blink() {
      setTimeout(function () {
        svg.classList.add('blink');
        setTimeout(function () { svg.classList.remove('blink'); blink(); }, 110);
      }, 2200 + Math.random() * 2800);
    })();
  }

  window.Cast = {
    refresh: refresh,
    sad: function () {
      clearTimeout(timer); setState('sad');
      timer = setTimeout(function () { state = 'idle'; refresh(); }, 2200);
    },
    happy: function () {
      clearTimeout(timer); setState('happy');
      if (reduce || !svg.animate) return;
      [].forEach.call(svg.querySelectorAll('.drop'), function (g, i) {
        g.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-28px)' }, { transform: 'translateY(0)' }],
          { duration: 460, delay: i * 90, easing: 'cubic-bezier(.3,.7,.4,1)' });
      });
    }
  };
  apply();
})();
