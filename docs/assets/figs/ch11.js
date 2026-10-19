// 11장 그림: 동역학, 관성 텐서, 평행축 정리, 뉴턴-오일러
(function () {
  const { D, f1, f2, svg, T, L, A, AA, C, joint, link, arc, interactive, sub, matrix2 } = FigKit;
  const FIG = window.FIG;

  const dash = 'stroke-dasharray="4 4"';
  // 화살표: 너무 짧으면 그리지 않는다
  const arrow = (id, x1, y1, x2, y2, c, w = 2.5, more = '') =>
    Math.hypot(x2 - x1, y2 - y1) < 7 ? '' : L(x1, y1, x2, y2, c, w, `${more} ${A(id, c)}`);
  const poly = (pts, cls, w = 1.5, more = '') =>
    `<polygon points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" class="${cls}" stroke-width="${w}" ${more}/>`;
  // 굽은 화살표: 가운데 각 mid, 벌린 각 span(라디안, +면 반시계)
  const turn = (id, x, y, r, mid, span, c, w = 2.25) =>
    Math.abs(span) < 0.12 ? '' : arc(x, y, r, mid - span / 2, mid + span / 2, c, w, A(id, c));
  // 3차원 → 화면 (정사영). psi: 바라보는 방위, el: 내려다보는 각(도), u: 1 단위의 px
  const cam = (psi, el, ox, oy, u) => {
    const p = psi * D, e = el * D, rx = [-Math.sin(p), Math.cos(p)], up = [-Math.sin(e) * Math.cos(p), -Math.sin(e) * Math.sin(p), Math.cos(e)];
    return (x, y, z) => [ox + u * (x * rx[0] + y * rx[1]), oy - u * (x * up[0] + y * up[1] + z * up[2])];
  };
  // 작은 수를 a × 10^n 으로
  const mn = v => String(v).replace('-', '−');                         // 빼기 부호
  const pn = v => (v < 0 ? `(${mn(v)})` : v);                          // 음수는 괄호로
  const sci = v => { const e = Math.floor(Math.log10(Math.abs(v))); return `${(v / 10 ** e).toFixed(2)} × 10<sup>${e < 0 ? '−' + -e : e}</sup>`; };

  // 세워 든 링크: 10 cm, 100 g, 아래 끝에 모터
  const MGL = 0.1 * 9.8 * 0.05, I0 = 0.1 * 0.1 * 0.1 / 3;

  // 평면 팔의 뉴턴-오일러 (관절 축은 모두 z). links: [질량 kg, 길이 m, 질량 중심까지 m, I_c kg·m²]
  const newtonEuler = (q, qd, qdd, links, grav = [0, 0]) => {
    let th = 0, w = 0, wd = 0, acc = [-grav[0], -grav[1]];
    const F = [], N = [], pc = [], pn = [];
    links.forEach(([m, Ln, lc, Ic], i) => {
      th += q[i]; w += qd[i]; wd += qdd[i];                       // ① 바깥으로
      const u = [Math.cos(th), Math.sin(th)];
      const at = k => [acc[0] - wd * k * u[1] - w * w * k * u[0], acc[1] + wd * k * u[0] - w * w * k * u[1]];
      const ac = at(lc);
      F.push([m * ac[0], m * ac[1]]); N.push(Ic * wd); pc.push([lc * u[0], lc * u[1]]); pn.push([Ln * u[0], Ln * u[1]]);
      acc = at(Ln);
    });
    let f = [0, 0], n = 0;
    const tau = [];
    for (let i = links.length - 1; i >= 0; i--) {                  // ② 안으로
      n = N[i] + n + (pc[i][0] * F[i][1] - pc[i][1] * F[i][0]) + (pn[i][0] * f[1] - pn[i][1] * f[0]);
      f = [F[i][0] + f[0], F[i][1] + f[1]];
      tau[i] = n;
    }
    return tau;
  };
  // 종이 팔: 링크 1 (10 cm, 20 g), 링크 2 (8 cm, 15 g) + 손에 든 50 g을 한 덩어리로
  const PAPER = [[0.020, 0.10, 0.05, 0.020 * 0.01 / 12], [0.065, 0.08, 0.046 / 0.65, 264.615e-7]];
  const massMatrix = (t1, t2) => {
    const c1 = newtonEuler([t1, t2], [0, 0], [1, 0], PAPER), c2 = newtonEuler([t1, t2], [0, 0], [0, 1], PAPER);
    return [[c1[0], c2[0]], [c1[1], c2[1]]];
  };

  // 그림 11-1 순동역학과 역동역학
  FIG.fig11_1 = el => {
    const id = 'f111', mx = 88, my = 170, px = 360, py = 214, Ln = 92;
    const at = a => [px + Ln * Math.cos(a * D), py - Ln * Math.sin(a * D)];
    const g1 = at(6), g2 = at(22), g3 = at(56);
    el.innerHTML += svg(id, [40, 252], [
      C(mx, my, 30, 'f-tint s-axis', 1.5), C(mx, my, 8, 'f-axis', 0),
      arc(mx, my, 42, 20 * D, 160 * D, 'c1', 2.5, A(id, 'c1')),
      T(mx, my - 52, 'τ', { a: 'middle', c: 'b', s: 18 }),
      T(mx, 238, '모터 토크 τ', { a: 'middle', c: 'b', s: 14 }), T(mx, 258, '관절마다 하나', { a: 'middle', c: 'q', s: 12.5 }),
      L(150, 104, 292, 104, 'c1', 2.5, A(id, 'c1')),
      T(221, 90, '순동역학: 토크 → 움직임', { a: 'middle', c: 'b', s: 13.5 }), T(221, 126, '쓰는 곳: 시뮬레이션', { a: 'middle', c: 'q', s: 12.5 }),
      L(292, 192, 150, 192, 'c2', 2.5, A(id, 'c2')),
      T(221, 178, '역동역학: 움직임 → 토크', { a: 'middle', c: 'b', s: 13.5 }), T(221, 214, '쓰는 곳: 제어, 모터 고르기', { a: 'middle', c: 'q', s: 12.5 }),
      L(px, py, g1[0], g1[1], 'axis', 2, 'stroke-dasharray="3 4"'), L(px, py, g2[0], g2[1], 'axis', 2, 'stroke-dasharray="3 4"'),
      link(px, py, g3[0], g3[1], 'c1', 12),
      arc(px, py, 104, 26 * D, 60 * D, 'ink', 1.5, A(id, 'ink')),
      `<rect x="${px - 14}" y="${py - 14}" width="28" height="28" rx="5" class="f-tint s-axis" stroke-width="1.25"/>`, joint(px, py, 7),
      T(px + 20, 238, '움직임', { a: 'middle', c: 'b', s: 14 }), T(px + 20, 258, '각도 q · 속도 q̇ · 가속도 q̈', { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '토크로 움직임을 구하는 순동역학과 움직임으로 토크를 구하는 역동역학');
  };

  // 그림 11-2 세워 든 링크 (슬라이더)
  FIG.fig11_2 = el => interactive(el, {
    state: { t: 30, tau: 0.02 },
    sliders: [
      { key: 't', label: '각도 θ', min: -30, max: 210, unit: '°' },
      { key: 'tau', label: '모터 토크 τ (N·m)', min: -0.05, max: 0.1, step: 0.001, unit: '' },
    ],
    draw: ({ t, tau }) => {
      const id = 'f112', ox = 196, oy = 168, R = 120, r = t * D, c = Math.cos(r), sn = Math.sin(r);
      const G = MGL * c, acc = (tau - G) / I0, P = k => [ox + k * c, oy - k * sn];
      const tip = P(R), cm = P(R / 2), gy = 302;
      const al = Math.min(56, Math.abs(acc) * 0.3) * Math.sign(acc), tA = [tip[0] - al * sn, tip[1] - al * c];
      return svg(id, [36, 302], [
        L(ox + 16, oy, 352, oy, 'axis', 1, dash), T(358, oy + 5, 'θ = 0', { c: 'q', s: 12.5 }),
        L(ox, oy + 16, ox, gy - 2, 'axis', 1, 'stroke-dasharray="2 4"'), L(cm[0], cm[1], cm[0], gy - 2, 'c2', 1, 'stroke-dasharray="3 3"'),
        Math.abs(cm[0] - ox) < 3 ? '' : L(ox, gy, cm[0], gy, 'c2', 2.5) + L(ox, gy - 6, ox, gy + 6, 'c2', 1.5) + L(cm[0], gy - 6, cm[0], gy + 6, 'c2', 1.5),
        T((ox + cm[0]) / 2, gy + 22, `${sub('l', 'c')} cos θ = ${mn(f2(5 * c))} cm`, { a: 'middle', s: 13 }),
        link(ox, oy, tip[0], tip[1], 'axis', 14),
        turn(id, ox, oy, 46, r + Math.PI, -G / MGL * 80 * D, 'c2'),
        turn(id, ox, oy, 30, r + Math.PI, tau / 0.1 * 150 * D, 'c1'),
        `<rect x="${ox - 15}" y="${oy - 15}" width="30" height="30" rx="5" class="f-tint s-axis" stroke-width="1.25"/>`, joint(ox, oy, 7),
        C(cm[0], cm[1], 5, 'f-ink', 0),
        arrow(id, cm[0], cm[1], cm[0], cm[1] + 44, 'c2', 2.5),
        T(cm[0] + (c >= 0 ? 9 : -9), cm[1] + 40, 'mg', { a: c >= 0 ? 'start' : 'end', c: 'b', s: 13 }),
        arrow(id, tip[0], tip[1], tA[0], tA[1], 'ink', 2.75),
        Math.abs(al) < 12 ? '' : T(tA[0] - 16 * sn * Math.sign(al) + 6 * c, tA[1] - 16 * c * Math.sign(al) + 5, 'θ̈', { a: 'middle', c: 'b', s: 15 }),
      ].join(''), '모터 토크에서 중력 몫을 빼고 남는 토크가 링크를 가속한다');
    },
    readout: ({ t, tau }) => {
      const c = Math.cos(t * D), G = MGL * c, acc = (tau - G) / I0;
      const word = Math.abs(acc) < 2 ? '거의 멈춰 버틴다' : acc > 0 ? 'θ가 커지는 쪽으로 가속' : 'θ가 작아지는 쪽으로 가속';
      return `<div><span class="c2">중력 항 G = m g l<sub>c</sub> cos θ = 0.049 × ${pn(f2(c))} = <b>${mn(G.toFixed(3))}</b> N·m</span></div>` +
        `<div><span class="c1">모터 토크 τ = <b>${mn(tau.toFixed(3))}</b> N·m</span></div>` +
        `<div>θ̈ = (τ − G) / I₀ = (${mn(tau.toFixed(3))} − ${pn(G.toFixed(3))}) / 0.000333 = <b>${mn(f1(acc))} rad/s²</b> <span class="q">(${word})</span></div>` +
        `<div class="q">멈춰 버티려면 τ = G = ${mn(G.toFixed(3))} N·m</div>`;
    },
  });

  // 그림 11-3 점 하나에서 강체로
  FIG.fig11_3 = el => {
    const id = 'f113', O = [40, 250], Pm = [146, 154], Q = [338, 214], k = 0.5;
    const pts = [[70, 30], [-44, 56], [96, -28]];       // 축에서 본 점의 위치 (수학 좌표, px)
    const body = pts.map(([x, y]) => {
      const S = [Q[0] + x, Q[1] - y], V = [S[0] - k * y, S[1] - k * x];
      return L(Q[0], Q[1], S[0], S[1], 'ink', 1, 'stroke-dasharray="3 3"') + arrow(id, S[0], S[1], V[0], V[1], 'c1', 2.25) + C(S[0], S[1], 5, 'f-c1', 0);
    }).join('');
    el.innerHTML += svg(id, [40, 290], [
      T(16, 60, '(가) 점 하나', { c: 'b' }),
      arrow(id, O[0], O[1], Pm[0] - 6, Pm[1] + 6, 'ink', 2), T(80, 194, 'p', { a: 'end', c: 'b', s: 15 }),
      arrow(id, Pm[0], Pm[1], 214, 128, 'c1', 2.5), T(200, 120, 'mv', { a: 'middle', c: 'b', s: 14 }),
      arrow(id, Pm[0], Pm[1], 168, 210, 'c2', 2.5), T(176, 210, 'F', { c: 'b', s: 14 }),
      C(Pm[0], Pm[1], 9, 'f-c1', 0), T(Pm[0] - 14, Pm[1] - 10, 'm', { a: 'end', c: 'b', s: 14 }),
      C(O[0], O[1], 4, 'f-ink', 0), T(O[0], O[1] + 22, 'O (고정)', { a: 'middle', c: 'q', s: 12.5 }),
      T(16, 300, '운동량 = mv', { s: 13 }), T(16, 320, '각운동량 φ = p × mv', { c: 'b', s: 13 }),
      L(240, 48, 240, 326, 'grid', 1),
      T(256, 60, '(나) 강체 = 점이 아주 많다', { c: 'b' }),
      `<ellipse cx="360" cy="196" rx="106" ry="70" class="f-tint s-axis" stroke-width="1.25"/>`,
      body,
      C(Q[0], Q[1], 7, 'f-none s-ink'), C(Q[0], Q[1], 2.5, 'f-ink', 0),
      arc(Q[0], Q[1], 20, 200 * D, 330 * D, 'c2', 2, A(id, 'c2')), T(Q[0] - 24, Q[1] + 30, 'ω', { a: 'end', c: 'b', s: 15 }),
      T(256, 300, sub('v', 'i') + ' = ω × ' + sub('p', 'i'), { s: 13 }), T(256, 320, '모든 점이 같은 ω로 돈다', { c: 'q', s: 13 }),
    ].join(''), '점 하나의 운동량과 각운동량, 그리고 같은 각속도로 도는 점들의 모임인 강체');
  };

  // 그림 11-4 관성 텐서의 대각선 칸
  FIG.fig11_4 = el => {
    const id = 'f114', P = cam(-62, 24, 140, 150, 34), p = v => P(v[0], v[1], v[2]);
    const a = 3, b = 1.5, c = 1;
    const V = [-1, 1].flatMap(x => [-1, 1].flatMap(y => [-1, 1].map(z => [x * a, y * b, z * c])));
    const edges = [];
    V.forEach((u, i) => V.forEach((w, j) => {
      if (j > i && [0, 1, 2].filter(k => u[k] !== w[k]).length === 1) edges.push(L(...p(u), ...p(w), 'axis', 1.25));
    }));
    const Dm = p([1.2, 0.8, 0.6]), Ft = p([1.2, 0, 0]), X0 = p([-4.4, 0, 0]), X1 = p([4.5, 0, 0]);
    const ax = [X1[0] - X0[0], X1[1] - X0[1]], an = Math.hypot(...ax), au = [ax[0] / an, ax[1] / an];
    const rv = [Dm[0] - Ft[0], Dm[1] - Ft[1]], rn = Math.hypot(...rv), ru = [rv[0] / rn, rv[1] / rn];
    const sq = [[Ft[0] + 8 * au[0], Ft[1] + 8 * au[1]], [Ft[0] + 8 * au[0] + 8 * ru[0], Ft[1] + 8 * au[1] + 8 * ru[1]], [Ft[0] + 8 * ru[0], Ft[1] + 8 * ru[1]]];
    const by = 336, bx0 = 40, bx1 = 260, cx = (bx0 + bx1) / 2;
    el.innerHTML += svg(id, [40, 382], [
      T(16, 60, '(가) 조각 dm이 x축에서 떨어진 거리', { c: 'b' }),
      edges.join(''),
      L(X0[0], X0[1], X1[0], X1[1], 'ink', 1.75, A(id, 'ink')), T(X1[0] + 2, X1[1] + 22, 'x축', { a: 'middle', c: 'b', s: 13 }),
      `<polyline points="${sq.map(q => q.join(',')).join(' ')}" fill="none" class="s-c2" stroke-width="1.25"/>`,
      L(Ft[0], Ft[1], Dm[0], Dm[1], 'c2', 2.5), T((Ft[0] + Dm[0]) / 2 - 8, (Ft[1] + Dm[1]) / 2 + 4, 'r', { a: 'end', c: 'b', s: 15 }),
      `<rect x="${Dm[0] - 7}" y="${Dm[1] - 7}" width="14" height="14" class="f-c1 s-c1" fill-opacity="0.5" stroke-width="1.25"/>`,
      T(Dm[0] + 12, Dm[1] + 5, 'dm', { c: 'b', s: 14 }), C(Ft[0], Ft[1], 3, 'f-c2', 0),
      T(318, 94, '조각의 자리 (x, y, z)', { c: 'q', s: 12.5 }), T(318, 116, 'r² = y² + z²', { s: 14 }),
      T(318, 156, '모든 조각을 더하면', { c: 'q', s: 12.5 }), T(318, 178, sub('I', 'xx') + ' = ∫ (y² + z²) dm', { c: 'b', s: 14 }),
      L(16, 238, 464, 238, 'grid', 1),
      T(16, 266, '(나) 막대 10 cm × 1 cm × 1 cm, 100 g', { c: 'b' }),
      L(18, by, 290, by, 'c1', 1.25, 'stroke-dasharray="5 4"'), L(cx, 284, cx, 392, 'c2', 1.25, 'stroke-dasharray="5 4"'),
      `<rect x="${bx0}" y="${by - 11}" width="${bx1 - bx0}" height="22" rx="3" class="f-tint s-axis" stroke-width="1.5"/>`,
      `<path d="M${bx1 + 16} ${by - 20} A7 20 0 1 1 ${bx1 + 15.9} ${by + 20}" fill="none" class="s-c1" stroke-width="2" ${A(id, 'c1')}/>`,
      `<path d="M${cx - 28} 296 A28 8 0 1 0 ${cx + 28} 296" fill="none" class="s-c2" stroke-width="2" ${A(id, 'c2')}/>`,
      T(316, 312, '긴 축 둘레', { c: 'b', s: 13 }), T(316, 332, sub('I', 'xx') + ' = 16.7 g·cm²', { s: 13 }),
      T(316, 364, '가로 축 둘레', { c: 'b', s: 13 }), T(316, 384, sub('I', 'yy') + ' = 842 g·cm²', { s: 13 }),
      L(304, 300, 304, 338, 'c1', 4), L(304, 352, 304, 390, 'c2', 4),
    ].join(''), '관성 모멘트는 축까지 거리의 제곱을 질량으로 더한 것이다');
  };

  // 그림 11-5 평행축 정리 (슬라이더)
  FIG.fig11_5 = el => interactive(el, {
    state: { d: 5 },
    sliders: [{ key: 'd', label: '축까지 거리 d', min: 0, max: 14, step: 0.5, unit: ' cm' }],
    draw: ({ d }) => {
      const id = 'f115', s = 14, cx = 100, cy = 150, ax = cx + d * s, Ic = 833.33, md2 = 100 * d * d, I = Ic + md2, Imax = Ic + 100 * 196;
      const rot = -22 * D, rc = Math.cos(rot), rs = Math.sin(rot);
      const turnPt = ([x, y]) => [ax + (x - ax) * rc + (y - cy) * rs, cy - (x - ax) * rs + (y - cy) * rc];
      const ghost = [[cx - 70, cy - 7], [cx + 70, cy - 7], [cx + 70, cy + 7], [cx - 70, cy + 7]].map(turnPt), gc = turnPt([cx, cy]);
      const W = 448 / Imax, wc = Ic * W, wm = md2 * W;
      return svg(id, [40, 274], [
        poly(ghost, 'f-none s-axis', 1.25, 'stroke-dasharray="4 3"'),
        d > 0.6 ? arc(ax, cy, d * s, Math.PI, Math.PI - 22 * D, 'axis', 1.25, `stroke-dasharray="3 3" ${A(id, 'axis')}`) : '',
        `<rect x="${cx - 70}" y="${cy - 7}" width="140" height="14" rx="3" class="f-c1 s-c1" fill-opacity="0.25" stroke-width="1.5"/>`,
        C(cx, cy, 4, 'f-ink', 0), T(cx, cy + 28, 'C', { a: 'middle', c: 'b', s: 14 }),
        d < 0.6 ? '' : L(cx, cy + 46, ax, cy + 46, 'c2', 1.5) + L(cx, cy + 40, cx, cy + 52, 'c2', 1.5) + L(ax, cy + 40, ax, cy + 52, 'c2', 1.5),
        T(d < 0.6 ? cx : (cx + ax) / 2, cy + 68, `d = ${f1(d)} cm`, { a: 'middle', s: 13 }),
        C(ax, cy, 9, 'f-tint s-c2', 2), C(ax, cy, 2.5, 'f-c2', 0), T(ax + 10, cy - 14, '축', { c: 'b', s: 13 }),
        T(16, 254, '돌리기 어려운 정도 I', { c: 'b', s: 13 }), T(464, 254, Math.round(I) + ' g·cm²', { a: 'end', c: 'b', s: 15 }),
        `<rect x="16" y="262" width="448" height="16" rx="3" fill="none" class="s-grid"/>`,
        `<rect x="16" y="262" width="${wc}" height="16" class="f-c1" fill-opacity="0.55"/>`,
        wm < 0.5 ? '' : `<rect x="${16 + wc}" y="262" width="${wm}" height="16" class="f-c2" fill-opacity="0.55"/>`,
        `<rect x="16" y="290" width="12" height="12" class="f-c1" fill-opacity="0.55"/>`, T(34, 301, sub('I', 'c') + ' = 833 (막대 자체)', { s: 12.5 }),
        `<rect x="236" y="290" width="12" height="12" class="f-c2" fill-opacity="0.55"/>`, T(254, 301, `m d² = ${Math.round(md2)}`, { s: 12.5 }),
      ].join(''), '회전축을 질량 중심에서 d만큼 옮기면 관성이 m d제곱만큼 커진다');
    },
    readout: ({ d }) => {
      const Ic = 833.33, md2 = 100 * d * d, I = Ic + md2;
      const end = d === 5 ? '<div class="q">d = 5 cm는 막대 끝, 곧 세워 든 링크의 모터 축이다. I = mL²/3이다.</div>' : '';
      return `<div><b>I</b> = I<sub>c</sub> + m d² = 833 + 100 × ${f1(d)}² = <b>${Math.round(I)} g·cm²</b> = ${sci(I * 1e-7)} kg·m²</div>` + end +
        `<div class="q">점 하나로 보면 m d² = ${Math.round(md2)}만 남는다. 빠뜨린 I<sub>c</sub>는 전체의 ${Math.round(100 * Ic / I)}%다.</div>`;
    },
  });

  // 그림 11-6 판을 돌리면 관성 곱이 생긴다 (슬라이더)
  FIG.fig11_6 = el => interactive(el, {
    state: { a: 30 },
    sliders: [{ key: 'a', label: '판을 돌린 각도 α', min: -90, max: 90, unit: '°' }],
    draw: ({ a }) => {
      const id = 'f116', r = a * D, c = Math.cos(r), s = Math.sin(r), ox = 160, oy = 196, u = 22, k = 2.6;
      const Ixx = 4 * c * c + 36 * s * s, Pxy = 32 * c * s;
      const B = (x, y) => [ox + u * (x * c - y * s), oy - u * (x * s + y * c)];
      const plate = [[3, 1], [-3, 1], [-3, -1], [3, -1]].map(([x, y]) => B(x, y));
      const xa = B(4.3, 0), xb = B(-4.3, 0), ya = B(0, 2.6), yb = B(0, -2.6);
      const Ph = [ox + k * Ixx, oy + k * Pxy], n = Math.hypot(Ph[0] - ox, Ph[1] - oy) || 1, flat = Math.abs(Ph[1] - oy) < 14;
      const dx = (Ph[0] - ox) / n, dy = (Ph[1] - oy) / n;
      const pl = flat ? [Math.max(Ph[0], ox + 20) + 22, oy + 24] : [Ph[0] + 8 * dx - 22 * dy, Ph[1] + 8 * dy + 22 * dx + 5];
      // 축 이름: 두 끝 가운데 φ 화살표에서 먼 쪽에 단다. ω 화살표(오른쪽 수평) 위는 피한다.
      const tag = (ex, ey, txt) => {
        const ends = [[ox + u * ex, oy - u * ey], [ox - u * ex, oy + u * ey]];
        const score = q => Math.hypot(q[0] - Ph[0], q[1] - Ph[1]) - (q[0] > ox + 20 && Math.abs(q[1] - oy) < 16 ? 1000 : 0);
        const q = score(ends[0]) >= score(ends[1]) ? ends[0] : ends[1];
        return T(q[0], q[1] + (Math.abs(q[1] - oy) < 12 ? -8 : 5), txt, { a: 'middle', c: 'b', s: 14 });
      };
      return svg(id, [40, 282], [
        L(ox - 130, oy, ox + 196, oy, 'axis', 1.25, A(id, 'axis')), L(ox, oy + 112, ox, 50, 'axis', 1.25, A(id, 'axis')),
        T(ox + 200, oy + 5, 'x', { c: 'q', s: 13 }), T(ox + 8, 58, 'y', { c: 'q', s: 13 }),
        poly(plate, 'f-tint s-axis', 1.5),
        L(xb[0], xb[1], xa[0], xa[1], 'c1', 1.5, 'stroke-dasharray="5 4"'), L(yb[0], yb[1], ya[0], ya[1], 'c1', 1.5, 'stroke-dasharray="5 4"'),
        tag(4.9 * c, 4.9 * s, 'x′'), tag(-3.3 * s, 3.3 * c, 'y′'),
        Math.abs(a) < 4 ? '' : arc(ox, oy, 34, 0, r, 'c1', 1.25), Math.abs(a) < 8 ? '' : T(ox + 48 * Math.cos(r / 2), oy - 48 * Math.sin(r / 2) + 5, 'α', { a: 'middle', c: 'b', s: 13 }),
        L(ox, oy, ox + 118, oy, 'ink', 3, A(id, 'ink')), T(ox + 124, oy - 10, 'ω', { a: 'middle', c: 'b', s: 15 }),
        arrow(id, ox, oy, Ph[0], Ph[1], 'c2', 3),
        T(pl[0], pl[1], 'φ = Iω', { a: 'middle', c: 'b', s: 14 }),
        C(ox, oy, 4, 'f-ink', 0),
      ].join(''), '판을 돌리면 관성 곱이 생기고 각운동량이 각속도 방향에서 비켜 간다');
    },
    readout: ({ a }) => {
      const r = a * D, c = Math.cos(r), s = Math.sin(r), Ixx = 4 * c * c + 36 * s * s, Iyy = 4 * s * s + 36 * c * c, Pxy = 32 * c * s;
      const off = Math.round(Math.abs(Math.atan2(-Pxy, Ixx)) / D);
      return `<div class="matrow"><b>책상 축으로 적은 I</b> (x, y 칸) = ${matrix2(f1(Ixx), mn(f1(-Pxy)), mn(f1(-Pxy)), f1(Iyy), ['', ''])}<span class="q">g·cm² · I<sub>zz</sub> = 40은 그대로</span></div>` +
        `<div>관성 곱 I<sub>xy</sub> = <b>${mn(f1(Pxy))}</b> · ω = (1, 0, 0) rad/s이면 <span class="c2">φ = Iω = (${f1(Ixx)}, ${mn(f1(-Pxy))}, 0)</span>, ω와 <b>${off}°</b> 어긋난다</div>`;
    },
  });

  // 그림 11-7 링크 i의 자유물체도
  FIG.fig11_7 = el => {
    const id = 'f117', P1 = [126, 238], Q1 = [166, 218], Q2 = [318, 140], P2 = [356, 120], Cm = [242, 179];
    el.innerHTML += svg(id, [40, 300], [
      link(28, 262, P1[0], P1[1], 'axis', 12), link(P2[0], P2[1], 456, 96, 'axis', 12),
      link(Q1[0], Q1[1], Q2[0], Q2[1], 'c1', 14),
      joint(Q1[0], Q1[1], 8), C(Q1[0], Q1[1], 2.5, 'f-ink', 0), joint(Q2[0], Q2[1], 8), C(Q2[0], Q2[1], 2.5, 'f-ink', 0),
      T(54, 292, '링크 i−1', { a: 'middle', c: 'q', s: 12.5 }), T(436, 128, '링크 i+1', { a: 'middle', c: 'q', s: 12.5 }),
      T(196, 168, '링크 i', { a: 'middle', c: 'b', s: 14 }),
      // 관절 i의 짝
      arrow(id, Q1[0], Q1[1], 148, 162, 'ink', 2.5), T(142, 160, sub('f', 'i'), { a: 'end', c: 'b', s: 15 }),
      arc(Q1[0], Q1[1], 22, 250 * D, 345 * D, 'ink', 2, A(id, 'ink')), T(Q1[0] + 28, Q1[1] + 30, sub('n', 'i'), { c: 'b', s: 15 }),
      arrow(id, P1[0], P1[1], 108, 294, 'axis', 2.25), T(102, 290, '−' + sub('f', 'i'), { a: 'end', c: 'q', s: 14 }),
      // 관절 i+1의 짝
      arrow(id, Q2[0], Q2[1], 336, 194, 'c2', 2.5), T(344, 196, '−' + sub('f', 'i+1'), { c: 'b', s: 15 }),
      arc(Q2[0], Q2[1], 22, 175 * D, 95 * D, 'c2', 2, A(id, 'c2')), T(Q2[0] - 26, Q2[1] - 26, '−' + sub('n', 'i+1'), { a: 'end', c: 'b', s: 15 }),
      arrow(id, P2[0], P2[1], 338, 66, 'axis', 2.25), T(346, 66, sub('f', 'i+1'), { c: 'q', s: 14 }),
      // 질량 중심
      arrow(id, Cm[0], Cm[1], Cm[0], Cm[1] + 46, 'axis', 2.25), T(Cm[0] + 8, Cm[1] + 44, sub('m', 'i') + 'g', { c: 'q', s: 14 }),
      arrow(id, Cm[0], Cm[1], Cm[0] + 46, Cm[1] + 30, 'ink', 1.75, 'stroke-dasharray="4 3"'), T(Cm[0] + 52, Cm[1] + 40, sub('F', 'i'), { c: 'b', s: 15 }),
      C(Cm[0], Cm[1], 5, 'f-ink', 0), T(Cm[0] + 8, Cm[1] - 12, sub('C', 'i'), { c: 'b', s: 14 }),
      T(Q1[0] - 2, Q1[1] + 34, sub('Z', 'i') + ' ⊙', { a: 'end', c: 'q', s: 13 }),
      T(240, 318, `${sub('τ', 'i')} = ${sub('n', 'i')} · ${sub('Z', 'i')} : 관절 축 둘레 몫만 모터가 낸다`, { a: 'middle', s: 13.5 }),
    ].join(''), '관절을 끊으면 링크 사이의 힘은 크기가 같고 방향이 반대인 짝으로 나타난다');
  };

  // 그림 11-8 뉴턴-오일러: 바깥으로, 안으로
  FIG.fig11_8 = el => {
    const id = 'f118', J = [[64, 214], [174, 162], [292, 196], [410, 146]];
    const mids = J.slice(0, 3).map((p, i) => [(p[0] + J[i + 1][0]) / 2, (p[1] + J[i + 1][1]) / 2]);
    el.innerHTML += svg(id, [44, 292], [
      T(240, 70, '① 바깥으로 (받침 → 끝)', { a: 'middle', c: 'b', s: 14 }), T(240, 90, '속도·가속도를 넘기고 링크마다 F = m v̇, N을 구한다', { a: 'middle', c: 'q', s: 12.5 }),
      L(56, 106, 424, 106, 'c1', 2.5, A(id, 'c1')),
      `<rect x="${J[0][0] - 30}" y="${J[0][1] + 10}" width="60" height="14" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
      J.slice(0, 3).map((p, i) => link(p[0], p[1], J[i + 1][0], J[i + 1][1], 'axis', 12)).join(''),
      J.slice(0, 3).map(p => joint(p[0], p[1], 8)).join(''), C(J[3][0], J[3][1], 6, 'f-ink', 0),
      mids.map((m, i) => T(m[0] - 4, m[1] - 18, `${sub('F', i + 1)} ${sub('N', i + 1)}`, { a: 'middle', c: 'b', s: 13 })).join(''),
      J.slice(0, 3).map((p, i) => T(p[0] + (i === 0 ? 34 : 0), p[1] + (i === 0 ? 4 : 34), sub('τ', i + 1), { a: 'middle', c: 'b', s: 14 })).join(''),
      L(424, 274, 56, 274, 'c2', 2.5, A(id, 'c2')),
      T(240, 300, '② 안으로 (끝 → 받침)', { a: 'middle', c: 'b', s: 14 }), T(240, 320, 'f, n을 넘기며 관절마다 τ = n · Z를 뽑는다', { a: 'middle', c: 'q', s: 12.5 }),
      T(16, 258, '받침: v̇₀ = 위로 g', { c: 'q', s: 12.5 }), T(464, 132, '끝: f = 0, n = 0', { a: 'end', c: 'q', s: 12.5 }),
    ].join(''), '뉴턴-오일러 알고리즘은 바깥으로 가며 가속도를, 안으로 오며 힘을 넘긴다');
  };

  // 그림 11-9 종이 팔의 질량 행렬과 얽힘 (슬라이더)
  FIG.fig11_9 = el => interactive(el, {
    state: { t2: 0 },
    sliders: [{ key: 't2', label: '팔꿈치 θ₂', min: 0, max: 150, unit: '°' }],
    draw: ({ t2 }) => {
      const id = 'f119', s = 11, bx = 56, by = 204, a = 20 * D, b = (20 + t2) * D;
      const ex = bx + s * 10 * Math.cos(a), ey = by - s * 10 * Math.sin(a), hx = ex + s * 8 * Math.cos(b), hy = ey - s * 8 * Math.sin(b);
      const M = massMatrix(a, t2 * D), t1v = 100 * M[0][0], t2v = 100 * M[1][0];
      const Z = 40, W = 2120, ang = v => (Math.abs(v) < 0.002 ? 0 : Math.sign(v) * (30 + 120 * Math.abs(v) / 0.2) * D);   // 방향은 굽은 화살표, 크기는 아래 막대
      return svg(id, [58, 260], [
        link(bx, by, ex, ey, 'axis', 12), link(ex, ey, hx, hy, 'axis', 12),
        C(bx + s * 5 * Math.cos(a), by - s * 5 * Math.sin(a), 4, 'f-axis', 0), C(ex + s * 4 * Math.cos(b), ey - s * 4 * Math.sin(b), 4, 'f-axis', 0),
        turn(id, bx, by, 28, a + Math.PI, ang(t1v), 'c1'),
        turn(id, ex, ey, 24, (a + b) / 2 - Math.PI / 2, ang(t2v), 'c2'),
        joint(bx, by, 8), joint(ex, ey, 7),
        `<rect x="${hx - 8}" y="${hy - 8}" width="16" height="16" rx="3" class="f-axis" fill-opacity="0.5"/>`, T(hx + 14, hy - 10, '50 g', { s: 12.5 }),
        T(bx + 34, by + 22, '어깨', { c: 'q', s: 12.5 }), T(ex + 4, ey + 46, '팔꿈치', { a: 'middle', c: 'q', s: 12.5 }),
        T(16, 254, 'τ₁ 어깨', { c: 'b', s: 13 }), T(464, 254, mn(t1v.toFixed(3)) + ' N·m', { a: 'end', c: 'b', s: 13 }),
        `<rect x="${Z}" y="261" width="${W * t1v}" height="12" class="f-c1" fill-opacity="0.6"/>`,
        T(16, 294, 'τ₂ 팔꿈치', { c: 'b', s: 13 }), T(464, 294, mn(t2v.toFixed(3)) + ' N·m', { a: 'end', c: 'b', s: 13 }),
        `<rect x="${Math.min(Z, Z + W * t2v)}" y="301" width="${Math.abs(W * t2v)}" height="12" class="f-c2" fill-opacity="0.6"/>`,
        L(Z, 258, Z, 316, 'ink', 1.25),
      ].join(''), '어깨만 가속해도 팔꿈치 모터가 토크를 내야 한다');
    },
    readout: ({ t2 }) => {
      const M = massMatrix(20 * D, t2 * D), g = v => Math.round(v * 1e7);
      return `<div>멈춘 자세에서 어깨를 <b>θ̈₁ = 100 rad/s²</b>로 가속하고, 팔꿈치 각은 그대로 둔다(θ̈₂ = 0).</div>` +
        `<div class="matrow"><b>M</b> = ${matrix2(g(M[0][0]), mn(g(M[0][1])), mn(g(M[1][0])), g(M[1][1]), ['c1', ''])}<span class="q">g·cm² · 뉴턴-오일러로 한 열씩 구했다</span></div>` +
        `<div><span class="c1">τ₁ = M₁₁ θ̈₁ = ${(100 * M[0][0]).toFixed(3)} N·m</span> · <span class="c2">τ₂ = M₂₁ θ̈₁ = ${mn((100 * M[1][0]).toFixed(3))} N·m</span></div>` +
        `<div class="q">팔꿈치 모터를 끄면(τ₂ = 0) θ̈₂ = −(M₂₁/M₂₂) θ̈₁ = ${mn(f1(-100 * M[1][0] / M[1][1]))} rad/s²</div>`;
    },
  });
})();
