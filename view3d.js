/* Tampilan 3D jembatan: renderer perspektif sendiri (tanpa library) di atas canvas 2D.
   Memakai data dari app.js: S, L, items, LAST, FAIL, sectG, sc. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id), cv3 = $("cv3"), g = cv3.getContext("2d");
  const CAM = { yaw: -0.55, pitch: 0.28, dist: 40, tx: 10, L0: 0 };
  let W3 = 900, H3 = 520, POLY = [], WAT = [], LBL = [], P3 = [], F = {}, HD = 8, AMP = 0, tPrev = performance.now();
  const TH = 1.1, WD = 8;
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
  const mixc = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const heat = (r) => { const A = [178, 188, 202], B = [246, 192, 64], C = [222, 52, 46]; return r < 0.6 ? A : r < 0.85 ? mixc(A, B, (r - 0.6) / 0.25) : mixc(B, C, Math.min(1, (r - 0.85) / 0.15)); };
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const id3 = (x, y, z) => [x, y, z];
  const rnd = () => Math.random();

  function Q(p, c, o) { POLY.push({ p, c, o: o || null }); }
  function LN(p, q, c, w) { POLY.push({ l: [p, q], c, w }); }
  function box(M, cx, cy, cz, sx, sy, sz, c, rz, px, py, o) {
    rz = rz || 0; if (px === undefined) { px = cx; py = cy; }
    const co = Math.cos(rz), si = Math.sin(rz), X = [cx - sx / 2, cx + sx / 2], Y = [cy - sy / 2, cy + sy / 2], Z = [cz - sz / 2, cz + sz / 2];
    const V = (x, y, z) => { const dx = x - px, dy = y - py; return M(px + dx * co - dy * si, py + dx * si + dy * co, z); };
    const a = V(X[0], Y[0], Z[0]), b = V(X[1], Y[0], Z[0]), cc = V(X[1], Y[1], Z[0]), d = V(X[0], Y[1], Z[0]);
    const e = V(X[0], Y[0], Z[1]), f = V(X[1], Y[0], Z[1]), gg = V(X[1], Y[1], Z[1]), h = V(X[0], Y[1], Z[1]);
    const oo = Object.assign({ ctr: V(cx, cy, cz) }, o || {});
    [[a, b, cc, d], [e, f, gg, h], [a, b, f, e], [d, cc, gg, h], [a, d, h, e], [b, cc, gg, f]].forEach((q) => Q(q, c, oo));
  }
  function bar(M, x1, y1, x2, y2, t, c, z) {
    const dx = x2 - x1, dy = y2 - y1;
    box(M, (x1 + x2) / 2, (y1 + y2) / 2, z || 0, Math.hypot(dx, dy) || 0.001, t, t, c, Math.atan2(dy, dx));
  }
  function wheel(M, x, y, z, r, w, ang) {
    const n = 10, col = [28, 32, 42], ring = (zz) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return M(x + Math.cos(a) * r, y + Math.sin(a) * r, zz); });
    const f = ring(z + w / 2), k = ring(z - w / 2), o = { ctr: M(x, y, z) };
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; Q([k[i], k[j], f[j], f[i]], col, o); }
    Q(f, [205, 212, 224], o); Q(k, [205, 212, 224], o);
    [z + w / 2 + 0.01, z - w / 2 - 0.01].forEach((zz) => box(M, x, y, zz, r * 1.7, r * 0.18, 0.02, [110, 120, 135], ang, x, y));
  }
  function person(M, x, hgt, shirt, ph, skin, hair) {
    const s = hgt / 1.7, a = S.xf * 4.5 + ph, sw = Math.sin(a), bob = Math.abs(Math.cos(a)) * 0.03 * s, P = [44, 52, 68], dark = shirt.map((v) => v * 0.75);
    [sw, -sw].forEach((k, i) => bar(M, x, 0.85 * s + bob, x + k * 0.32 * s, 0.05 * s, 0.14 * s, i ? [30, 36, 50] : P, i ? 0.08 : -0.08));
    box(M, x, 1.15 * s + bob, 0, 0.26 * s, 0.62 * s, 0.42 * s, shirt);
    [sw, -sw].forEach((k, i) => bar(M, x, 1.38 * s + bob, x - k * 0.28 * s, 0.95 * s + bob, 0.1 * s, i ? dark : shirt, i ? 0.26 * s : -0.26 * s));
    box(M, x, 1.58 * s + bob, 0, 0.22 * s, 0.24 * s, 0.22 * s, skin);
    box(M, x, 1.7 * s + bob, 0, 0.24 * s, 0.1 * s, 0.24 * s, hair);
  }
  const SHIRT = [[239, 111, 143], [79, 142, 247], [52, 179, 138], [245, 184, 61], [155, 123, 234], [240, 138, 75]];
  const SKIN = [[241, 201, 165], [217, 164, 122], [185, 122, 86], [246, 213, 184]], HAIR = [[43, 33, 24], [74, 51, 38], [28, 28, 28], [122, 82, 48]];

  function vehicle(it, M) {
    const v = it.v, c = hex(v.c), c2 = hex(v.c2 || v.c), hm = v.mo / 2, xF = v.fo - hm, xR = hm - v.ro, len = xF - xR, cx = (xF + xR) / 2, h = v.h;
    const ax = v.ax.map((a) => a[0] - hm), GL = [150, 205, 238], DK = [40, 44, 54], YL = [255, 235, 160], RD = [230, 50, 50], WH = [236, 240, 246];
    const B = (a, b, cz, sx, sy, sz, col) => box(M, a, b, cz, sx, sy, sz, col);
    const wheels = (r, W, w) => ax.forEach((x) => [-1, 1].forEach((s) => wheel(M, x, r, s * (W / 2 - 0.12), r, w || 0.24, -S.xf / r)));
    const lights = (y, W, sy) => [-1, 1].forEach((s) => { B(xF, y, s * W * 0.32, 0.05, sy, 0.28, YL); B(xR, y, s * W * 0.32, 0.05, sy, 0.28, RD); });
    switch (v.id) {
      case "car": { const W = 1.8, gc = 0.2;
        B(cx, gc + 0.25 * h, 0, len, 0.5 * h, W, c); B(cx - 0.04 * len, gc + 0.7 * h, 0, 0.5 * len, 0.4 * h, W * 0.88, c);
        B(cx - 0.04 * len, gc + 0.72 * h, 0, 0.46 * len, 0.26 * h, W * 0.88 + 0.05, GL); lights(gc + 0.28 * h, W, 0.1 * h); wheels(0.36, W); break; }
      case "pick": { const W = 1.95, gc = 0.25, cl = v.cab;
        B((xR + xF - cl) / 2, gc + 0.25 * h, 0, len - cl, 0.5 * h, W, c); B((xR + xF - cl) / 2, gc + 0.5 * h, 0, len - cl - 0.3, 0.02, W - 0.3, DK);
        B(xF - cl / 2, gc + 0.45 * h, 0, cl, 0.9 * h, W, c2); B(xF - cl * 0.4, gc + 0.62 * h, 0, cl * 0.5, 0.28 * h, W + 0.05, GL);
        B(xF - 0.02, gc + 0.6 * h, 0, 0.04, 0.3 * h, W * 0.8, GL); lights(gc + 0.25 * h, W, 0.1 * h); wheels(0.42, W); break; }
      case "bus": { const W = 2.5;
        B(cx, 0.35 + h / 2, 0, len, h, W, c); B(cx, 0.35 + h * 0.66, 0, len * 0.9, h * 0.3, W + 0.05, GL); B(cx, 0.35 + h * 0.25, 0, len + 0.02, h * 0.1, W + 0.04, DK);
        B(xF + 0.01, 0.35 + h * 0.6, 0, 0.04, h * 0.4, W * 0.8, GL); lights(0.35 + h * 0.2, W, 0.14); wheels(0.5, W, 0.3); break; }
      case "truck": case "trail": { const W = 2.5, cl = v.cab;
        B((xR + xF - cl) / 2, 0.55 + h * 0.5, 0, len - cl - 0.05, h, W, WH); B((xR + xF - cl) / 2, 0.55 + h * 0.3, 0, len - cl - 0.03, h * 0.12, W + 0.03, c);
        B(cx, 0.45, 0, len, 0.18, W * 0.8, DK); B(xF - cl / 2, 0.55 + h * 0.39, 0, cl, h * 0.78, W, c);
        B(xF - cl * 0.42, 0.55 + h * 0.55, 0, cl * 0.5, h * 0.22, W + 0.04, GL); B(xF - 0.02, 0.55 + h * 0.52, 0, 0.04, h * 0.26, W * 0.82, GL);
        lights(0.7, W, 0.16); wheels(0.5, W, 0.3); break; }
      case "train": { const W = 2.9;
        B(cx, 0.65 + h / 2, 0, len, h, W, c); B(cx, 0.65 + h * 0.3, 0, len + 0.02, h * 0.1, W + 0.04, [245, 245, 245]); B(cx, 0.65 + h * 0.65, 0, len * 0.92, h * 0.28, W + 0.05, GL);
        B(xF + 0.01, 0.65 + h * 0.6, 0, 0.05, h * 0.4, W * 0.8, GL); lights(0.9, W, 0.2);
        bar(M, cx - 0.8, 0.65 + h, cx, 1.6 + h, 0.06, DK); bar(M, cx, 1.6 + h, cx + 0.8, 0.65 + h, 0.06, DK); bar(M, cx - 0.9, 1.6 + h, cx + 0.9, 1.6 + h, 0.06, DK);
        ax.forEach((x) => B(x, 0.4, 0, 2.2, 0.3, W * 0.7, DK)); wheels(0.4, W, 0.2); break; }
      case "bike": case "moto": { const moto = v.id === "moto", r = moto ? 0.32 : 0.34, F2 = ax[0], R = ax[1], d = F2 - R, skin = [241, 201, 165], pants = [51, 65, 85], shirt = [59, 130, 246];
        [F2, R].forEach((x) => wheel(M, x, r, 0, r, moto ? 0.14 : 0.05, -S.xf / r));
        let hip, sho, hand;
        if (!moto) {
          const BB = [R + d * 0.42, r], S_ = [R + d * 0.3, 0.95], H = [F2 - d * 0.1, 0.95];
          bar(M, R, r, S_[0], S_[1], 0.05, c); bar(M, S_[0], S_[1], BB[0], BB[1], 0.05, c); bar(M, BB[0], BB[1], R, r, 0.05, c);
          bar(M, S_[0], S_[1], H[0], H[1], 0.05, c); bar(M, BB[0], BB[1], H[0], H[1], 0.05, c); bar(M, H[0], H[1], F2, r, 0.05, c);
          bar(M, H[0], H[1], H[0] - 0.05, H[1] + 0.12, 0.05, DK); hip = [S_[0], S_[1] + 0.06]; hand = [H[0] - 0.05, H[1] + 0.12]; sho = [hip[0] + 0.25, 1.45];
          const pa = S.xf * 3; [0, Math.PI].forEach((o, i) => { const P = [BB[0] + Math.cos(pa + o) * 0.17, BB[1] + Math.sin(pa + o) * 0.17], K = [(hip[0] + P[0]) / 2 + 0.1, (hip[1] + P[1]) / 2]; const zz = i ? 0.1 : -0.1; bar(M, hip[0], hip[1], K[0], K[1], 0.1, pants, zz); bar(M, K[0], K[1], P[0], P[1], 0.09, pants, zz); });
        } else {
          B(R + d * 0.5, 0.55, 0, d * 0.5, 0.3, 0.3, DK); B(R + d * 0.5, 0.78, 0, d * 0.6, 0.32, 0.34, c); B(R + d * 0.3, 0.9, 0, d * 0.35, 0.08, 0.26, DK);
          bar(M, F2 - 0.05, 0.95, F2, r, 0.06, [125, 135, 150]); B(F2 + 0.02, 0.8, 0, 0.06, 0.12, 0.14, YL);
          hip = [R + d * 0.28, 1.0]; sho = [hip[0] + 0.15, 1.42]; hand = [F2 - 0.15, 1.02];
          bar(M, hip[0], hip[1], R + d * 0.58, 0.72, 0.12, pants, 0.14); bar(M, R + d * 0.58, 0.72, R + d * 0.42, 0.34, 0.11, pants, 0.14);
          bar(M, hip[0], hip[1], R + d * 0.58, 0.72, 0.12, pants, -0.14); bar(M, R + d * 0.58, 0.72, R + d * 0.42, 0.34, 0.11, pants, -0.14);
        }
        bar(M, hip[0], hip[1], sho[0], sho[1], 0.2, shirt); bar(M, sho[0], sho[1], hand[0], hand[1], 0.09, shirt, 0.16); bar(M, sho[0], sho[1], hand[0], hand[1], 0.09, shirt, -0.16);
        const hx = sho[0] + 0.06; B(hx, sho[1] + 0.2, 0, 0.2, 0.2, 0.2, skin); B(hx, sho[1] + 0.28, 0, moto ? 0.3 : 0.26, moto ? 0.22 : 0.1, moto ? 0.3 : 0.26, moto ? c : [251, 191, 36]); break; }
      case "ped": person(M, ax[0], 1.7, hex(v.c), 0, SKIN[1], HAIR[0]); break;
      case "crowd": ax.forEach((x, i) => person(M, x, 1.7 * (0.94 + ((i * 7) % 5) * 0.03), SHIRT[i % 6], i * 1.3, SKIN[(i * 3 + 1) % 4], HAIR[(i * 5) % 4])); break;
      default: { B(cx, 0.7, 0, 1.4, 1.4, 1.4, c); B(cx, 0.7, 0, 1.43, 0.2, 1.43, DK);
        bar(M, cx - 0.3, 1.4, cx - 0.3, 1.75, 0.07, [160, 170, 185]); bar(M, cx - 0.3, 1.75, cx + 0.3, 1.75, 0.07, [160, 170, 185]); bar(M, cx + 0.3, 1.75, cx + 0.3, 1.4, 0.07, [160, 170, 185]); }
    }
  }

  // ---- transformasi keruntuhan
  function CT(p, piece, item) {
    if (!FAIL || piece === undefined) return p;
    const pv = S.cant ? [FAIL.xc, HD] : piece ? [L, HD] : [0, HD], ph = (S.cant || !piece) ? -F.th : F.th, dx = p[0] - pv[0], dy = p[1] - pv[1], c = Math.cos(ph), s = Math.sin(ph);
    return [pv[0] + dx * c - dy * s, pv[1] + dx * s + dy * c - F.dyp - (item ? F.dyi : 0), p[2]];
  }
  const pieceOf = (x) => { if (!FAIL || x < 0 || x > L) return undefined; if (S.cant) return x < FAIL.xc ? undefined : 1; return x < FAIL.xc ? 0 : 1; };
  const sagm = (x) => { if (x < 0) return 0; if (S.cant) { const u = Math.min(x, L); return AMP * (3 * u * u * L - u * u * u) / (2 * L * L * L); } return x > L ? 0 : AMP * Math.sin(Math.PI * x / L); };
  const topY = (x) => HD - sagm(x), slope = (x) => Math.atan((topY(x + 0.2) - topY(x - 0.2)) / 0.4);

  function ribbon(on, i, col, z, y0, h, scl, sign, name) {
    if (!on || !LAST) return; const cu = LAST.cu, rgb = "rgb(" + col + ")";
    for (let k = 0; k < cu.length - 1; k++) {
      const a = cu[k], b = cu[k + 1], ya = y0 + sign * a.v[i] / scl * h, yb = y0 + sign * b.v[i] / scl * h;
      Q([[a.x, y0, z], [b.x, y0, z], [b.x, yb, z], [a.x, ya, z]], col, { al: 0.42, b: 1 }); LN([a.x, ya, z], [b.x, yb, z], rgb, 2);
    }
    LN([0, y0, z], [L, y0, z], "rgba(90,100,120,.8)", 1);
    let ex = cu[0]; cu.forEach((q) => { if (Math.abs(q.v[i]) > Math.abs(ex.v[i])) ex = q; });
    LBL.push({ p: [-0.8, y0, z], t: name, c: rgb, b: true });
    if (Math.abs(ex.v[i]) > 0.05) LBL.push({ p: [ex.x, y0 + sign * ex.v[i] / scl * h + (sign * ex.v[i] >= 0 ? 0.35 : -0.35), z], t: ex.v[i].toFixed(1), c: rgb });
  }

  function build(now, dt) {
    POLY = []; WAT = []; LBL = [];
    const tc = FAIL ? (now - FAIL.t0) / 1000 : 0, r = LAST ? LAST.r : 0, ls = LAST ? LAST.ls : [];
    F = { tc, th: FAIL && tc > 0.9 ? Math.min(1.15, 1.6 * Math.pow(tc - 0.9, 2)) : 0, dyp: FAIL && tc > 2.3 ? 9 * Math.pow(tc - 2.3, 2) : 0, dyi: FAIL && tc > 1 ? 22 * Math.pow(tc - 1, 2) : 0, shake: FAIL && tc < 0.7 ? 8 * (1 - tc / 0.7) : 0 };
    HD = Math.max(6, L * 0.25); AMP = Math.min(2.4, Math.max(0.6, L * 0.06)) * (FAIL ? 1 : Math.pow(Math.min(r, 1), 1.6));
    const t = now / 1000, x0w = -45, x1w = L + 45, NX = 30, NZ = 12;
    // air
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const q = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]].map(([a, b]) => { const x = x0w + (x1w - x0w) * a / NX, z = -34 + 68 * b / NZ; return [x, 0.12 * Math.sin(x * 0.35 + t * 1.6) + 0.1 * Math.sin(z * 0.4 + t * 1.2), z]; });
      const sh = 0.5 + 0.5 * Math.sin(i * 1.3 + j * 0.9 + t * 1.3); WAT.push({ p: q, c: mixc([78, 146, 214], [104, 168, 230], sh) });
    }
    const M0 = id3, W2 = WD / 2, z0 = -W2, zs = z0 + 1.4;
    // tebing, jalan pendekat, abutmen
    const bank = (xa, xb) => { const cx = (xa + xb) / 2, sx = Math.abs(xb - xa);
      box(M0, cx, (HD - TH) / 2, 0, sx, HD - TH, 16, [104, 150, 86]); box(M0, cx, HD - TH / 2, (zs + W2) / 2 - 0.0, sx, TH, W2 - zs, [58, 62, 72]); box(M0, cx, HD - TH / 2 + 0.04, (z0 + zs) / 2, sx, TH, 1.4, [176, 180, 188]); };
    if (S.cant) { bank(-2.5 - 22, -2.5); box(M0, -1.25, (HD + 1.2) / 2, 0, 2.5, HD + 1.2, WD + 2, [166, 168, 172]); }
    else { bank(-1.5 - 22, -1.5); bank(L + 1.5, L + 23.5); [-0.75, L + 0.75].forEach((x) => box(M0, x, (HD - TH) / 2, 0, 1.5, HD - TH, WD + 1, [170, 172, 176])); }
    // dek
    const N = Math.round(Math.min(60, Math.max(16, L * 1.2)));
    for (let i = 0; i < N; i++) {
      const xa = i * L / N, xb = (i + 1) * L / N, xm = (xa + xb) / 2, pc = pieceOf(xm), P = (x, y, z) => CT([x, y, z], pc);
      const [vv, mm] = sectG(ls, xm, L, S.cant, 0); const rr = FAIL ? Math.max(0.9 * (Math.abs(mm) / S.Mu > 0.5 || Math.abs(vv) / S.Vu > 0.5 ? 1 : 0.6), Math.abs(mm) / S.Mu, Math.abs(vv) / S.Vu) : Math.max(Math.abs(mm) / S.Mu, Math.abs(vv) / S.Vu);
      const ya = topY(xa), yb = topY(xb), col = heat(rr), o = { ctr: P(xm, (ya + yb) / 2 - TH / 2, 0) };
      const ta = (z) => P(xa, ya, z), tb = (z) => P(xb, yb, z), ba = (z) => P(xa, ya - TH, z), bb = (z) => P(xb, yb - TH, z);
      Q([ta(zs), tb(zs), tb(W2), ta(W2)], [56, 60, 70], Object.assign({ b: -4 }, o));
      Q([P(xa, ya + 0.08, z0), P(xb, yb + 0.08, z0), P(xb, yb + 0.08, zs), P(xa, ya + 0.08, zs)], [176, 180, 188], Object.assign({ b: -4 }, o));
      Q([ba(W2), bb(W2), tb(W2), ta(W2)], col, o); Q([ba(z0), bb(z0), tb(z0), ta(z0)], col, o);
      Q([ba(z0), bb(z0), bb(W2), ba(W2)], col, o);
      if (FAIL) { Q([ba(z0), ba(W2), ta(W2), ta(z0)], col, o); Q([bb(z0), bb(W2), tb(W2), tb(z0)], col, o); }
      if (i % 3 === 0) { const xd = xa + (xb - xa) * 0.2, xe = xa + (xb - xa) * 0.9, y1 = topY(xd) + 0.03, y2 = topY(xe) + 0.03; { const zc = (zs + W2) / 2; Q([P(xd, y1, zc - 0.06), P(xe, y2, zc - 0.06), P(xe, y2, zc + 0.06), P(xd, y1, zc + 0.06)], [245, 245, 240], { b: -5 }); } }
      [W2 - 0.1, z0 + 0.1].forEach((z) => { box(P, xm, (ya + yb) / 2 + 1.05, z, xb - xa, 0.08, 0.08, [200, 205, 212]); if (i % 2 === 0) box(P, xa, ya + 0.55, z, 0.1, 1.1, 0.1, [200, 205, 212]); });
    }
    // diagram sebagai pita 3D
    if (!FAIL) {
      ribbon($("o3sfd").checked, 0, [37, 99, 235], W2 + 1.4, HD - 3.2, 1.7, sc.v, 1, "SFD");
      ribbon($("o3bmd").checked, 1, [220, 38, 38], -0.8, S.cant ? HD + 0.1 : HD - TH - 0.05, 2.6, sc.m, -1, "BMD");
      ribbon($("o3nfd").checked, 2, [22, 163, 74], -W2 - 1.4, HD - 3.2, 1.3, sc.n, -1, "NFD");
    }
    // kendaraan
    items.forEach((it) => {
      const cxm = S.xf + it.off + it.v.mo / 2; if (cxm < -45 || cxm > L + 45) return;
      const on = cxm >= 0 && cxm <= L, y0 = on ? topY(cxm) : HD, ang = on ? slope(cxm) : 0, ca = Math.cos(ang), sa = Math.sin(ang), pc = pieceOf(cxm);
      const lane = (it.v.k === "ped") ? -3.2 : (zs + W2) / 2; // tengah aspal (di antara trotoar dan tepi dek)
      vehicle(it, (lx, ly, lz) => CT([cxm + lx * ca - ly * sa, y0 + 0.08 + lx * sa + ly * ca, lz + lane], pc, true));
    });
    // partikel
    if (FAIL && !FAIL.p3) { FAIL.p3 = true; for (let i = 0; i < 70; i++) P3.push({ x: FAIL.xc, y: HD, z: (rnd() - 0.5) * 6, vx: (rnd() - 0.5) * 7, vy: rnd() * 5 + 1, vz: (rnd() - 0.5) * 5, life: 1.5 + rnd(), k: i < 24 ? "dust" : "chip", s: 0.12 + rnd() * 0.2 }); }
    if (FAIL && !FAIL.sp3 && F.dyp > HD * 0.55) { FAIL.sp3 = true; [FAIL.xc * 0.5, (FAIL.xc + L) / 2].forEach((x) => { for (let i = 0; i < 30; i++) P3.push({ x: x + (rnd() - 0.5) * 4, y: 0.2, z: (rnd() - 0.5) * 6, vx: (rnd() - 0.5) * 5, vy: rnd() * 8 + 3, vz: (rnd() - 0.5) * 5, life: 1.6, k: "drop", s: 0.12 }); }); }
    P3.forEach((p) => { p.vy += (p.k === "dust" ? 0.4 : -9.8) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.life -= dt; if (p.k === "drop" && p.y < 0.05 && p.vy < 0) p.life = 0; });
    P3 = P3.filter((p) => p.life > 0);
  }

  function render() {
    const T = [CAM.tx, HD * 0.72, 0], cp = Math.cos(CAM.pitch);
    const eye = [T[0] + CAM.dist * Math.sin(CAM.yaw) * cp, T[1] + CAM.dist * Math.sin(CAM.pitch), T[2] + CAM.dist * Math.cos(CAM.yaw) * cp];
    const fw = nrm(sub(T, eye)), rt = nrm(cross(fw, [0, 1, 0])), up = cross(rt, fw), f = H3 * 1.2, shk = F.shake ? [(rnd() - 0.5) * F.shake, (rnd() - 0.5) * F.shake] : [0, 0];
    const pr = (p) => { const d = sub(p, eye), z = dot(d, fw); if (z < 0.5) return null; return [W3 / 2 + shk[0] + f * dot(d, rt) / z, H3 / 2 + shk[1] - f * dot(d, up) / z, z]; };
    const dark = matchMedia("(prefers-color-scheme: dark)").matches;
    const sk = g.createLinearGradient(0, 0, 0, H3); if (dark) { sk.addColorStop(0, "#0b1626"); sk.addColorStop(1, "#27415f"); } else { sk.addColorStop(0, "#9fd0f5"); sk.addColorStop(0.6, "#d7ecfb"); sk.addColorStop(1, "#f1f8ff"); }
    g.fillStyle = sk; g.fillRect(0, 0, W3, H3);
    if (!dark) { const sg = g.createRadialGradient(W3 * 0.82, H3 * 0.14, 4, W3 * 0.82, H3 * 0.14, 90); sg.addColorStop(0, "rgba(255,247,200,.95)"); sg.addColorStop(1, "rgba(255,247,200,0)"); g.fillStyle = sg; g.fillRect(0, 0, W3, H3); }
    // air
    const wl = [];
    WAT.forEach((w) => { const ps = w.p.map(pr); if (ps.some((x) => !x)) return; wl.push({ s: ps, c: w.c, d: ps.reduce((a, q) => a + q[2], 0) / 4 }); });
    wl.sort((a, b) => b.d - a.d).forEach((w) => { g.beginPath(); w.s.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.closePath(); g.fillStyle = "rgb(" + w.c + ")"; g.fill(); g.strokeStyle = "rgb(" + w.c + ")"; g.lineWidth = 0.8; g.stroke(); });
    // poligon
    const Ld = nrm([-0.35, 0.85, 0.45]), out = [];
    for (const q of POLY) {
      if (q.l) { const a = pr(q.l[0]), b = pr(q.l[1]); if (a && b) out.push({ ln: true, a, b, c: q.c, w: q.w, d: (a[2] + b[2]) / 2 - 1 }); continue; }
      const P = q.p; let maxy = -1e9; for (const v of P) if (v[1] > maxy) maxy = v[1]; if (maxy < -0.4) continue;
      const ps = P.map(pr); if (ps.some((x) => !x)) continue;
      let n = nrm(cross(sub(P[1], P[0]), sub(P[2], P[0]))); const o = q.o;
      if (o && o.ctr) { if (dot(n, sub(P[0], o.ctr)) < 0) n = n.map((v) => -v); if (dot(n, sub(eye, P[0])) <= 0) continue; }
      else if (dot(n, sub(eye, P[0])) < 0) n = n.map((v) => -v);
      const k = 0.5 + 0.52 * Math.max(0, dot(n, Ld)), c = o && o.al ? q.c : q.c.map((v) => Math.min(255, v * k) | 0);
      out.push({ s: ps, c, al: o && o.al, d: ps.reduce((a, p2) => a + p2[2], 0) / ps.length - ((o && o.b) || 0) });
    }
    out.sort((a, b) => b.d - a.d);
    for (const q of out) {
      if (q.ln) { g.beginPath(); g.moveTo(q.a[0], q.a[1]); g.lineTo(q.b[0], q.b[1]); g.strokeStyle = q.c; g.lineWidth = q.w; g.stroke(); continue; }
      g.beginPath(); q.s.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
      const col = "rgb(" + q.c + ")";
      if (q.al) { g.globalAlpha = q.al; g.fillStyle = col; g.fill(); g.globalAlpha = 1; } else { g.fillStyle = col; g.fill(); g.strokeStyle = col; g.lineWidth = 0.7; g.stroke(); }
    }
    // partikel
    P3.forEach((p) => { const s = pr([p.x, p.y, p.z]); if (!s) return; const sz = Math.max(1.5, p.s * f / s[2]);
      if (p.k === "dust") { g.fillStyle = "rgba(205,210,220," + Math.min(0.5, p.life * 0.35) + ")"; g.beginPath(); g.arc(s[0], s[1], sz * (1 + (2 - p.life) * 1.6), 0, 7); g.fill(); }
      else if (p.k === "drop") { g.fillStyle = "rgba(160,205,255,.9)"; g.beginPath(); g.arc(s[0], s[1], sz, 0, 7); g.fill(); }
      else { g.fillStyle = "#9aa0aa"; g.fillRect(s[0], s[1], sz, sz); } });
    // label
    g.font = "600 13px system-ui,sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    LBL.forEach((l) => { const s = pr(l.p); if (!s) return; g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.85)"; g.strokeText(l.t, s[0], s[1]); g.fillStyle = l.c; g.fillText(l.t, s[0], s[1]); });
    if (FAIL) { g.textAlign = "left"; g.font = "700 20px Georgia,serif"; g.fillStyle = "#dc2626"; g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 4; g.strokeText("JEMBATAN RUNTUH", 14, 24); g.fillText("JEMBATAN RUNTUH", 14, 24);
      if (F.tc < 0.6) { g.fillStyle = "rgba(220,38,38," + 0.2 * (1 - F.tc / 0.6) + ")"; g.fillRect(0, 0, W3, H3); } }
    else if (LAST && LAST.r > 0.85) { g.textAlign = "left"; g.font = "600 15px system-ui,sans-serif"; g.globalAlpha = 0.65 + 0.35 * Math.sin(performance.now() / 180); g.fillStyle = "#dc2626"; g.fillText("⚠ Mendekati batas kapasitas", 14, 22); g.globalAlpha = 1; }
  }

  window.draw3 = function () {
    const now = performance.now(), dt = Math.min((now - tPrev) / 1000, 0.05); tPrev = now;
    if (CAM.L0 !== L) { CAM.L0 = L; CAM.dist = Math.max(22, L * 0.95 + 13); }
    if ($("o3auto").checked && !drag && !FAIL) CAM.yaw += dt * 0.14;
    const tgt = $("o3follow").checked ? Math.min(L, Math.max(0, S.xf - 2)) : (S.cant ? L * 0.45 : L / 2);
    CAM.tx += (tgt - CAM.tx) * Math.min(1, dt * 4);
    build(now, dt); render();
  };

  // ---- ukuran & interaksi
  window.resize3 = function () { const r = cv3.getBoundingClientRect(); if (!r.width) return; const d = devicePixelRatio || 1; W3 = r.width; H3 = Math.max(380, Math.min(600, W3 * 0.62)); cv3.style.height = H3 + "px"; cv3.width = W3 * d; cv3.height = H3 * d; g.setTransform(d, 0, 0, d, 0, 0); };
  let drag = null; const ptrs = new Map();
  cv3.addEventListener("pointerdown", (e) => { cv3.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, yaw: CAM.yaw, pitch: CAM.pitch, d: CAM.dist, pd: pdist() }; $("o3auto").checked = false; });
  cv3.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) return; ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptrs.size >= 2 && drag.pd) CAM.dist = Math.min(160, Math.max(10, drag.d * drag.pd / pdist()));
    else { CAM.yaw = drag.yaw - (e.clientX - drag.x) * 0.008; CAM.pitch = Math.min(1.45, Math.max(-0.02, drag.pitch + (e.clientY - drag.y) * 0.006)); }
  });
  const up = (e) => { ptrs.delete(e.pointerId); drag = ptrs.size ? { x: [...ptrs.values()][0][0], y: [...ptrs.values()][0][1], yaw: CAM.yaw, pitch: CAM.pitch, d: CAM.dist, pd: pdist() } : null; };
  cv3.addEventListener("pointerup", up); cv3.addEventListener("pointercancel", up);
  cv3.addEventListener("wheel", (e) => { e.preventDefault(); CAM.dist = Math.min(160, Math.max(10, CAM.dist * Math.exp(e.deltaY * 0.001))); }, { passive: false });
  function pdist() { const v = [...ptrs.values()]; return v.length > 1 ? Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]) : 0; }

  function show(is3) {
    VIEW3 = is3; $("card2d").hidden = is3; $("card3d").hidden = !is3; $("opt3").hidden = !is3; $("hint3").hidden = !is3;
    $("tab2d").classList.toggle("on", !is3); $("tab3d").classList.toggle("on", is3);
    if (is3) resize3(); else resize();
  }
  $("tab2d").onclick = () => show(false); $("tab3d").onclick = () => show(true);
  document.querySelectorAll("[data-cam]").forEach((b) => (b.onclick = () => { const k = +b.dataset.cam; CAM.yaw = [0, -0.6, -0.2][k]; CAM.pitch = [0.1, 0.3, 1.3][k]; $("o3auto").checked = false; }));
  addEventListener("resize", () => { if (VIEW3) resize3(); });
})();
