/* login.js - logika form login/daftar dengan Supabase + karakter */
(function () {
  var A = window.AnstruAuth, Cast = window.Cast;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('form'), email = $('email'), pass = $('pass'), fullname = $('fullname'), remember = $('remember');
  var errEl = $('err'), okEl = $('ok'), submitBtn = $('submit'), guestBtn = $('guest');
  var busy = false;

  function clearMsg() { errEl.textContent = ''; okEl.textContent = ''; [].forEach.call(form.querySelectorAll('.field'), function (f) { f.classList.remove('bad'); }); }
  function fail(msg, input) {
    errEl.textContent = msg;
    if (input) { input.closest('.field').classList.add('bad'); }
    Cast.sad();
  }
  function setBusy(on) {
    busy = on;
    submitBtn.disabled = on; guestBtn.disabled = on;
    submitBtn.classList.toggle('busy', on);
  }

  function friendly(err) {
    if (err && err.friendly) return err.message;
    var m = ((err && err.message) || '').toLowerCase();
    if (!A.ready) return 'Library Supabase gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.';
    if (m.indexOf('invalid login') > -1) return 'Email atau kata sandi salah.';
    if (m.indexOf('email not confirmed') > -1) return 'Email belum dikonfirmasi. Cek kotak masuk emailmu.';
    if (m.indexOf('already registered') > -1) return 'Email ini sudah terdaftar. Silakan masuk.';
    if (m.indexOf('at least') > -1 && m.indexOf('password') > -1) return 'Kata sandi minimal 6 karakter.';
    if (m.indexOf('rate limit') > -1 || m.indexOf('too many') > -1) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
    if (m.indexOf('valid email') > -1 || m.indexOf('invalid email') > -1) return 'Format email tidak valid.';
    if (m.indexOf('fetch') > -1 || m.indexOf('network') > -1) return 'Tidak bisa terhubung ke server. Periksa internetmu.';
    return 'Terjadi kesalahan: ' + ((err && err.message) || 'coba lagi.');
  }

  /* ---------- ganti mode masuk <-> daftar ---------- */
  function setMode(mode) {
    form.dataset.mode = mode;
    var signup = mode === 'signup';
    $('title').textContent = signup ? 'Buat akun baru' : 'Selamat datang kembali!';
    $('sub').textContent = signup ? 'Daftar gratis, lalu semua materi bisa kamu pakai.' : 'Gunakan akun dari KAK NAJLA, atau coba dulu sebagai tamu. Semua fitur tetap bisa dipakai dan GRATIS.';
    submitBtn.querySelector('.lbl').textContent = signup ? 'Daftar' : 'Masuk';
    $('switch-q').textContent = signup ? 'Sudah punya akun?' : 'Belum punya akun?';
    $('switch').textContent = signup ? 'Masuk' : 'Daftar';
    pass.autocomplete = signup ? 'new-password' : 'current-password';
    clearMsg();
  }
  $('switch').addEventListener('click', function () { setMode(form.dataset.mode === 'login' ? 'signup' : 'login'); });

  /* ---------- tampilkan / sembunyikan kata sandi ---------- */
  var tg = $('toggle');
  tg.addEventListener('mousedown', function (e) { e.preventDefault(); });   /* fokus tetap di input */
  tg.addEventListener('click', function () {
    var show = pass.type === 'password';
    pass.type = show ? 'text' : 'password';
    tg.setAttribute('aria-pressed', String(show));
    tg.setAttribute('aria-label', show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    Cast.refresh();
  });

  /* ---------- kirim ---------- */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (busy) return;
    clearMsg();
    var mode = form.dataset.mode, em = email.value.trim(), pw = pass.value, nm = fullname.value.trim();

    if (!A.ready) return fail(friendly(null));
    if (mode === 'signup' && !nm) return fail('Isi nama lengkapmu dulu.', fullname);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return fail('Masukkan email yang valid.', email);
    if (!pw) return fail('Kata sandi belum diisi.', pass);
    if (mode === 'signup' && pw.length < 6) return fail('Kata sandi minimal 6 karakter.', pass);

    setBusy(true);
    A.setRemember(remember.checked);
    try {
      if (mode === 'login') {
        var r = await A.client.auth.signInWithPassword({ email: em, password: pw });
        if (r.error) throw r.error;
        A.clearGuest();
        success();
      } else {
        var viaFn = A.config.SIGNUP_FUNCTION ? await registerViaFunction(em, pw, nm) : 'fallback';
        if (viaFn === 'ok') {
          var li = await A.client.auth.signInWithPassword({ email: em, password: pw });
          if (li.error) throw li.error;
          A.clearGuest();
          success();
        } else {
          var s = await A.client.auth.signUp({ email: em, password: pw, options: { data: { full_name: nm } } });
          if (s.error) throw s.error;
          if (s.data.user && s.data.user.identities && s.data.user.identities.length === 0) {
            throw new Error('User already registered');
          }
          var sess = s.data.session;
          if (!sess) {   /* akun otomatis terkonfirmasi di database -> langsung masuk */
            var l2 = await A.client.auth.signInWithPassword({ email: em, password: pw });
            if (!l2.error) sess = l2.data.session;
          }
          if (sess) { A.clearGuest(); success(); }
          else {
            setBusy(false);
            setMode('login');
            okEl.textContent = 'Akun dibuat! Cek emailmu untuk konfirmasi, lalu masuk.';
            Cast.happy();
          }
        }
      }
    } catch (err) {
      setBusy(false);
      fail(friendly(err), /kata sandi|password|login/i.test(friendly(err)) ? pass : null);
    }
  });

  /* Daftar lewat Edge Function (akun langsung aktif, tanpa email). Mengembalikan 'ok' atau 'fallback'. */
  async function registerViaFunction(em, pw, nm) {
    var r;
    try {
      r = await A.client.functions.invoke(A.config.SIGNUP_FUNCTION, { body: { email: em, password: pw, full_name: nm } });
    } catch (e) { return 'fallback'; }
    if (!r.error) return (r.data && r.data.ok === true) ? 'ok' : 'fallback';   /* function salah isi -> pakai pendaftaran biasa */
    var ctx = r.error.context, status = ctx && ctx.status;
    if (status === 404 || r.error.name === 'FunctionsFetchError' || r.error.name === 'FunctionsRelayError') return 'fallback';
    var msg = '';
    try { var j = await ctx.json(); msg = j && j.error; } catch (e) {}
    var ex = new Error(msg || 'Pendaftaran gagal. Coba lagi.');
    ex.friendly = true;
    throw ex;
  }

  function success() {
    okEl.textContent = 'Berhasil! Mengalihkan...';
    Cast.happy();
    setTimeout(function () { A.goNext(); }, 1200);
  }

  /* ---------- tamu ---------- */
  guestBtn.addEventListener('click', function () {
    if (busy) return;
    clearMsg();
    A.guest();
    okEl.textContent = 'Masuk sebagai tamu...';
    Cast.happy();
    setBusy(true);
    setTimeout(function () { A.goNext(); }, 1000);
  });

  /* ---------- sudah login sebelumnya? ---------- */
  if (A.ready) {
    A.session().then(function (s) {
      if (s.type !== 'user') return;
      $('resume-name').textContent = s.name;
      $('resume').hidden = false;
      $('resume-go').addEventListener('click', function () { A.goNext(); });
      $('resume-out').addEventListener('click', async function () {
        await A.client.auth.signOut(); A.clearGuest(); $('resume').hidden = true;
      });
    });
  }
})();
