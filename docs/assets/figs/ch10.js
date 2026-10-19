// 10장 그림: 궤적 만들기 (관절 공간과 작업 공간, 3차 다항식, 경유점, 포물선 혼합, 5차 다항식, 설정 공간)
(function () {
  const { D, f1, f2, svg, T, L, A, C, joint, link, arc, interactive } = FigKit;
  const FIG = window.FIG;

  // 종이 팔 (cm, 도): 팔꿈치와 손끝
  const paper = (t1, t2) => {
    const e = [10 * Math.cos(t1 * D), 10 * Math.sin(t1 * D)];
    return { e, h: [e[0] + 8 * Math.cos((t1 + t2) * D), e[1] + 8 * Math.sin((t1 + t2) * D)] };
  };
  // 역기구학 (도). sign = −1이면 θ₂ ≤ 0인 답, +1이면 θ₂ ≥ 0인 답. 닿지 않으면 null
  const ik = (x, y, sign) => {
    const c2 = (x * x + y * y - 164) / 160;
    if (c2 > 1 + 1e-9 || c2 < -1 - 1e-9) return null;
    const t2 = sign * Math.acos(Math.max(-1, Math.min(1, c2)));
    return [(Math.atan2(y, x) - Math.atan2(8 * Math.sin(t2), 10 + 8 * Math.cos(t2))) / D, t2 / D];
  };
  const wrap = a => ((a + 540) % 360) - 180;
  const m1 = v => f1(v).replace('-', '−'), m2 = v => f2(v).replace('-', '−');   // 숫자 앞의 빼기를 −로
  const poly = (pts, cls, w = 1.5, more = '') => `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" class="${cls}" stroke-width="${w}" stroke-linejoin="round" ${more}/>`;
  const halfRing = (bx, by, R, r) => `<path d="M${bx + R} ${by}A${R} ${R} 0 0 0 ${bx - R} ${by}L${bx - r} ${by}A${r} ${r} 0 0 1 ${bx + r} ${by}Z" class="f-tint s-grid" stroke-width="1"/>`;
  const arm = (P, q, c, fat = 10) => {
    const { e, h } = paper(q[0], q[1]), O = P([0, 0]), E = P(e), H = P(h);
    return link(O[0], O[1], E[0], E[1], c, fat) + link(E[0], E[1], H[0], H[1], c, fat) + joint(E[0], E[1], 5.5) + C(H[0], H[1], 4.5, `f-${c === 'axis' ? 'axis' : c}`, 0);
  };
  const ghost = (P, q, c = 'axis') => {
    const { e, h } = paper(q[0], q[1]), O = P([0, 0]), E = P(e), H = P(h);
    return `<path d="M${O[0]} ${O[1]}L${E[0]} ${E[1]}L${H[0]} ${H[1]}" fill="none" class="s-${c}" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round"/>` + C(E[0], E[1], 4, `f-none s-${c}`, 1.5) + C(H[0], H[1], 4, `f-none s-${c}`, 1.5);
  };

  // 3차 다항식: 위치·속도 조건 네 개로 계수 네 개
  const cubic = (u0, uf, v0, vf, Tt) => [u0, v0, 3 * (uf - u0) / Tt ** 2 - (2 * v0 + vf) / Tt, -2 * (uf - u0) / Tt ** 3 + (v0 + vf) / Tt ** 2];
  const ev = (a, t) => [a[0] + a[1] * t + a[2] * t * t + a[3] * t ** 3, a[1] + 2 * a[2] * t + 3 * a[3] * t * t, 2 * a[2] + 6 * a[3] * t];

  // 그래프 틀: 가로 t, 세로 v. 눈금, 0선, 제목까지 그린다.
  const frame = o => {
    const X = t => o.x + (t - o.t0) / (o.t1 - o.t0) * o.w, Y = v => o.y + o.h - (v - o.v0) / (o.v1 - o.v0) * o.h;
    const b = [];
    (o.yt || []).forEach(v => b.push(L(o.x, Y(v), o.x + o.w, Y(v), 'grid', 1), T(o.x - 6, Y(v) + 4.5, String(v).replace('-', '−'), { a: 'end', c: 'q', s: 12.5 })));
    b.push(L(o.x, o.y, o.x, o.y + o.h, 'axis', 1.25));
    const z = o.v0 <= 0 && o.v1 >= 0 ? Y(0) : o.y + o.h;
    b.push(L(o.x, z, o.x + o.w, z, 'axis', 1.25));
    (o.xt || []).forEach(([t, txt]) => b.push(L(X(t), o.y + o.h, X(t), o.y + o.h + 4, 'axis', 1), T(X(t), o.y + o.h + 18, txt, { a: 'middle', c: 'q', s: 12.5 })));
    if (o.title) b.push(T(o.x, o.y - (o.tdy || 10), o.title, { c: 'b', s: 13 }));
    const clip = `<clipPath id="${o.id}"><rect x="${o.x}" y="${o.y - 1}" width="${o.w}" height="${o.h + 2}"/></clipPath>`;
    const curve = (f, t0, t1, cls, w = 2, more = '', n = 120) => {
      const p = [];
      for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; p.push([X(t), Y(f(t))]); }
      return poly(p, cls, w, `clip-path="url(#${o.id})" ${more}`);
    };
    return { X, Y, x: o.x, y: o.y, w: o.w, h: o.h, svg: clip + b.join(''), curve };
  };

  // ---------------------------------------------------------------
  // 그림 10-1 문제: 출발점, 경유점, 도착점, 그리고 관절마다 시간표
  const introQ = () => {
    const pB = [10.5 * Math.cos(45 * D), 10.5 * Math.sin(45 * D)];
    const q = [ik(16, 3, -1), ik(pB[0], pB[1], -1), ik(3, 16, -1)];
    const vel = j => { const s1 = (q[1][j] - q[0][j]) / 1.5, s2 = (q[2][j] - q[1][j]) / 1.5; return Math.sign(s1) === Math.sign(s2) ? (s1 + s2) / 2 : 0; };
    const seg = [0, 1].map(j => [cubic(q[0][j], q[1][j], 0, vel(j), 1.5), cubic(q[1][j], q[2][j], vel(j), 0, 1.5)]);
    const at = t => [0, 1].map(j => ev(seg[j][t < 1.5 ? 0 : 1], t < 1.5 ? t : t - 1.5)[0]);
    return { q, at, pB };
  };
  FIG.fig10_1 = el => {
    const id = 'f101', k = 12, bx = 110, by = 254, P = ([x, y]) => [bx + k * x, by - k * y];
    const { q, at, pB } = introQ();
    const pA = P([16, 3]), pBs = P(pB), pC = P([3, 16]), cup = P([13.5 * Math.cos(45 * D), 13.5 * Math.sin(45 * D)]);
    const path = [];
    for (let i = 0; i <= 90; i++) path.push(P(paper(...at(3 * i / 90)).h));
    const fr = frame({ id: 'f101c', x: 64, y: 330, w: 320, h: 116, t0: 0, t1: 3, v0: -120, v1: 120, yt: [-90, 0, 90], xt: [[0, '0 s (A)'], [1.5, '1.5 s (B)'], [3, '3 s (C)']], title: '궤적: 관절마다 "언제 몇 도"인 시간표 (°)' });
    const dots = [0, 1.5, 3].map(t => { const v = at(t); return C(fr.X(t), fr.Y(v[0]), 4, 'f-c1', 0) + C(fr.X(t), fr.Y(v[1]), 4, 'f-c2', 0); }).join('');
    el.innerHTML += svg(id, [40, 432], [
      L(bx - 40, by, bx + 18 * k + 14, by, 'axis', 1), `<rect x="${bx - 22}" y="${by + 9}" width="44" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      C(cup[0], cup[1], 1.8 * k, 'f-tint s-ink', 1.5), T(cup[0] + 30, cup[1] - 18, '컵', { c: 'b', s: 13 }),
      L(pA[0], pA[1], pC[0], pC[1], 'axis', 1.5, 'stroke-dasharray="3 4"'),
      T(330, 120, '곧장 가면', { c: 'q', s: 12.5 }), T(330, 138, '컵에 부딪힌다', { c: 'q', s: 12.5 }),
      ghost(P, q[1]), ghost(P, q[2]),
      poly(path, 'f-none s-c1', 2.25, A(id, 'c1')),
      arm(P, q[0], 'c1', 10), joint(bx, by, 7),
      C(pBs[0], pBs[1], 6, 'f-none s-ink', 1.75),
      T(pA[0] + 10, pA[1] + 22, 'A 출발점', { c: 'b', s: 13 }),
      T(pBs[0] - 14, pBs[1] + 20, 'B 경유점', { a: 'end', c: 'b', s: 13 }),
      T(pC[0] + 12, pC[1] - 6, 'C 도착점', { c: 'b', s: 13 }),
      T(bx - 28, by + 20, '받침', { a: 'end', c: 'q', s: 12.5 }),
      fr.svg,
      fr.curve(t => at(t)[0], 0, 3, 'f-none s-c1', 2.25), fr.curve(t => at(t)[1], 0, 3, 'f-none s-c2', 2.25), dots,
      T(fr.X(3) + 10, fr.Y(at(3)[0]) + 5, 'θ₁ 어깨', { c: 'b', s: 13 }), T(fr.X(3) + 10, fr.Y(at(3)[1]) + 5, 'θ₂ 팔꿈치', { c: 'b', s: 13 }),
    ].join(''), '손끝을 출발점에서 경유점을 거쳐 도착점으로 보내는 길과, 그 길을 관절마다 시간에 대한 각도로 적은 궤적');
  };

  // ---------------------------------------------------------------
  // 그림 10-2 관절 공간에서 짠 길(원호)과 작업 공간에서 짠 길(직선) (슬라이더)
  const lineRates = ph => {
    const Bx = 15 * Math.cos(ph * D), By = 15 * Math.sin(ph * D);
    let m1 = 0, m2 = 0, prev = null;
    for (let i = 0; i <= 400; i++) {
      const u = i / 400, qq = ik(15 + (Bx - 15) * u, By * u, -1);
      if (!qq) return null;
      if (prev) { m1 = Math.max(m1, Math.abs(wrap(qq[0] - prev[0])) * 4); m2 = Math.max(m2, Math.abs(qq[1] - prev[1]) * 4); }
      prev = qq;
    }
    return [m1, m2];
  };
  const cmp = ({ s, ph }) => {
    const u = s / 100, qA = ik(15, 0, -1), Bc = [15 * Math.cos(ph * D), 15 * Math.sin(ph * D)];
    const qj = [qA[0] + ph * u, qA[1]], pc = [15 + (Bc[0] - 15) * u, Bc[1] * u];
    let qc = ik(pc[0], pc[1], -1);
    if (qc) qc = [qj[0] + wrap(qc[0] - qj[0]), qc[1]];
    return { qA, Bc, qj, pj: paper(...qj).h, pc, qc, d: 15 * Math.cos(ph / 2 * D) };
  };
  FIG.fig10_2 = el => interactive(el, {
    state: { s: 50, ph: 90 },
    sliders: [{ key: 's', label: '진행', min: 0, max: 100, unit: '%' }, { key: 'ph', label: '목표 B의 방향', min: 30, max: 180, unit: '°' }],
    draw: st => {
      const id = 'f102', k = 11, bx = 240, by = 256, P = ([x, y]) => [bx + k * x, by - k * y];
      const g = cmp(st), pA = P([15, 0]), pB = P(g.Bc), M = P([7.5 * (1 + Math.cos(st.ph * D)), 7.5 * Math.sin(st.ph * D)]);
      const b = [halfRing(bx, by, 18 * k, 2 * k), L(bx - 18 * k - 10, by, bx + 18 * k + 10, by, 'axis', 1)];
      if (g.d > 3) b.push(L(bx, by, M[0], M[1], 'axis', 1, 'stroke-dasharray="2 3"'), T((bx + M[0]) / 2 - 6, (by + M[1]) / 2 + 4, 'd', { a: 'end', c: 'q', s: 13 }));
      b.push(arc(bx, by, 15 * k, 0, st.ph * D, 'c1', 2), L(pA[0], pA[1], pB[0], pB[1], 'c2', 2));
      b.push(ghost(P, g.qj, 'c1'));
      const H1 = P(g.pj), H2 = P(g.pc);
      if (g.qc) b.push(arm(P, g.qc, 'c2', 9));
      else b.push(C(H2[0], H2[1], 6, 'f-none s-c2', 2), T(H2[0] + 12, H2[1] - 10, '닿지 않음', { c: 'b', s: 12.5 }));
      b.push(joint(bx, by, 7), C(H1[0], H1[1], 5, 'f-c1', 0));
      b.push(C(pA[0], pA[1], 3, 'f-ink', 0), T(pA[0] + 4, pA[1] + 20, 'A', { c: 'b', s: 13 }));
      const ob = [Math.cos(st.ph * D), -Math.sin(st.ph * D)];
      b.push(C(pB[0], pB[1], 3, 'f-ink', 0), T(pB[0] + 16 * ob[0] + (st.ph > 160 ? -6 : 0), pB[1] + 16 * ob[1] + (st.ph > 160 ? 20 : 5), 'B', { a: 'middle', c: 'b', s: 13 }));
      b.push(L(250, 300, 274, 300, 'c1', 2.5), T(282, 305, '관절 공간에서 짠 길 (점선 팔)', { s: 12.5 }));
      b.push(L(250, 322, 274, 322, 'c2', 2.5), T(282, 327, '작업 공간에서 짠 길 (실선 팔)', { s: 12.5 }));
      return svg(id, [44, 292], b.join(''), '같은 두 점을 잇는 두 가지 길. 관절 각도를 고르게 바꾸면 손끝이 원호를 그리고, 손끝을 직선으로 보내면 관절이 고르지 않게 돈다');
    },
    readout: st => {
      const g = cmp(st), r = lineRates(st.ph), dist = Math.hypot(g.pc[0], g.pc[1]);
      let h = `<div><span class="dot c1">●</span> <b>관절 공간</b>: θ₁ = ${m1(g.qj[0])}°, θ₂ = ${m1(g.qj[1])}° → 손끝 (${m1(g.pj[0])}, ${m1(g.pj[1])}), 받침에서 15.0 cm</div>`;
      h += g.qc ? `<div><span class="dot c2">●</span> <b>작업 공간(직선)</b>: θ₁ = ${m1(g.qc[0])}°, θ₂ = ${m1(g.qc[1])}° → 손끝 (${m1(g.pc[0])}, ${m1(g.pc[1])}), 받침에서 ${f1(dist)} cm</div>`
        : `<div><span class="dot c2">●</span> <b>작업 공간(직선)</b>: 손끝 (${m1(g.pc[0])}, ${m1(g.pc[1])})은 받침에서 ${f1(dist)} cm라 <b>닿지 않는다</b></div>`;
      h += r ? `<div>진행 1%마다 도는 각도(가장 클 때): 관절 공간은 어깨 <b>${f2(st.ph / 100)}°</b>, 팔꿈치 0° · 직선은 어깨 <b>${f2(r[0])}°</b>, 팔꿈치 <b>${f2(r[1])}°</b></div>`
        : `<div>직선이 받침에서 d = ${f1(g.d)} cm까지 다가가, 손끝이 닿지 않는 2 cm 안쪽을 지난다. <b>이 직선은 못 간다.</b></div>`;
      if (r) h += `<div class="q">직선이 받침에 가장 가까이 가는 거리 d = ${f1(g.d)} cm</div>`;
      return h;
    },
  });

  // ---------------------------------------------------------------
  // 그림 10-3 출발점과 도착점이 서로 다른 자세 가지에 있을 때
  FIG.fig10_3 = el => {
    const id = 'f103', k = 10, bx = 240, by = 236, P = ([x, y]) => [bx + k * x, by - k * y];
    const qa = ik(15, 4, -1), qa2 = ik(15, 4, 1), qb = ik(-15, 4, 1), qb2 = ik(-15, 4, -1);
    const pA = P([15, 4]), pB = P([-15, 4]), z1 = P([3.07, 4]), z0 = P([-3.07, 4]);
    el.innerHTML += svg(id, [40, 262], [
      halfRing(bx, by, 18 * k, 2 * k),
      L(bx - 18 * k - 12, by, bx + 18 * k + 12, by, 'ink', 1.5),
      `<rect x="${bx - 18 * k - 12}" y="${by}" width="${36 * k + 24}" height="34" class="f-tint" fill-opacity="0.8"/>`,
      T(bx, by + 52, '어깨 서보는 0°~180°만 돈다: 링크 1은 굵은 선 아래로 못 간다', { a: 'middle', c: 'q', s: 12.5 }),
      L(pA[0], pA[1], pB[0], pB[1], 'axis', 1.5, 'stroke-dasharray="4 4"'),
      L(z0[0], z0[1], z1[0], z1[1], 'ink', 5, 'stroke-opacity="0.35" stroke-linecap="round"'),
      T(bx, z0[1] - 14, '두 자세 모두 되는 곳', { a: 'middle', c: 'q', s: 12.5 }),
      ghost(P, qa2), ghost(P, qb2),
      arm(P, qa, 'c1', 10), arm(P, qb, 'c2', 10), joint(bx, by, 7),
      T(pA[0] + 8, pA[1] - 12, 'A (15, 4)', { c: 'b', s: 13 }), T(pB[0] - 8, pB[1] - 12, 'B (−15, 4)', { a: 'end', c: 'b', s: 13 }),
      T(372, 100, 'A는 파란 자세로만', { a: 'middle', c: 'f-c1', s: 12.5 }), T(372, 118, `θ = (${m1(qa[0])}°, ${m1(qa[1])}°)`, { a: 'middle', c: 'f-c1', s: 12.5 }),
      T(108, 100, 'B는 주황 자세로만', { a: 'middle', c: 'f-c2', s: 12.5 }), T(108, 118, `θ = (${m1(qb[0])}°, ${m1(qb[1])}°)`, { a: 'middle', c: 'f-c2', s: 12.5 }),
    ].join(''), '출발점은 팔꿈치를 한쪽으로, 도착점은 반대쪽으로 꺾어야만 닿는다. 직선을 따라가면 가운데에서 자세를 갈아타야 한다');
  };

  // ---------------------------------------------------------------
  // 그림 10-4 3차 다항식 궤적 (슬라이더: 시간)
  const cub1 = cubic(0, 90, 0, 0, 3), cub2 = cubic(-90, -30, 0, 0, 3);
  FIG.fig10_4 = el => interactive(el, {
    state: { t: 1 },
    sliders: [{ key: 't', label: '시간 t', min: 0, max: 3, step: 0.05, unit: ' s' }],
    draw: ({ t }) => {
      const id = 'f104', k = 6.5, bx = 92, by = 166, P = ([x, y]) => [bx + k * x, by - k * y];
      const q = [ev(cub1, t)[0], ev(cub2, t)[0]], { e } = paper(q[0], q[1]), E = P(e);
      const path = [];
      for (let i = 0; i <= 60; i++) { const s = 3 * i / 60; path.push(P(paper(ev(cub1, s)[0], ev(cub2, s)[0]).h)); }
      const ext = P([e[0] * 1.45, e[1] * 1.45]);
      const xt = [[0, '0'], [1.5, '1.5'], [3, '3 s']];
      const F0 = frame({ id: 'f104a', x: 268, y: 62, w: 196, h: 120, t0: 0, t1: 3, v0: -100, v1: 100, yt: [-90, 0, 90], xt, title: '각도 θ (°)' });
      const F1 = frame({ id: 'f104b', x: 46, y: 262, w: 176, h: 96, t0: 0, t1: 3, v0: 0, v1: 50, yt: [0, 30, 45], xt, title: '각속도 (°/s)' });
      const F2 = frame({ id: 'f104c', x: 288, y: 262, w: 176, h: 96, t0: 0, t1: 3, v0: -70, v1: 70, yt: [-60, 0, 60], xt, title: '각가속도 (°/s²)' });
      const b = [
        L(bx - 20, by, bx + 120, by, 'axis', 1),
        ghost(P, [0, -90]), ghost(P, [90, -30]),
        poly(path, 'f-none s-axis', 1.25, 'stroke-dasharray="2 3"'),
        L(E[0], E[1], ext[0], ext[1], 'axis', 1, 'stroke-dasharray="3 3"'),
        arm(P, q, 'ink', 9), joint(bx, by, 7),
        arc(bx, by, 30, 0, q[0] * D, 'c1', 2), arc(E[0], E[1], 22, q[0] * D, (q[0] + q[1]) * D, 'c2', 2),
        T(P([10, -8])[0] + 10, P([10, -8])[1] + 5, '시작', { c: 'q', s: 12.5 }), T(P([4, 16.93])[0] + 10, P([4, 16.93])[1] + 2, '끝', { c: 'q', s: 12.5 }),
      ];
      [F0, F1, F2].forEach((F, i) => {
        b.push(F.svg, L(F.X(t), F.y, F.X(t), F.y + F.h, 'ink', 1, 'stroke-dasharray="2 3" stroke-opacity="0.6"'));
        [cub1, cub2].forEach((a, j) => {
          b.push(F.curve(s => ev(a, s)[i], 0, 3, `f-none s-c${j + 1}`, 2));
          b.push(C(F.X(t), F.Y(ev(a, t)[i]), 5, `f-c${j + 1}`, 0));
        });
      });
      b.push(T(F0.X(3) - 2, F0.Y(90) + 18, 'θ₁', { a: 'end', c: 'b', s: 13 }), T(F0.X(3) - 2, F0.Y(-30) + 18, 'θ₂', { a: 'end', c: 'b', s: 13 }));
      return svg(id, [36, 350], b.join(''), '3차 다항식으로 어깨와 팔꿈치를 함께 움직인다. 각도는 S자, 각속도는 포물선, 각가속도는 직선이다');
    },
    readout: ({ t }) => {
      const a = ev(cub1, t), c = ev(cub2, t);
      return `<div><b>t = ${t.toFixed(2)} s</b></div>` +
        `<div><span class="dot c1">●</span> 어깨 θ₁ = 30t² − 6.67t³ = <b>${m1(a[0])}°</b> · 각속도 <b>${m1(a[1])}°/s</b> · 각가속도 <b>${m1(a[2])}°/s²</b></div>` +
        `<div><span class="dot c2">●</span> 팔꿈치 θ₂ = −90 + 20t² − 4.44t³ = <b>${m1(c[0])}°</b> · 각속도 <b>${m1(c[1])}°/s</b> · 각가속도 <b>${m1(c[2])}°/s²</b></div>`;
    },
  });

  // ---------------------------------------------------------------
  // 그림 10-5 경유점 두 개, 구간 세 개 (슬라이더: 경유점 속도)
  const VP = [0, 30, 90, 60];
  const viaSegs = (vB, vC) => { const v = [0, vB, vC, 0]; return [0, 1, 2].map(i => cubic(VP[i], VP[i + 1], v[i], v[i + 1], 1)); };
  const viaEv = (segs, t) => { const i = Math.min(2, Math.max(0, Math.floor(t))); return ev(segs[i], t - i); };
  FIG.fig10_5 = el => interactive(el, {
    state: { vB: 45, vC: 0 },
    sliders: [{ key: 'vB', label: 'B에서의 속도', min: 0, max: 100, unit: '°/s' }, { key: 'vC', label: 'C에서의 속도', min: -40, max: 40, unit: '°/s' }],
    draw: ({ vB, vC }) => {
      const id = 'f105', segs = viaSegs(vB, vC), xt = [[0, '0'], [1, '1'], [2, '2'], [3, '3 s']];
      const F0 = frame({ id: 'f105a', x: 56, y: 62, w: 400, h: 150, t0: 0, t1: 3, v0: -10, v1: 100, yt: [0, 30, 60, 90], xt, title: '각도 θ (°)' });
      const F1 = frame({ id: 'f105b', x: 56, y: 262, w: 400, h: 90, t0: 0, t1: 3, v0: -60, v1: 110, yt: [-50, 0, 50, 100], xt, title: '각속도 (°/s)' });
      const F2 = frame({ id: 'f105c', x: 56, y: 402, w: 400, h: 90, t0: 0, t1: 3, v0: -450, v1: 450, yt: [-300, 0, 300], xt, title: '각가속도 (°/s²)' });
      const b = [F0.svg, F1.svg, F2.svg];
      // 경유점 사이 직선 (기울기 = 평균 속도)
      b.push(poly(VP.map((v, i) => [F0.X(i), F0.Y(v)]), 'f-none s-axis', 1.25, 'stroke-dasharray="4 4"'));
      // 정한 속도를 경유점의 짧은 접선으로
      [[1, vB], [2, vC]].forEach(([i, v]) => { const dt = 0.22 / Math.hypot(1, v / 120); b.push(L(F0.X(i - dt), F0.Y(VP[i] - v * dt), F0.X(i + dt), F0.Y(VP[i] + v * dt), 'c2', 2.5, 'stroke-linecap="round"')); });
      for (let i = 0; i < 3; i++) {
        b.push(F0.curve(t => ev(segs[i], t - i)[0], i, i + 1, 'f-none s-c1', 2.25), F1.curve(t => ev(segs[i], t - i)[1], i, i + 1, 'f-none s-c1', 2.25), F2.curve(t => ev(segs[i], t - i)[2], i, i + 1, 'f-none s-c1', 2.25, '', 8));
      }
      // 가속도가 튀는 곳
      [1, 2].forEach(i => {
        const l = ev(segs[i - 1], 1)[2], r = ev(segs[i], 0)[2];
        if (Math.abs(l - r) > 0.5) b.push(L(F2.X(i), F2.Y(Math.max(-450, Math.min(450, l))), F2.X(i), F2.Y(Math.max(-450, Math.min(450, r))), 'c2', 2, 'stroke-dasharray="3 3"'));
      });
      VP.forEach((v, i) => b.push(C(F0.X(i), F0.Y(v), 5, 'f-ink', 0), T(F0.X(i) + (i === 3 ? 10 : i === 0 ? 10 : -10), F0.Y(v) + (i === 2 ? -10 : i === 0 ? -8 : 2) - (i === 1 ? 10 : 0), 'ABCD'[i], { a: i === 0 || i === 3 ? 'start' : 'end', c: 'b', s: 13 })));
      [0, 1, 2, 3].forEach(i => { const v = i === 1 ? vB : i === 2 ? vC : 0; b.push(C(F1.X(i), F1.Y(v), 4.5, i === 1 || i === 2 ? 'f-c2' : 'f-ink', 0)); });
      return svg(id, [36, 488], b.join(''), '경유점 두 개를 지나는 3차 다항식 세 개. 경유점에서 정한 속도가 곡선 모양과 가속도의 튐을 바꾼다');
    },
    readout: ({ vB, vC }) => {
      const segs = viaSegs(vB, vC), jB = [ev(segs[0], 1)[2], ev(segs[1], 0)[2]], jC = [ev(segs[1], 1)[2], ev(segs[2], 0)[2]];
      let mx = -1e9, mn = 1e9;
      for (let i = 0; i <= 300; i++) { const v = viaEv(segs, i / 100)[0]; mx = Math.max(mx, v); mn = Math.min(mn, v); }
      const jump = (p, nm) => Math.abs(p[0] - p[1]) < 0.5 ? `${nm}에서 이어진다 (${m1(p[0])})` : `${nm}에서 <b>튄다</b> (${m1(p[0])} → ${m1(p[1])})`;
      return `<div><b>어림 규칙</b>: B는 양쪽 기울기 30과 60의 평균 = 45°/s, C는 60 → −30으로 부호가 바뀌어 0°/s</div>` +
        `<div><b>각가속도</b>(°/s²): ${jump(jB, 'B')} · ${jump(jC, 'C')}</div>` +
        `<div class="q">각도는 ${m1(mn)}°~${m1(mx)}° 사이를 지난다${mx > 90.05 ? '. C의 90°를 넘는다' : ''}${mn < -0.05 ? '. 출발한 0°보다 뒤로 갔다가 온다' : ''}.</div>`;
    },
  });

  // ---------------------------------------------------------------
  // 그림 10-6 직선 + 포물선 혼합 (슬라이더: 혼합 시간)
  const blend1 = (tb, t, d = 90, Tt = 3) => {
    const a = d / (tb * (Tt - tb)), v = a * tb;
    if (t <= tb) return [0.5 * a * t * t, a * t, a];
    if (t >= Tt - tb) { const r = Tt - t; return [d - 0.5 * a * r * r, a * r, -a]; }
    return [0.5 * a * tb * tb + v * (t - tb), v, 0];
  };
  const cub0 = cubic(0, 90, 0, 0, 3);
  FIG.fig10_6 = el => interactive(el, {
    state: { tb: 0.5 },
    sliders: [{ key: 'tb', label: '혼합 시간', min: 0.3, max: 1.5, step: 0.05, unit: ' s' }],
    draw: ({ tb }) => {
      const id = 'f106', xt = [[0, '0'], [1.5, '1.5'], [3, '3 s']];
      const F0 = frame({ id: 'f106a', x: 56, y: 92, w: 400, h: 130, t0: 0, t1: 3, v0: -5, v1: 100, yt: [0, 45, 90], xt, title: '각도 θ (°)', tdy: 30 });
      const F1 = frame({ id: 'f106b', x: 56, y: 272, w: 400, h: 90, t0: 0, t1: 3, v0: 0, v1: 70, yt: [0, 30, 60], xt, title: '각속도 (°/s)' });
      const F2 = frame({ id: 'f106c', x: 56, y: 412, w: 400, h: 100, t0: 0, t1: 3, v0: -130, v1: 130, yt: [-100, 0, 100], xt, title: '각가속도 (°/s²)' });
      const shade = F => `<rect x="${F.X(0)}" y="${F.y}" width="${F.X(tb) - F.X(0)}" height="${F.h}" class="f-c2" fill-opacity="0.1"/>` +
        `<rect x="${F.X(3 - tb)}" y="${F.y}" width="${F.X(3) - F.X(3 - tb)}" height="${F.h}" class="f-c2" fill-opacity="0.1"/>`;
      const b = [shade(F0), shade(F1), shade(F2), F0.svg, F1.svg, F2.svg];
      b.push(T(F0.X(tb / 2), F0.y - 8, '혼합', { a: 'middle', c: 'f-c2', s: 12.5 }), T(F0.X(3 - tb / 2), F0.y - 8, '혼합', { a: 'middle', c: 'f-c2', s: 12.5 }));
      if (3 - 2 * tb > 0.5) b.push(T(F0.X(1.5), F0.y - 8, '직선', { a: 'middle', c: 'f-c1', s: 12.5 }));
      [F0, F1, F2].forEach((F, i) => b.push(F.curve(t => ev(cub0, t)[i], 0, 3, 'f-none s-axis', 1.5, 'stroke-dasharray="4 3"')));
      const n = 240;
      [0, 1].forEach(i => { const F = [F0, F1][i]; b.push(F.curve(t => blend1(tb, t)[i], 0, 3, 'f-none s-c1', 2.5, '', n)); });
      const a = 90 / (tb * (3 - tb));
      b.push(poly([[F2.X(0), F2.Y(a)], [F2.X(tb), F2.Y(a)], [F2.X(tb), F2.Y(0)], [F2.X(3 - tb), F2.Y(0)], [F2.X(3 - tb), F2.Y(-a)], [F2.X(3), F2.Y(-a)]], 'f-none s-c1', 2.5));
      b.push(C(F0.X(tb), F0.Y(blend1(tb, tb)[0]), 4.5, 'f-c2', 0), C(F0.X(3 - tb), F0.Y(blend1(tb, 3 - tb)[0]), 4.5, 'f-c2', 0));
      b.push(L(250, 62, 274, 62, 'c1', 2.5), T(280, 67, '직선 + 혼합', { s: 12.5 }), L(370, 62, 394, 62, 'axis', 1.5, 'stroke-dasharray="4 3"'), T(400, 67, '3차식', { s: 12.5 }));
      return svg(id, [40, 504], b.join(''), '가운데는 일정한 속도의 직선, 양 끝은 일정한 가속도의 포물선이다. 혼합 시간을 늘리면 가속도는 작아지고 최고 속도는 커진다');
    },
    readout: ({ tb }) => {
      const a = 90 / (tb * (3 - tb)), v = 90 / (3 - tb), lin = 3 - 2 * tb;
      return `<div><b>가속도</b> a = 90 / (t<sub>b</sub>(3 − t<sub>b</sub>)) = <b>${f1(a)}°/s²</b> · <b>직선 구간 속도</b> v = a t<sub>b</sub> = <b>${f1(v)}°/s</b></div>` +
        `<div>직선 구간 ${f2(lin)} s${lin < 0.01 ? ': 직선이 없다. 가속이 끝나자마자 감속한다. 가속도가 가장 작은 경우다(4 × 90 / 3² = 40°/s²).' : ''}</div>` +
        `<div class="q">3차식(점선)은 최고 속도 45°/s, 가속도는 처음과 끝에서 ±60°/s²다.</div>`;
    },
  });

  // ---------------------------------------------------------------
  // 그림 10-7 경유점이 여러 개일 때의 직선 + 혼합 (Craig 식)
  const blendMulti = (u, td, am) => {
    const n = u.length, acc = [], tb = [], v = [];
    acc[0] = Math.sign(u[1] - u[0]) * am; tb[0] = td[0] - Math.sqrt(td[0] ** 2 - 2 * (u[1] - u[0]) / acc[0]); v[0] = (u[1] - u[0]) / (td[0] - tb[0] / 2);
    acc[n - 1] = Math.sign(u[n - 2] - u[n - 1]) * am; tb[n - 1] = td[n - 2] - Math.sqrt(td[n - 2] ** 2 + 2 * (u[n - 1] - u[n - 2]) / acc[n - 1]); v[n - 2] = (u[n - 1] - u[n - 2]) / (td[n - 2] - tb[n - 1] / 2);
    for (let j = 1; j < n - 2; j++) v[j] = (u[j + 1] - u[j]) / td[j];
    for (let j = 1; j < n - 1; j++) { acc[j] = Math.sign(v[j] - v[j - 1]) * am; tb[j] = (v[j] - v[j - 1]) / acc[j]; }
    const Tv = [0]; td.forEach(d => Tv.push(Tv[Tv.length - 1] + d));
    const line = (j, t) => j === 0 ? u[1] + v[0] * (t - Tv[1]) : u[j] + v[j] * (t - Tv[j]);
    const f = t => {   // [위치, 속도]
      if (t <= tb[0]) return [u[0] + 0.5 * acc[0] * t * t, acc[0] * t];
      if (t >= Tv[n - 1] - tb[n - 1]) { const r = Tv[n - 1] - t; return [u[n - 1] + 0.5 * acc[n - 1] * r * r, -acc[n - 1] * r]; }
      for (let k = 1; k < n - 1; k++) {
        const t0 = Tv[k] - tb[k] / 2;
        if (t >= t0 && t <= Tv[k] + tb[k] / 2) { const s = t - t0; return [line(k - 1, t0) + v[k - 1] * s + 0.5 * acc[k] * s * s, v[k - 1] + acc[k] * s]; }
      }
      let j = 0; while (j < n - 2 && t > Tv[j + 1]) j++;
      return [line(j, t), v[j]];
    };
    return { acc, tb, v, Tv, f };
  };
  FIG.fig10_7 = el => {
    const id = 'f107', bm = blendMulti(VP, [1, 1, 1], 150), xt = [[0, '0'], [1, '1'], [2, '2'], [3, '3 s']];
    const F0 = frame({ id: 'f107a', x: 56, y: 62, w: 400, h: 170, t0: 0, t1: 3, v0: -10, v1: 100, yt: [0, 30, 60, 90], xt, title: '각도 θ (°)' });
    const F1 = frame({ id: 'f107b', x: 56, y: 282, w: 400, h: 100, t0: 0, t1: 3, v0: -50, v1: 75, yt: [-30, 0, 30, 60], xt, title: '각속도 (°/s)' });
    const bands = [];
    bm.tb.forEach((w, k) => {
      const s = k === 0 ? 0 : k === 3 ? 3 - w : k - w / 2, e = k === 0 ? w : k === 3 ? 3 : k + w / 2;
      [F0, F1].forEach(F => bands.push(`<rect x="${F.X(s)}" y="${F.y}" width="${F.X(e) - F.X(s)}" height="${F.h}" class="f-c2" fill-opacity="0.1"/>`));
    });
    // 경유점을 지나는 직선 (늘여 그림)
    const ext = [];
    [[0, 1], [1, 2], [2, 3]].forEach(([i, j]) => { const sl = VP[j] - VP[i]; ext.push(L(F0.X(i - 0.25), F0.Y(VP[i] - 0.25 * sl), F0.X(j + 0.25), F0.Y(VP[j] + 0.25 * sl), 'axis', 1.25, `stroke-dasharray="4 4" clip-path="url(#f107a)"`)); });
    const tmax = 2 - bm.tb[2] / 2 - bm.v[1] / bm.acc[2], top = bm.f(tmax);   // C 앞에서 속도가 0이 되는 때
    el.innerHTML += svg(id, [36, 374], [
      bands.join(''), F0.svg, F1.svg, ext.join(''),
      F0.curve(t => bm.f(t)[0], 0, 3, 'f-none s-c1', 2.5, '', 300), F1.curve(t => bm.f(t)[1], 0, 3, 'f-none s-c1', 2.5, '', 300),
      VP.map((v, i) => C(F0.X(i), F0.Y(v), 5, 'f-none s-ink', 1.75)).join(''),
      T(F0.X(0) + 10, F0.Y(0) - 8, 'A', { c: 'b', s: 13 }), T(F0.X(1) + 10, F0.Y(30) + 18, 'B', { c: 'b', s: 13 }), T(F0.X(2) - 10, F0.Y(90) - 4, 'C (90°)', { a: 'end', c: 'b', s: 13 }), T(F0.X(3) - 6, F0.Y(60) - 12, 'D', { a: 'end', c: 'b', s: 13 }),
      C(F0.X(tmax), F0.Y(top[0]), 4, 'f-c1', 0), L(F0.X(tmax), F0.Y(top[0]) + 6, F0.X(tmax), F0.Y(42), 'ink', 1, 'stroke-dasharray="2 3"'),
      T(F0.X(tmax) + 6, F0.Y(34), `최고 ${f1(top[0])}°에서 돈다`, { c: 'b', s: 12.5 }), T(F0.X(tmax) + 6, F0.Y(34) + 18, 'C(90°)에 닿지 않는다', { c: 'b', s: 12.5 }),
      T(F1.X(0.55), F1.Y(bm.v[0]) - 8, f1(bm.v[0]), { a: 'middle', c: 'q', s: 12.5 }), T(F1.X(1.5), F1.Y(60) - 8, '60.0', { a: 'middle', c: 'q', s: 12.5 }), T(F1.X(2.6), F1.Y(bm.v[2]) + 18, f1(bm.v[2]), { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '경유점마다 일정한 가속도로 꺾는다. 꺾는 구간이 경유점 앞뒤에 걸쳐 있어 손이 경유점을 스쳐 지나간다');
  };

  // ---------------------------------------------------------------
  // 그림 10-8 3차와 5차 다항식의 속도와 가속도
  FIG.fig10_8 = el => {
    const id = 'f108', d = 90, Tt = 3, xt = [[0, '0'], [1.5, '1.5'], [3, '3 s']];
    const cu = t => t < 0 || t > Tt ? [0, 0] : [ev(cub0, t)[1], ev(cub0, t)[2]];
    const qu = t => { if (t < 0 || t > Tt) return [0, 0]; const s = t / Tt; return [d / Tt * (30 * s * s - 60 * s ** 3 + 30 * s ** 4), d / Tt ** 2 * (60 * s - 180 * s * s + 120 * s ** 3)]; };
    const F1 = frame({ id: 'f108a', x: 56, y: 76, w: 400, h: 120, t0: -0.5, t1: 3.5, v0: 0, v1: 60, yt: [0, 30, 45], xt, title: '각속도 (°/s)' });
    const F2 = frame({ id: 'f108b', x: 56, y: 246, w: 400, h: 120, t0: -0.5, t1: 3.5, v0: -70, v1: 70, yt: [-60, 0, 60], xt, title: '각가속도 (°/s²)' });
    const pw = (F, f, i, cls, w) => {   // 출발 전·도착 뒤의 정지 구간까지 이어 그린다
      const p = [];
      for (let k = 0; k <= 400; k++) { const t = -0.5 + 4 * k / 400; p.push([F.X(t), F.Y(f(t)[i])]); }
      return poly(p, cls, w);
    };
    const cuA = [[F2.X(-0.5), F2.Y(0)], [F2.X(0), F2.Y(0)], [F2.X(0), F2.Y(60)], [F2.X(3), F2.Y(-60)], [F2.X(3), F2.Y(0)], [F2.X(3.5), F2.Y(0)]];
    el.innerHTML += svg(id, [36, 366], [
      F1.svg, F2.svg,
      pw(F1, cu, 0, 'f-none s-c2', 2.25), pw(F1, qu, 0, 'f-none s-c1', 2.5),
      poly(cuA, 'f-none s-c2', 2.25), pw(F2, qu, 1, 'f-none s-c1', 2.5),
      L(F2.X(0), F2.Y(0), F2.X(0), F2.Y(60), 'c2', 3, 'stroke-opacity="0.35"'),
      T(F2.X(0) + 8, F2.Y(-24), '3차: 출발하는 순간', { c: 'f-c2', s: 12.5 }), T(F2.X(0) + 8, F2.Y(-24) + 18, '0 → 60으로 튄다', { c: 'f-c2', s: 12.5 }),
      T(F2.X(1.85), F2.Y(46), '5차: 0에서 시작해', { c: 'f-c1', s: 12.5 }), T(F2.X(1.85), F2.Y(46) + 18, '0으로 끝난다', { c: 'f-c1', s: 12.5 }),
      L(250, 56, 274, 56, 'c1', 2.5), T(280, 61, '5차', { s: 12.5 }), L(330, 56, 354, 56, 'c2', 2.25), T(360, 61, '3차', { s: 12.5 }),
      T(F1.X(1.5), F1.Y(56.25) - 6, '56.3', { a: 'middle', c: 'f-c1', s: 12.5 }), T(F1.X(1.5), F1.Y(45) + 18, '45', { a: 'middle', c: 'f-c2', s: 12.5 }),
    ].join(''), '같은 0도에서 90도, 3초 이동. 5차 다항식은 가속도까지 0에서 시작하고 0으로 끝난다');
  };

  // ---------------------------------------------------------------
  // 그림 10-9 설정 공간: 책상 위 장애물을 관절 공간에 옮겨 그리기 (슬라이더)
  const OB = { x: 4, y: 7, r: 2 };
  const segDist = (px, py, ax, ay, bx, by) => {
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(ax + t * dx - px, ay + t * dy - py);
  };
  const hits = (t1, t2) => { const { e, h } = paper(t1, t2); return segDist(OB.x, OB.y, 0, 0, e[0], e[1]) < OB.r || segDist(OB.x, OB.y, e[0], e[1], h[0], h[1]) < OB.r; };
  let cspaceCache = null;
  const cspace = (px, py) => {    // 3°마다 칸을 검사해 세로로 이어진 칸을 막대 하나로 그린다
    if (cspaceCache) return cspaceCache;
    const st = 3, out = [];
    const bar = (a, b0, b1) => out.push(`<rect x="${px(a)}" y="${py(b1)}" width="${st + 0.4}" height="${b1 - b0 + 0.4}" class="f-c2" fill-opacity="0.45"/>`);
    for (let a = -180; a < 180; a += st) {
      let run = null;
      for (let b = -150; b < 150; b += st) {
        const hit = hits(a + st / 2, b + st / 2);
        if (hit && run === null) run = b;
        if (!hit && run !== null) { bar(a, run, b); run = null; }
      }
      if (run !== null) bar(a, run, 150);
    }
    return (cspaceCache = out.join(''));
  };
  FIG.fig10_9 = el => interactive(el, {
    state: { t1: 20, t2: 40 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: -180, max: 180, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -150, max: 150, unit: '°' }],
    draw: ({ t1, t2 }) => {
      const id = 'f109', k = 7.5, bx = 240, by = 182, P = ([x, y]) => [bx + k * x, by - k * y];
      const px = u => 240 + u, py = u => 500 - u, bad = hits(t1, t2), O = P([OB.x, OB.y]);
      const grid = [-90, 0, 90].map(v => L(px(v), 350, px(v), 650, 'grid', 1, v ? 'stroke-dasharray="3 4"' : '') + L(60, py(v), 420, py(v), 'grid', 1, v ? 'stroke-dasharray="3 4"' : '')).join('');
      return svg(id, [32, 676], [
        T(16, 48, '책상 위: 팔과 컵', { c: 'b' }),
        `<circle cx="${bx}" cy="${by}" r="${18 * k}" class="f-tint s-grid" stroke-width="1"/>`,
        `<circle cx="${O[0]}" cy="${O[1]}" r="${OB.r * k}" class="f-c2 s-c2" fill-opacity="0.45" stroke-width="1.5"/>`, T(O[0] + OB.r * k + 6, O[1] + 5, '컵', { c: 'b', s: 13 }),
        arm(P, [t1, t2], bad ? 'c2' : 'c1', 10), joint(bx, by, 7),
        L(16, 318, 464, 318, 'grid', 1),
        T(16, 340, '관절 공간: 주황 영역 = 팔이 컵에 닿는 자세', { c: 'b' }),
        `<rect x="60" y="350" width="360" height="300" fill="none" class="s-axis" stroke-width="1"/>`, grid,
        cspace(px, py),
        C(px(t1), py(t2), 7, bad ? 'f-c2' : 'f-c1', 0), C(px(t1), py(t2), 10, 'f-none s-ink', 1.25),
        T(60, 676, '−180°', { a: 'middle', c: 'q', s: 12.5 }), T(240, 676, '0°', { a: 'middle', c: 'q', s: 12.5 }), T(420, 676, '180°', { a: 'middle', c: 'q', s: 12.5 }),
        T(46, 354, '150°', { a: 'end', c: 'q', s: 12.5 }), T(46, 504, '0°', { a: 'end', c: 'q', s: 12.5 }), T(46, 654, '−150°', { a: 'end', c: 'q', s: 12.5 }),
        T(420, 698, '가로: θ₁ 어깨', { a: 'end', s: 12.5 }), T(66, 698, '세로: θ₂ 팔꿈치', { s: 12.5 }),
      ].join(''), '책상 위의 컵이 관절 공간에서는 큰 영역이 된다. 팔 자세는 그 판 위의 점 하나다');
    },
    readout: ({ t1, t2 }) => {
      const { h } = paper(t1, t2);
      return `<div><b>손끝</b> (${m1(h[0])}, ${m1(h[1])}) cm · 컵은 (4, 7) cm에 반지름 2 cm</div>` +
        (hits(t1, t2) ? `<div><span class="dot c2">●</span> 팔이 컵에 <b>닿는다</b>. 관절 공간의 점이 주황 영역 안에 있다.</div>` : `<div><span class="dot c1">●</span> 팔이 컵에 닿지 않는다. 점이 빈 곳에 있다.</div>`);
    },
  });
})();
