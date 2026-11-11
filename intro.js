/* Intro: partikel -> logo "A" -> blueprint tergambar + loading bar ala game (0-100%) -> halaman login */
(function () {
  var root = document.getElementById('intro');
  var page = document.querySelector('.page');
  var body = document.body;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (!root || reduce) { body.classList.remove('intro-on'); if (root) root.remove(); return; }

  var T_BP = 4000;          /* lama animasi partikel (ms) sebelum blueprint & loading bar mulai */
  var LOAD = 3600;          /* lama bar mengisi 0 -> 100% */
  var HOLD = 650;           /* jeda di 100% sebelum masuk */
  var finished = false, raf = 0;
  if (page) page.setAttribute('inert', '');
  if (document.activeElement && document.activeElement.blur) document.activeElement.blur();

  var W = innerWidth, H = innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1), sc = 1;
  function X(v) { return +(v * W / 100).toFixed(1); }
  function Y(v) { return +(v * H / 100).toFixed(1); }
  function line(x1, y1, x2, y2, d) { return '<path d="M' + X(x1) + ' ' + Y(y1) + 'L' + X(x2) + ' ' + Y(y2) + '" pathLength="1" style="--d:' + d + 's"/>'; }
  function rect(x1, y1, x2, y2, d) { return '<path d="M' + X(x1) + ' ' + Y(y1) + 'H' + X(x2) + 'V' + Y(y2) + 'H' + X(x1) + 'Z" pathLength="1" style="--d:' + d + 's"/>'; }

  var truck = '<svg viewBox="0 0 46 24"><rect x="0" y="2" width="32" height="14" rx="3" fill="#f4b73f"/><rect x="32" y="7" width="13" height="9" rx="2" fill="#e0952b"/><circle cx="9" cy="18" r="4.5" fill="#06161a" stroke="#cfe9e5" stroke-width="1.5"/><circle cx="37" cy="18" r="4.5" fill="#06161a" stroke="#cfe9e5" stroke-width="1.5"/></svg>';

  root.innerHTML =
    '<canvas></canvas>' +
    '<div class="in-brand">ANSTRUCEDU<small>BY NAJLA SHARFINA</small></div>' +
    '<div class="gl"><div class="gl-top"><span class="gl-name">MEMUAT STRUKTUR</span><span class="gl-pct">0%</span></div>' +
    '<div class="gl-track"><div class="gl-fill"></div><div class="gl-seg"></div><div class="gl-truck">' + truck + '</div></div>' +
    '<div class="gl-tip"></div></div>' 

  var cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  var brand = root.querySelector('.in-brand');
  var gl = root.querySelector('.gl');
  var fillEl = root.querySelector('.gl-fill'), pctEl = root.querySelector('.gl-pct');
  var truckEl = root.querySelector('.gl-truck'), tipEl = root.querySelector('.gl-tip'), nameEl = root.querySelector('.gl-name');
  var trackEl = root.querySelector('.gl-track');

  function size() {
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sc = Math.max(0.45, Math.min(W, H) * 0.0017);
  }
  size();

  /* ---------- partikel -> huruf A ---------- */
  function targets() {
    var S = 200, c = document.createElement('canvas'); c.width = c.height = S;
    var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.font = '900 170px system-ui,Arial,sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('A', S / 2, S / 2 + 8);
    var d = x.getImageData(0, 0, S, S).data, pts = [], yy, xx;
    for (yy = 0; yy < S; yy += 5) for (xx = 0; xx < S; xx += 5)
      if (d[(yy * S + xx) * 4 + 3] > 128) pts.push([xx - S / 2, yy - S / 2]);
    return pts;
  }
  var COLORS = ['#7fe0f0', '#f4b73f', '#e8f4f2'];
  var parts = targets().map(function (p, k) {
    return { tx: p[0], ty: p[1], a: Math.random() * 6.283, r: (0.25 + Math.random() * 0.45) * Math.max(W, H),
      spin: 3 + Math.random() * 3, d: Math.random() * 0.8, s: 1.6 + Math.random() * 1.8, k: k % 3, c: COLORS[k % 3] };
  });
  window.addEventListener('resize', size);

  /* ---------- progres bar: sengaja tersendat seperti loading game ---------- */
  var CURVE = [[0, 0], [.14, .17], [.24, .2], [.5, .58], [.62, .6], [.74, .8], [.82, .83], [.95, .98], [1, 1]];
  function prog(q) {
    for (var k = 1; k < CURVE.length; k++) {
      if (q <= CURVE[k][0]) {
        var a = CURVE[k - 1], b = CURVE[k], f = (q - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * f;
      }
    }
    return 1;
  }
  var TIPS = ['Memasang pilar...', 'Menyambung balok...', 'Menghitung gaya reaksi...', 'Menguji beban truk...', 'Memeriksa momen lentur...'];

  var t0 = performance.now(), canvasOff = false, brandOn = false, bpOn = false, doneAt = 0, lastTip = -1;

  function frame(now) {
    if (finished) return;
    var t = now - t0, tt = t / 1000, j, p;

    if (!canvasOff) {
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H * 0.46;
      var formed = Math.min(1, Math.max(0, (tt - 2.2) / 1.0));
      if (formed > 0) {
        var gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, 190 * sc);
        gr.addColorStop(0, 'rgba(244,183,63,' + (0.22 * formed) + ')');
        gr.addColorStop(1, 'rgba(244,183,63,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      }
      for (j = 0; j < parts.length; j++) {
        p = parts[j];
        var u = Math.max(0, Math.min(1, (tt - p.d) / 2.4));
        var e = 1 - Math.pow(1 - u, 3);
        var ang = p.a + (1 - e) * p.spin, rad = p.r * (1 - e);
        var x = cx + Math.cos(ang) * rad + p.tx * sc * e;
        var y = cy + Math.sin(ang) * rad + p.ty * sc * e;
        var sz = p.s * (0.7 + 0.3 * e) * (u >= 1 ? 1 + 0.25 * Math.sin(tt * 5 + j) : 1);
        ctx.globalAlpha = 0.25 + 0.75 * u;
        ctx.fillStyle = p.c;
        if (p.k === 1) { ctx.fillRect(x - sz * 1.4, y - 0.5, sz * 2.8, 1.2); ctx.fillRect(x - 0.5, y - sz * 1.4, 1.2, sz * 2.8); }
        else ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }
    if (!brandOn && tt > 2.8) { brandOn = true; brand.classList.add('show'); }
    if (!bpOn && t > T_BP) {
      bpOn = true; gl.classList.add('show');
      cv.classList.add('fade'); brand.classList.add('gone');
      setTimeout(function () { canvasOff = true; ctx.clearRect(0, 0, W, H); }, 650);
    }
    if (bpOn) {
      var q = Math.max(0, Math.min(1, (t - T_BP) / LOAD));
      var pr = prog(q), n = Math.round(pr * 100);
      fillEl.style.width = (pr * 100) + '%';
      truckEl.style.left = (pr * (trackEl.clientWidth - 4) + 2) + 'px';
      pctEl.textContent = n + '%';
      if (n < 100) {
        var ti = Math.min(TIPS.length - 1, Math.floor(q * TIPS.length));
        if (ti !== lastTip) { lastTip = ti; tipEl.textContent = TIPS[ti]; }
      } else if (!doneAt) {
        doneAt = t; gl.classList.add('done');
        nameEl.textContent = 'STRUKTUR SIAP';
        tipEl.textContent = 'SELAMAT BELAJAR!';
      }
    }
    if (doneAt && t - doneAt >= HOLD) { finish(); return; }
    raf = requestAnimationFrame(frame);
  }

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    root.classList.add('out');
    body.classList.remove('intro-on');
    body.classList.add('intro-done');
    if (page) page.removeAttribute('inert');
    var u = document.getElementById('user') || document.getElementById('email');
    if (u && innerWidth > 700) { try { u.focus({ preventScroll: true }); } catch (e) {} }
    setTimeout(function () { root.remove(); }, 800);
  }

  root.addEventListener('click', finish);
  root.addEventListener('touchstart', finish, { passive: true });
  document.addEventListener('keydown', function (e) {
    if (!finished && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) finish();
  });
  raf = requestAnimationFrame(frame);
})();
