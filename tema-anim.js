/* tema-anim.js : animasi teks judul di halaman simulator (balok, portal, pelengkung, kuis) */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  var h1 = document.querySelector('h1');
  if (!h1 || h1.getAttribute('data-split')) return;
  var text = h1.textContent.replace(/\s+/g, ' ').trim(), words = text.split(' ');
  h1.setAttribute('aria-label', text); h1.setAttribute('data-split', '1'); h1.textContent = '';
  words.forEach(function (w, i) {
    var o = document.createElement('span'), n = document.createElement('i');
    o.className = 'tw'; o.setAttribute('aria-hidden', 'true');
    n.textContent = w; n.style.setProperty('--i', i);
    o.appendChild(n); h1.appendChild(o);
    if (i < words.length - 1) h1.appendChild(document.createTextNode(' '));
  });
})();
