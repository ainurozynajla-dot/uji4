/* Loader keren bertema jembatan: pilar naik -> dek terbentang -> truk melintas */
(function () {
  var STEPS = ['Menyiapkan struktur...', 'Menghitung gaya reaksi...', 'Memeriksa momen lentur...', 'Menguji beban truk...', 'Struktur aman, selamat belajar!'];
  var el, running = false;

  function build(name) {
    el = document.createElement('div');
    el.className = 'ld';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML =
      '<div class="ld-in">' +
      '<p class="ld-brand">ANSTRUCEDU</p>' +
      '<svg viewBox="0 0 360 110" aria-hidden="true">' +
      '<rect class="l-water" x="-10" y="92" width="380" height="18" rx="9"/>' +
      '<rect class="l-pier" x="40" y="70" width="8" height="26"/><rect class="l-pier" x="312" y="70" width="8" height="26"/>' +
      '<rect class="l-deck" x="24" y="64" width="312" height="8" rx="4"/>' +
      '<line class="l-force" x1="0" y1="0" x2="0" y2="18"/>' +
      '<g class="l-truck"><rect x="0" y="38" width="32" height="22" rx="4" fill="#f4b73f"/><rect x="32" y="46" width="14" height="14" rx="3" fill="#e0952b"/><circle cx="9" cy="62" r="5" fill="#0b2a2f"/><circle cx="39" cy="62" r="5" fill="#0b2a2f"/></g>' +
      '</svg>' +
      '<p class="ld-name"></p><p class="ld-step"></p>' +
      '<div class="ld-bar"><div class="ld-fill"></div></div><div class="ld-pct">0%</div>' +
      '</div>';
    el.querySelector('.ld-name').textContent = name ? 'Halo, ' + name + '!' : 'Selamat datang!';
    document.body.appendChild(el);
    return el;
  }

  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }

  window.AnstruLoader = {
    /* show(callback, namaPengguna, durasiMs) */
    show: function (done, name, dur) {
      if (running) return;
      running = true;
      dur = dur || 3200;
      build(name);
      void el.offsetWidth;
      el.classList.add('on');

      var piers = el.querySelectorAll('.l-pier'), deck = el.querySelector('.l-deck'),
          truck = el.querySelector('.l-truck'), force = el.querySelector('.l-force'),
          fill = el.querySelector('.ld-fill'), pct = el.querySelector('.ld-pct'),
          step = el.querySelector('.ld-step');
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
      var t0 = performance.now(), last = -1;

      function frame(now) {
        var t = clamp((now - t0) / dur), p = ease(t);
        var pierP = ease(clamp(t / .25)), deckP = ease(clamp((t - .15) / .3)), truckP = clamp((t - .45) / .55);
        piers.forEach(function (x) { x.style.transform = 'scaleY(' + pierP + ')'; });
        deck.style.transform = 'scaleX(' + deckP + ')';
        var tx = 20 + truckP * 270;
        truck.style.transform = 'translate(' + tx + 'px,' + (truckP > 0 ? 0 : -40) + 'px)';
        truck.style.opacity = truckP > 0 ? 1 : 0;
        /* panah gaya di bawah truk */
        force.style.opacity = truckP > 0 && truckP < 1 ? .9 : 0;
        force.setAttribute('transform', 'translate(' + (tx + 22) + ',66)');
        fill.style.width = (p * 100) + '%';
        pct.textContent = Math.round(p * 100) + '%';
        var i = Math.min(STEPS.length - 1, Math.floor(t * STEPS.length));
        if (i !== last) { step.textContent = STEPS[i]; last = i; }
        if (t < 1) { requestAnimationFrame(frame); }
        else {
          setTimeout(function () {
            el.classList.add('out');
            setTimeout(function () { running = false; if (done) done(); }, 350);
          }, 350);
        }
      }
      requestAnimationFrame(frame);
    }
  };
})();
