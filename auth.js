/* auth.js - penghubung ke Supabase. Dipakai bersama oleh halaman login DAN halaman lain yang mau dilindungi. */
(function () {
  var CONFIG = {
    SUPABASE_URL: 'https://mgwjeilovbbikxrmvchv.supabase.co',
    SUPABASE_KEY: 'sb_publishable_j1amus2vsiBbV5MQkYJopA_5E7UF5Ca',   /* kunci publik, aman di web */
    NEXT_PAGE: 'home.html',   /* <-- GANTI: halaman tujuan setelah login berhasil */
    LOGIN_PAGE: 'login.html',
    SIGNUP_FUNCTION: 'rapid-processor'
  };
  var REMEMBER = 'anstru_remember', GUEST = 'anstru_guest';

  /* "Ingat saya": ON -> sesi disimpan di localStorage, OFF -> hilang saat tab ditutup */
  function store() {
    try { return localStorage.getItem(REMEMBER) === '0' ? sessionStorage : localStorage; } catch (e) { return window.sessionStorage; }
  }
  var adapter = {
    getItem: function (k) { return store().getItem(k); },
    setItem: function (k, v) { store().setItem(k, v); },
    removeItem: function (k) { try { localStorage.removeItem(k); sessionStorage.removeItem(k); } catch (e) {} }
  };

  var client = null;
  if (window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
      auth: { storage: adapter, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  }

  var Auth = {
    config: CONFIG,
    client: client,
    ready: !!client,
    setRemember: function (on) { try { localStorage.setItem(REMEMBER, on ? '1' : '0'); } catch (e) {} },
    guest: function () { try { sessionStorage.setItem(GUEST, '1'); } catch (e) {} },
    clearGuest: function () { try { sessionStorage.removeItem(GUEST); } catch (e) {} },
    isGuest: function () { try { return sessionStorage.getItem(GUEST) === '1'; } catch (e) { return false; } },

    /* -> { type: 'user' | 'guest' | null, user, profile, role, name } */
    session: async function () {
      if (client) {
        try {
          var r = await client.auth.getSession();
          var s = r.data && r.data.session;
          if (s) {
            var p = null;
            try {
              var q = await client.from('profiles').select('full_name,role').eq('id', s.user.id).maybeSingle();
              p = q.data;
            } catch (e) {}
            var nm = (p && p.full_name) || (s.user.user_metadata && s.user.user_metadata.full_name) || s.user.email;
            return { type: 'user', user: s.user, profile: p, role: (p && p.role) || 'mahasiswa', name: nm };
          }
        } catch (e) {}
      }
      if (Auth.isGuest()) return { type: 'guest', role: 'tamu', name: 'Tamu' };
      return { type: null };
    },

    /* Panggil di halaman yang harus login: AnstruAuth.require().then(function(s){ ... }) */
    require: async function (opts) {
      var s = await Auth.session();
      if (!s.type) { location.replace((opts && opts.redirect) || CONFIG.LOGIN_PAGE); return new Promise(function () {}); }
      return s;
    },
    /* Khusus admin: AnstruAuth.requireAdmin() */
    requireAdmin: async function () {
      var s = await Auth.require();
      if (s.role !== 'admin') { alert('Halaman ini khusus admin.'); location.replace(CONFIG.NEXT_PAGE); return new Promise(function () {}); }
      return s;
    },
    logout: async function () {
      Auth.clearGuest();
      try { if (client) await client.auth.signOut(); } catch (e) {}
      location.replace(CONFIG.LOGIN_PAGE);
    },
    /* Pindah ke halaman berikutnya dengan transisi halus: lingkaran gelap melebar dari tombol, lalu halaman baru "terbuka" */
    goNext: function () {
      var go = function () { location.href = CONFIG.NEXT_PAGE; };
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;
      if (reduce || !document.body || !document.body.animate) return go();
      try { sessionStorage.setItem('anstru_enter', '1'); } catch (e) {}
      var btn = document.getElementById('submit') || document.getElementById('guest');
      var r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
      var cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + r.height / 2);
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;inset:0;z-index:99999;pointer-events:none;background:radial-gradient(circle at 50% 45%,#0f343b,#06161a 72%)';
      document.body.appendChild(ov);
      var page = document.querySelector('.page');
      if (page) page.animate(
        [{ opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }, { opacity: 0, transform: 'scale(.97)', filter: 'blur(4px)' }],
        { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      var a = ov.animate(
        [{ clipPath: 'circle(0px at ' + cx + 'px ' + cy + 'px)' }, { clipPath: 'circle(150vmax at ' + cx + 'px ' + cy + 'px)' }],
        { duration: 750, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
      var done = false, fin = function () { if (!done) { done = true; go(); } };
      a.onfinish = fin; setTimeout(fin, 1100);   /* cadangan kalau animasi tersendat */
    }
  };
  window.AnstruAuth = Auth;
})();
