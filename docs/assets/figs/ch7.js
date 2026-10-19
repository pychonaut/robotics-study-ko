// 7장 그림: 자코비안의 명시적 형태와 특이점
(function () {
  const { D, f1, f2, svg, T, L, A, AA, C, joint, link, arc, interactive, sub, matrix2 } = FigKit;
  const FIG = window.FIG;

  // 종이 팔 (cm): 팔꿈치와 손끝
  const paper = (t1, t2) => {
    const e = [10 * Math.cos(t1 * D), 10 * Math.sin(t1 * D)];
    return { e, h: [e[0] + 8 * Math.cos((t1 + t2) * D), e[1] + 8 * Math.sin((t1 + t2) * D)] };
  };
  const rot90 = ([x, y]) => [-y, x];                       // z × (x, y, 0) = (−y, x, 0)
  const nrm = ([x, y]) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n]; };
  const pre = (top, main, bottom) => `<tspan baseline-shift="super" font-size="10">${top}</tspan>${main}` + (bottom ? `<tspan baseline-shift="sub" font-size="10">${bottom}</tspan>` : '');
  // 화살표 끝 너머에 글자 놓기 (화면 방향 dx, dy)
  const tipLabel = (x, y, dx, dy, txt, c, gap = 14) => {
    const [ux, uy] = nrm([dx, dy]);
    const a = ux > 0.35 ? 'start' : ux < -0.35 ? 'end' : 'middle';
    const lim = { start: [16, 430], end: [50, 464], middle: [34, 446] }[a];
    const tx = Math.min(lim[1], Math.max(lim[0], x + gap * ux));
    return T(tx, y + gap * uy + 5 + (uy > 0.35 ? 4 : 0), txt, { a, c, s: 13 });
  };
  // 직각 표시 (H에서 화면 방향 u, n으로 k만큼)
  const rightMark = (H, u, n, k, c) =>
    `<path d="M${H[0] + k * u[0]} ${H[1] + k * u[1]}L${H[0] + k * u[0] + k * n[0]} ${H[1] + k * u[1] + k * n[1]}L${H[0] + k * n[0]} ${H[1] + k * n[1]}" fill="none" class="s-${c}" stroke-width="1"/>`;
  const poly = (pts, cls, w = 1.25, more = '') => `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" class="${cls}" stroke-width="${w}" ${more}/>`;

  // 그림 7-1 관절 하나의 몫: 직동과 회전
  FIG.fig7_1 = el => {
    const id = 'f71';
    // (가) 직동 관절
    const bar = (dx, ghost) => {
      const op = ghost ? 'stroke-dasharray="4 3" stroke-opacity="0.6"' : '';
      return `<rect x="${44 + dx}" y="156" width="100" height="16" rx="3" class="${ghost ? 'f-none' : 'f-c1'} s-c1" ${ghost ? '' : 'fill-opacity="0.3"'} stroke-width="1.5" ${op}/>` +
        L(144 + dx, 164, 176 + dx, 110, 'c1', ghost ? 1.5 : 2.5, `stroke-linecap="round" ${op}`) +
        (ghost ? '' : C(176, 110, 5.5, 'f-c1', 0));
    };
    // (나) 회전 관절
    const ox = 296, oy = 186, E = [414, 124], M = [358, 198];
    const p = [E[0] - ox, E[1] - oy], pl = Math.hypot(p[0], p[1]), u = [-p[0] / pl, -p[1] / pl], n = [p[1] / pl, -p[0] / pl];
    const g = 14 * D, rot = ([x, y]) => [ox + (x - ox) * Math.cos(g) + (y - oy) * Math.sin(g), oy - (x - ox) * Math.sin(g) + (y - oy) * Math.cos(g)];
    const Eg = rot(E), Mg = rot(M), V = [E[0] + 50 * n[0], E[1] + 50 * n[1]];
    el.innerHTML += svg(id, [40, 266], [
      T(120, 60, '(가) 직동 관절', { a: 'middle', c: 'b', s: 15 }),
      `<rect x="24" y="148" width="64" height="32" rx="5" class="f-tint s-axis" stroke-width="1.25"/>`,
      bar(30, true), bar(0, false),
      L(34, 204, 124, 204, 'axis', 1.75, A(id, 'axis')), T(130, 209, sub('z', 'i'), { s: 13 }),
      L(186, 110, 222, 110, 'c2', 2.5, A(id, 'c2')),
      T(168, 96, 'E', { a: 'middle', c: 'b', s: 13 }),
      T(120, 252, '손끝 속도 v = ' + sub('z', 'i') + ' ḋ' + '<tspan baseline-shift="sub" font-size="10">i</tspan>', { a: 'middle', s: 13 }),
      T(120, 274, '손끝 각속도 ω = 0', { a: 'middle', s: 13 }),
      T(120, 296, '모두 함께 미끄러질 뿐 돌지 않는다', { a: 'middle', c: 'q', s: 12.5 }),
      L(240, 48, 240, 300, 'grid', 1),
      T(360, 60, '(나) 회전 관절', { a: 'middle', c: 'b', s: 15 }),
      L(ox, oy, Mg[0], Mg[1], 'c1', 1.5, 'stroke-dasharray="4 3" stroke-opacity="0.6"'), L(Mg[0], Mg[1], Eg[0], Eg[1], 'c1', 1.5, 'stroke-dasharray="4 3" stroke-opacity="0.6"'),
      link(ox, oy, M[0], M[1], 'c1', 10), link(M[0], M[1], E[0], E[1], 'c1', 10),
      L(ox, oy, E[0], E[1], 'ink', 1.25, 'stroke-dasharray="5 4"'),
      T(340, 144, sub('p', 'iE'), { a: 'middle', c: 'b', s: 13 }),
      arc(ox, oy, 24, 55 * D, 170 * D, 'c2', 1.5, A(id, 'c2')),
      joint(ox, oy, 8), C(ox, oy, 2.5, 'f-ink', 0),
      T(ox + 4, oy + 34, '⊙ 축 ' + sub('z', 'i') + ': 화면 밖으로', { a: 'middle', c: 'q', s: 12.5 }),
      C(E[0], E[1], 5.5, 'f-c1', 0), T(E[0] + 12, E[1] + 16, 'E', { c: 'b', s: 13 }),
      rightMark(E, u, n, 9, 'ink'),
      L(E[0], E[1], V[0], V[1], 'c2', 2.5, A(id, 'c2')),
      T(V[0] - 10, V[1] + 6, 'v', { a: 'end', c: 'b', s: 13 }),
      T(360, 252, 'v = (' + sub('z', 'i') + ' × ' + sub('p', 'iE') + ') θ̇' + '<tspan baseline-shift="sub" font-size="10">i</tspan>', { a: 'middle', s: 13 }),
      T(360, 274, 'ω = ' + sub('z', 'i') + ' θ̇' + '<tspan baseline-shift="sub" font-size="10">i</tspan>', { a: 'middle', s: 13 }),
      T(360, 296, '손끝은 p에 수직으로 움직이며 돈다', { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '직동 관절은 손끝을 축 방향으로 밀고, 회전 관절은 축과 손끝을 잇는 화살표에 수직으로 움직인다');
  };

  // 종이 팔 + 두 열 화살표 (그림 7-2, 7-5 공용)
  const armWithColumns = (id, t1, t2, o) => {
    const s = 9, bx = 255, by = 280, S = ([x, y]) => [bx + s * x, by - s * y];
    const { e, h } = paper(t1, t2), E = S(e), H = S(h);
    const p1 = h, p2 = [h[0] - e[0], h[1] - e[1]], q1 = rot90(p1), q2 = rot90(p2);
    const T1 = [H[0] + s * q1[0], H[1] - s * q1[1]], T2 = [H[0] + s * q2[0], H[1] - s * q2[1]];
    const scr = ([x, y]) => [x, -y];
    const b = [
      L(20, by, 456, by, 'grid', 1, A(id, 'axis')), L(bx, 370, bx, 40, 'grid', 1, A(id, 'axis')),
      T(458, by + 18, sub('x', '0'), { a: 'end', c: 'q', s: 12.5 }), T(bx + 8, 50, sub('y', '0'), { c: 'q', s: 12.5 }),
      link(bx, by, E[0], E[1], 'axis', 10), link(E[0], E[1], H[0], H[1], 'axis', 10),
      `<rect x="${bx - 18}" y="${by + 9}" width="36" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      joint(bx, by, 7), joint(E[0], E[1], 6),
    ];
    if (o.frames) {
      const a = t1 * D, X1 = [bx + 44 * Math.cos(a), by - 44 * Math.sin(a)], Y1 = [bx - 44 * Math.sin(a), by - 44 * Math.cos(a)];
      b.push(L(bx, by, X1[0], X1[1], 'ink', 1.75, A(id, 'ink')), L(bx, by, Y1[0], Y1[1], 'ink', 1.75, A(id, 'ink')),
        T(bx + 36 * Math.cos(a) + 16 * Math.sin(a), by - 36 * Math.sin(a) + 16 * Math.cos(a) + 5, sub('x', '1'), { a: 'middle', c: 'b', s: 13 }),
        T(bx - 58 * Math.sin(a), by - 58 * Math.cos(a) + 5, sub('y', '1'), { a: 'middle', c: 'b', s: 13 }));
    }
    if (o.pvec) {
      const n1 = nrm(p1), side = (p1[0] * e[1] - p1[1] * e[0]) > 0 ? 1 : -1;   // 팔꿈치 반대쪽
      const L1 = [p1[0] * 0.45 + side * 1.5 * n1[1], p1[1] * 0.45 - side * 1.5 * n1[0]];
      const n2 = nrm(p2), L2 = [e[0] + p2[0] * 0.5 + 1.7 * n2[1], e[1] + p2[1] * 0.5 - 1.7 * n2[0]];   // p2의 오른쪽
      b.push(L(bx, by, H[0], H[1], 'c1', 1.5, 'stroke-dasharray="5 4"'), L(E[0], E[1], H[0], H[1], 'c2', 1.5, 'stroke-dasharray="5 4"'));
      if (Math.hypot(...p1) > 10) b.push(T(S(L1)[0], S(L1)[1] + 5, sub('p', '1E'), { a: 'middle', c: 'f-c1 b', s: 13 }));
      b.push(T(S(L2)[0], S(L2)[1] + 5, sub('p', '2E'), { a: 'middle', c: 'f-c2 b', s: 13 }));
      const u1 = scr(nrm(p1)).map(v => -v), w1 = scr(nrm(q1)), u2 = scr(nrm(p2)).map(v => -v), w2 = scr(nrm(q2));
      if (Math.hypot(...p1) > 1.5) b.push(rightMark(H, u1, w1, 8, 'c1'));
      b.push(rightMark(H, u2, w2, 8, 'c2'));
    }
    // 열 2 글자: 화살표 옆, 열 1과 반대쪽
    const m2 = nrm(q2); let sn = [m2[1], -m2[0]];
    const d1 = sn[0] * q1[0] + sn[1] * q1[1];
    if (d1 > 1e-6 || (Math.abs(d1) <= 1e-6 && sn[0] * p2[0] + sn[1] * p2[1] > 0)) sn = [-sn[0], -sn[1]];
    const lab2 = [h[0] + 0.62 * q2[0] + 1.6 * sn[0], h[1] + 0.62 * q2[1] + 1.6 * sn[1]];
    b.push(L(H[0], H[1], T1[0], T1[1], 'c1', 2.5, A(id, 'c1')), L(H[0], H[1], T2[0], T2[1], 'c2', 2.5, A(id, 'c2')),
      C(H[0], H[1], 5, 'f-ink', 0),
      tipLabel(T1[0], T1[1], T1[0] - H[0], T1[1] - H[1], '열 1', 'f-c1 b'),
      T(S(lab2)[0], S(lab2)[1] + 5, '열 2', { a: 'middle', c: 'f-c2 b', s: 13 }));
    return { body: b.join(''), q1, q2, p1, p2 };
  };

  // 그림 7-2 종이 팔의 두 열 = 화살표를 90° 돌린 것 (슬라이더)
  FIG.fig7_2 = el => interactive(el, {
    state: { t1: 30, t2: 60 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: 0, max: 120, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -90, max: 180, unit: '°' }],
    draw: ({ t1, t2 }) => svg('f72', [30, 346], armWithColumns('f72', t1, t2, { pvec: true }).body, '자코비안의 각 열은 관절에서 손끝까지의 화살표를 90도 돌린 것이다'),
    readout: ({ t1, t2 }) => {
      const { p1, p2, q1, q2 } = armWithColumns('f72', t1, t2, {});
      return `<div class="matrow"><b>J</b> = ${matrix2(f1(q1[0]), f1(q2[0]), f1(q1[1]), f1(q2[1]))}<span class="q">왼쪽 열 = 어깨, 오른쪽 열 = 팔꿈치 (cm)</span></div>` +
        `<div><span class="dot c1">●</span> p<sub>1E</sub> = (${f1(p1[0])}, ${f1(p1[1])}) → 열 1 = (${f1(q1[0])}, ${f1(q1[1])})</div>` +
        `<div><span class="dot c2">●</span> p<sub>2E</sub> = (${f1(p2[0])}, ${f1(p2[1])}) → 열 2 = (${f1(q2[0])}, ${f1(q2[1])})</div>`;
    },
  });

  // 3차원 등축 투영: x 왼쪽 아래, y 오른쪽 아래, z 위
  const iso = (ox, oy, s) => (x, y, z) => [ox + s * 0.866 * (y - x), oy + s * 0.5 * (x + y) - s * z];

  // 그림 7-3 돌림판 종이 팔: 3차원에서도 열 = 축 × 화살표
  FIG.fig7_3 = el => {
    const id = 'f73', s = 15, P = iso(100, 330, s), t1 = 120 * D, t2 = 28 * D, t3 = 34 * D;
    const u = [Math.cos(t1), Math.sin(t1), 0], ax = [Math.sin(t1), -Math.cos(t1), 0];
    const re = 10 * Math.cos(t2), he = 10 * Math.sin(t2), r = re + 8 * Math.cos(t2 + t3), h = he + 8 * Math.sin(t2 + t3);
    const at = (rr, hh) => P(rr * u[0], rr * u[1], hh);
    const O = P(0, 0, 0), E = at(re, he), H = at(r, h), Ax = P(0, 0, h), top = P(0, 0, h + 3.6);
    const add = (p, v, k) => P(p[0] + k * v[0], p[1] + k * v[1], p[2] + k * v[2]);
    const H3 = [r * u[0], r * u[1], h];
    const col1 = [-r * u[1], r * u[0], 0];                                   // z1 × p1E
    const a = 8 * Math.cos(t2 + t3), bb = 8 * Math.sin(t2 + t3);              // 팔뚝 = a·u + bb·k
    const col3 = [-bb * u[0], -bb * u[1], a];                                // z3 × p3E = a·k − bb·u
    const C1 = add(H3, col1, 0.5), C3 = add(H3, col3, 0.5);
    const Z2 = add([0, 0, 0], ax, 3.6), E3 = [re * u[0], re * u[1], he], Z3 = add(E3, ax, 3.6);
    const ring = [], disk = [], disk2 = [];
    for (let k = -22; k <= 22; k += 2) { const f = t1 + k * D; ring.push(P(r * Math.cos(f), r * Math.sin(f), h)); }
    for (let k = 0; k <= 360; k += 10) { const f = k * D; disk.push(P(2.8 * Math.cos(f), 2.8 * Math.sin(f), 0)); disk2.push(P(2.8 * Math.cos(f), 2.8 * Math.sin(f), -0.7)); }
    const rl = [Ax[0] + 0.3 * (H[0] - Ax[0]), Ax[1] + 0.3 * (H[1] - Ax[1])];
    const pl = [O[0] + 0.52 * (H[0] - O[0]), O[1] + 0.52 * (H[1] - O[1])];
    el.innerHTML += svg(id, [80, 322], [
      poly(disk2, 'f-tint s-axis'), poly(disk, 'f-tint s-axis'),
      L(O[0], O[1], top[0], top[1], 'ink', 1.25, 'stroke-dasharray="3 4" ' + A(id, 'ink')), T(top[0] + 10, top[1] + 8, sub('z', '1') + ' 돌림판 축', { s: 13 }),
      poly(ring, 'f-none s-c1', 1.25, 'stroke-dasharray="2 4"'),
      L(Ax[0], Ax[1], H[0], H[1], 'axis', 1.25, 'stroke-dasharray="4 4"'),
      T(rl[0], rl[1] + 20, 'r = 축까지 거리', { a: 'middle', c: 'q', s: 12.5 }),
      L(O[0], O[1], H[0], H[1], 'c1', 1.5, 'stroke-dasharray="6 4"'),
      T(pl[0] - 10, pl[1] - 14, sub('p', '1E'), { a: 'middle', c: 'f-c1 b', s: 13 }),
      link(O[0], O[1], E[0], E[1], 'axis', 10), link(E[0], E[1], H[0], H[1], 'axis', 10),
      joint(O[0], O[1], 7), joint(E[0], E[1], 6),
      L(O[0], O[1], Z2[0], Z2[1], 'ink', 1.75, A(id, 'ink')), T(Z2[0] - 8, Z2[1] + 8, sub('z', '2'), { a: 'end', s: 13 }),
      L(E[0], E[1], Z3[0], Z3[1], 'ink', 1.75, A(id, 'ink')), T(Z3[0] - 8, Z3[1] + 8, sub('z', '3'), { a: 'end', s: 13 }),
      T((E[0] + H[0]) / 2 + 14, (E[1] + H[1]) / 2 + 10, sub('p', '3E'), { c: 'f-c2 b', s: 13 }),
      L(H[0], H[1], C1[0], C1[1], 'c1', 2.5, A(id, 'c1')), L(H[0], H[1], C3[0], C3[1], 'c2', 2.5, A(id, 'c2')),
      C(H[0], H[1], 5, 'f-ink', 0), T(H[0] + 12, H[1] + 16, 'E', { c: 'b', s: 13 }),
      T(C1[0] + 8, C1[1] + 2, '열 1 = ' + sub('z', '1') + ' × ' + sub('p', '1E'), { c: 'f-c1 b', s: 13 }),
      T(C3[0] - 8, C3[1] - 8, '열 3 = ' + sub('z', '3') + ' × ' + sub('p', '3E'), { a: 'end', c: 'f-c2 b', s: 13 }),
    ].join(''), '돌림판 위의 종이 팔에서 관절 축과 손끝까지의 화살표, 그리고 그 외적');
  };

  // 앞에 붙는 위·아래 첨자 (⁰₁T 꼴)
  const preT = (x, y, top, bot, o = {}) => T(x - 1, y - 8, top, { a: 'end', s: 10, c: o.c }) + T(x - 1, y + 3, bot, { a: 'end', s: 10, c: o.c }) + T(x, y, 'T', { s: o.s || 14, c: o.c });

  // 그림 7-4 동차변환에서 자코비안 읽기
  FIG.fig7_4 = el => {
    const id = 'f74', cell = 11, xs = [30, 136, 242, 356], y0 = 198, W = 4 * cell;
    const icon = (x, last) => {
      let g = `<path d="M${x - 4} ${y0 - 3}h-3v${4 * cell + 6}h3M${x + W + 4} ${y0 - 3}h3v${4 * cell + 6}h-3" fill="none" class="s-ink" stroke-width="1.25"/>`;
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        const hi = r < 3 && c === 2 ? 'f-c1' : (r < 3 && c === 3 && last ? 'f-c2' : 'f-tint');
        g += `<rect x="${x + c * cell + 1}" y="${y0 + r * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="2" class="${hi}" ${hi === 'f-tint' ? '' : 'fill-opacity="0.8"'}/>`;
      }
      return g;
    };
    const jx = 40, jw = 400, jy = 52, cw = jw / 5, b = [];
    // 자코비안 틀 (위)
    b.push(`<rect x="${jx}" y="${jy}" width="${jw}" height="34" rx="4" class="f-c2 s-c2" fill-opacity="0.1" stroke-width="1.25"/>`,
      `<rect x="${jx}" y="${jy + 40}" width="${jw}" height="34" rx="4" class="f-c1 s-c1" fill-opacity="0.1" stroke-width="1.25"/>`,
      T(jx - 8, jy + 22, sub('J', 'v'), { a: 'end', c: 'b', s: 13 }), T(jx - 8, jy + 62, sub('J', 'ω'), { a: 'end', c: 'b', s: 13 }),
      T(jx + jw / 2, jy + 22, '∂P/∂q₁ · ∂P/∂q₂ · … · ∂P/∂qₙ  (또는 z × p)', { a: 'middle', s: 13 }));
    ['1', '2', '3', '…', 'n'].forEach((l, j) => b.push(T(jx + cw * j + cw / 2, jy + 62, l === '…' ? '…' : sub('z', l), { a: 'middle', s: 13 })));
    // 변환행렬 (아래)
    xs.forEach((x, k) => {
      const last = k === 3, j = last ? 4 : k;
      b.push(icon(x, last), preT(x + W / 2 + 4, y0 + 4 * cell + 26, '0', last ? 'n' : String(k + 1)));
      b.push(L(x + 2.5 * cell, y0 - 6, jx + cw * j + cw / 2, jy + 78, 'c1', 1.25, A(id, 'c1')));
      if (k < 2) {
        const xa = x + W + 12, xb = xs[k + 1] - 12;
        b.push(L(xa, y0 + 2 * cell, xb, y0 + 2 * cell, 'axis', 1.25, A(id, 'axis')),
          T((xa + xb) / 2 - 12, y0 + 2 * cell + 26, '×', { a: 'middle', c: 'q', s: 12 }), preT((xa + xb) / 2 + 6, y0 + 2 * cell + 26, String(k + 1), String(k + 2), { c: 'q', s: 13 }));
      }
    });
    b.push(L(xs[2] + W + 12, y0 + 2 * cell, 304, y0 + 2 * cell, 'axis', 1.25), T(318, y0 + 2 * cell + 5, '⋯', { a: 'middle', s: 16 }),
      L(332, y0 + 2 * cell, xs[3] - 12, y0 + 2 * cell, 'axis', 1.25, A(id, 'axis')));
    const p4 = [xs[3] + 3.5 * cell, y0 - 6];
    b.push(`<path d="M${p4[0]} ${p4[1]}C${p4[0] + 40} ${p4[1] - 30} ${jx + jw + 34} ${jy + 70} ${jx + jw + 4} ${jy + 22}" fill="none" class="s-c2" stroke-width="1.5" ${A(id, 'c2')}/>`,
      T(372, jy + 96, '넷째 열 = 손끝 위치', { a: 'end', c: 'f-c2 b', s: 12.5 }), T(372, jy + 114, 'q로 미분 ↗', { a: 'end', c: 'f-c2 b', s: 12.5 }),
      T(jx + 16, jy + 108, '셋째 열 = 축 z ↑', { c: 'f-c1 b', s: 12.5 }),
      T(240, y0 + 4 * cell + 58, '회전 관절만 z를 넣고, 직동 관절 칸은 0', { a: 'middle', c: 'q', s: 12.5 }));
    el.innerHTML += svg(id, [40, 290], b.join(''), '받침부터 차례로 곱한 변환행렬의 셋째 열에서 축을, 마지막 행렬의 넷째 열에서 손끝 위치를 읽는다');
  };

  // 그림 7-5 같은 화살표를 {0}과 {1}의 숫자로 (슬라이더)
  FIG.fig7_5 = el => interactive(el, {
    state: { t1: 30, t2: 60 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: 0, max: 120, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -90, max: 180, unit: '°' }],
    draw: ({ t1, t2 }) => svg('f75', [30, 346], armWithColumns('f75', t1, t2, { frames: true }).body, '같은 열 화살표를 받침 좌표계와 링크 1 좌표계의 숫자로 적는다'),
    readout: ({ t1, t2 }) => {
      const { q1, q2 } = armWithColumns('f75', t1, t2, {}), c = Math.cos(t1 * D), s = Math.sin(t1 * D);
      const r1 = [c * q1[0] + s * q1[1], -s * q1[0] + c * q1[1]], r2 = [c * q2[0] + s * q2[1], -s * q2[0] + c * q2[1]];
      return `<div class="matrow"><b><sup>0</sup>J</b> = ${matrix2(f1(q1[0]), f1(q2[0]), f1(q1[1]), f1(q2[1]))}<span class="q">받침 {0}의 숫자</span></div>` +
        `<div class="matrow"><b><sup>1</sup>J</b> = ${matrix2(f1(r1[0]), f1(r2[0]), f1(r1[1]), f1(r2[1]))}<span class="q">링크 1 {1}의 숫자: θ₁을 바꿔도 그대로</span></div>` +
        `<div>det J = 80 sin θ₂ = <b>${f1(80 * Math.sin(t2 * D))}</b> <span class="q">(두 좌표계에서 같다)</span></div>`;
    },
  });

  // 그림 7-6 스탠퍼드 Scheinman 팔과 자코비안의 모양
  FIG.fig7_6 = el => {
    const id = 'f76', Sx = 112, Sy = 158, el2 = 14 * D, bdir = [Math.cos(el2), -Math.sin(el2)];
    const along = k => [Sx + k * bdir[0], Sy + k * bdir[1]], nrmv = [-bdir[1], bdir[0]];   // 붐 아래쪽
    const W = along(222), sl0 = along(-30), sl1 = along(78), r0 = along(50);
    const t6 = -el2 - 48 * D, z6 = [Math.cos(t6), -Math.sin(t6)];
    const Z4 = [W[0] + 42 * bdir[0], W[1] + 42 * bdir[1]], Z6 = [W[0] + 44 * z6[0], W[1] + 44 * z6[1]], G = [W[0] + 22 * z6[0], W[1] + 22 * z6[1]];
    const z3a = along(96).map((v, i) => v + 20 * nrmv[i]), z3b = along(150).map((v, i) => v + 20 * nrmv[i]);
    const b = [
      `<rect x="${Sx - 34}" y="250" width="68" height="14" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(Sx, 250, Sx, Sy, 'axis', 14, 'stroke-linecap="round" stroke-opacity="0.45"'),
      L(Sx, 246, Sx, 62, 'ink', 1.25, 'stroke-dasharray="3 4" ' + A(id, 'ink')), T(Sx + 10, 72, sub('z', '1'), { s: 13 }),
      arc(Sx, 222, 26, -150 * D, -30 * D, 'c2', 1.25, A(id, 'c2')), T(Sx + 34, 236, 'θ₁', { c: 'q', s: 12.5 }),
      L(...sl0, ...sl1, 'axis', 18, 'stroke-linecap="round" stroke-opacity="0.55"'),
      link(...r0, ...W, 'c1', 8),
      C(Sx, Sy, 9, 'f-tint s-ink', 1.5), C(Sx, Sy, 2.5, 'f-ink', 0),
      T(Sx - 14, Sy - 12, sub('z', '2') + ' ⊙', { a: 'end', s: 13 }),
      L(...z3a, ...z3b, 'ink', 1.5, A(id, 'ink')), T(z3b[0] + 6, z3b[1] + 10, sub('z', '3'), { s: 13 }),
      T((r0[0] + W[0]) / 2 + 8, (r0[1] + W[1]) / 2 - 16, sub('d', '3') + ' 늘었다 줄었다', { a: 'middle', s: 12.5 }),
      L(W[0], W[1], G[0], G[1], 'c2', 6, 'stroke-linecap="round" stroke-opacity="0.35"'),
      L(W[0], W[1], Z4[0], Z4[1], 'ink', 1.5, A(id, 'ink')), L(W[0], W[1], Z6[0], Z6[1], 'c2', 1.75, A(id, 'c2')),
      C(W[0], W[1], 8, 'f-tint s-ink', 1.5), C(W[0], W[1], 2.5, 'f-ink', 0),
      T(Z4[0] + 6, Z4[1] + 5, sub('z', '4'), { s: 13 }), T(Z6[0] + 6, Z6[1] + 12, sub('z', '6'), { s: 13 }),
      T(W[0] - 4, W[1] - 16, 'W 손목점 · ' + sub('z', '5') + ' ⊙', { a: 'middle', c: 'b', s: 13 }),
      T(470, 234, '⊙ = 화면 밖으로 나오는 축', { a: 'end', c: 'q', s: 12 }),
    ];
    // 자코비안 모양 (2줄 × 6칸)
    const gx = 62, gy = 300, cw = 68, ch = 40;
    const head = ['θ₁ 회전', 'θ₂ 회전', 'd₃ 직동', 'θ₄ 회전', 'θ₅ 회전', 'θ₆ 회전'];
    const top = [sub('z', '1') + '×' + sub('p', '1W'), sub('z', '2') + '×' + sub('p', '2W'), sub('z', '3'), '0', '0', '0'];
    const bot = [sub('z', '1'), sub('z', '2'), '0', sub('z', '4'), sub('z', '5'), sub('z', '6')];
    head.forEach((t, j) => b.push(T(gx + cw * j + cw / 2, gy - 10, t, { a: 'middle', c: 'q', s: 12.5 })));
    [top, bot].forEach((row, i) => row.forEach((t, j) => {
      const zero = t === '0', x = gx + cw * j, y = gy + ch * i;
      b.push(`<rect x="${x + 2}" y="${y + 2}" width="${cw - 4}" height="${ch - 4}" rx="4" class="${zero ? 'f-tint s-grid' : (i ? 'f-c1 s-c1' : 'f-c2 s-c2')}" ${zero ? '' : 'fill-opacity="0.14"'} stroke-width="1"/>`,
        T(x + cw / 2, y + ch / 2 + 5, t, { a: 'middle', c: zero ? 'q' : 'b', s: 13 }));
    }));
    b.push(T(gx - 8, gy + ch / 2 + 5, sub('J', 'v'), { a: 'end', c: 'b', s: 13 }), T(gx - 8, gy + ch * 1.5 + 5, sub('J', 'ω'), { a: 'end', c: 'b', s: 13 }),
      `<rect x="${gx + 3 * cw - 1}" y="${gy - 1}" width="${3 * cw + 2}" height="${ch + 2}" rx="5" fill="none" class="s-ink" stroke-width="1.25" stroke-dasharray="4 3"/>`,
      T(gx + 4.5 * cw, gy + 2 * ch + 22, '손목 관절은 W를 옮기지 못한다', { a: 'middle', c: 'q', s: 12.5 }));
    el.innerHTML += svg(id, [44, 384], b.join(''), '스탠퍼드 Scheinman 팔의 관절 축과 손목점에서 본 자코비안의 모양');
  };

  // 그림 7-7 특이점 두 자세
  FIG.fig7_7 = el => {
    const id = 'f77', s = 9, k = 4;
    const panel = (bx, by, t2, title, lift) => {
      const { e, h } = paper(0, t2), E = [bx + s * e[0], by - s * e[1]], H = [bx + s * h[0], by - s * h[1] - lift];
      const q1 = rot90(h), q2 = rot90([h[0] - e[0], h[1] - e[1]]);
      const g = [
        T(bx + 92, 60, title, { a: 'middle', c: 'b', s: 15 }),
        `<rect x="${bx - 16}" y="${by + 9}" width="32" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
        link(bx, by, E[0], E[1], 'axis', 10), link(E[0], E[1] - lift, H[0], H[1], 'axis', 8),
        joint(bx, by, 7), joint(E[0], E[1] - lift / 2, 7),
        L(H[0] - 36, H[1], H[0] + 36, H[1], 'ink', 1.25, 'stroke-dasharray="4 3" ' + AA(id, 'ink')),
        L(H[0] + 18, H[1] - 8, H[0] + 30, H[1] + 4, 'c2', 2.25), L(H[0] + 18, H[1] + 4, H[0] + 30, H[1] - 8, 'c2', 2.25),
        L(H[0] - 5, H[1], H[0] - 5, H[1] - k * q1[1], 'c1', 2.5, A(id, 'c1')), L(H[0] + 5, H[1], H[0] + 5, H[1] - k * q2[1], 'c2', 2.5, A(id, 'c2')),
        C(H[0], H[1], 4.5, 'f-ink', 0),
      ];
      return { g, H, q1, q2 };
    };
    const a = panel(28, 186, 0, '(가) 쭉 편 팔 θ₂ = 0°', 0), b = panel(282, 186, 180, '(나) 다 접은 팔 θ₂ = 180°', 7);
    el.innerHTML += svg(id, [40, 262], [
      ...a.g,
      T(a.H[0] - 12, a.H[1] - k * a.q1[1] + 4, '열 1', { a: 'end', c: 'f-c1 b', s: 13 }), T(a.H[0] + 12, a.H[1] - k * a.q2[1] + 4, '열 2', { c: 'f-c2 b', s: 13 }),
      L(240, 48, 240, 266, 'grid', 1),
      ...b.g,
      T(b.H[0] - 12, b.H[1] - 16, '열 1', { a: 'end', c: 'f-c1 b', s: 13 }), T(b.H[0] + 12, b.H[1] - k * b.q2[1] + 4, '열 2', { c: 'f-c2 b', s: 13 }),
      T(120, 258, '두 열이 같은 줄 위에 있다', { a: 'middle', s: 13 }), T(360, 258, '두 열이 같은 줄 위에 있다', { a: 'middle', s: 13 }),
      T(240, 290, '점선(팔이 놓인 방향)으로는 어떤 관절 속도로도 못 간다', { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '팔을 쭉 펴거나 다 접으면 두 열이 나란해져 팔 방향으로 움직일 수 없다');
  };

  // 그림 7-8 속도 타원과 det J (슬라이더)
  FIG.fig7_8 = el => interactive(el, {
    state: { t2: 60 },
    sliders: [{ key: 't2', label: '팔꿈치 θ₂', min: 0, max: 180, unit: '°' }],
    draw: ({ t2 }) => {
      const id = 'f78', s = 9, k = 4, bx = 40, by = 200;
      const { e, h } = paper(0, t2), E = [bx + s * e[0], by - s * e[1]], H = [bx + s * h[0], by - s * h[1]];
      const q1 = rot90(h), q2 = rot90([h[0] - e[0], h[1] - e[1]]);
      const ell = [];
      for (let i = 0; i <= 72; i++) { const u = i * 5 * D; ell.push([H[0] + k * (Math.cos(u) * q1[0] + Math.sin(u) * q2[0]), H[1] - k * (Math.cos(u) * q1[1] + Math.sin(u) * q2[1])]); }
      const [rx, ry] = nrm(h), far = [bx + s * h[0] + 40 * rx, by - s * h[1] - 40 * ry];
      const X = t => 330 + t * 130 / 180, Y = d => 196 - d * 1.2, curve = [];
      for (let t = 0; t <= 180; t += 3) curve.push([X(t), Y(80 * Math.sin(t * D))]);
      const dv = 80 * Math.sin(t2 * D);
      return svg(id, [44, 262], [
        L(bx, by, far[0], far[1], 'axis', 1, 'stroke-dasharray="3 4"'),
        `<rect x="${bx - 16}" y="${by + 9}" width="32" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
        link(bx, by, E[0], E[1], 'axis', 10), link(E[0], E[1], H[0], H[1], 'axis', 8), joint(bx, by, 7), joint(E[0], E[1], 6),
        poly(ell, 'f-c1 s-c1', 1.75, 'fill-opacity="0.12"'),
        L(H[0], H[1], H[0] + k * q1[0], H[1] - k * q1[1], 'c1', 2, A(id, 'c1')), L(H[0], H[1], H[0] + k * q2[0], H[1] - k * q2[1], 'c2', 2, A(id, 'c2')),
        C(H[0], H[1], 4.5, 'f-ink', 0),
        L(316, 56, 316, 300, 'grid', 1),
        T(330, 74, 'det J = 80 sin θ₂', { c: 'b', s: 13 }),
        L(X(0), Y(0), X(180) + 8, Y(0), 'axis', 1.25), L(X(0), Y(0), X(0), Y(80) - 8, 'axis', 1.25),
        L(X(0) - 4, Y(80), X(180), Y(80), 'grid', 1, 'stroke-dasharray="3 4"'), T(X(0) - 6, Y(80) + 4, '80', { a: 'end', c: 'q', s: 12 }), T(X(0) - 6, Y(0) + 4, '0', { a: 'end', c: 'q', s: 12 }),
        poly(curve, 'f-none s-c1', 1.75),
        T(X(0), Y(0) + 18, '0°', { a: 'middle', c: 'q', s: 12 }), T(X(90), Y(0) + 18, '90°', { a: 'middle', c: 'q', s: 12 }), T(X(180), Y(0) + 18, '180°', { a: 'middle', c: 'q', s: 12 }),
        T(X(90), Y(0) + 38, 'θ₂', { a: 'middle', c: 'q', s: 12.5 }),
        L(X(t2), Y(0), X(t2), Y(dv), 'c1', 1, 'stroke-dasharray="2 3"'), C(X(t2), Y(dv), 5.5, 'f-c1', 0),
        T(X(0), 276, '타원 = 관절 속도 원(1 rad/s)이', { c: 'q', s: 12 }), T(X(0), 294, '손끝에서 만드는 속도', { c: 'q', s: 12 }),
      ].join(''), '팔꿈치를 펼수록 손끝 속도 타원이 납작해지고 det J가 0으로 간다');
    },
    readout: ({ t2 }) => {
      const sn = Math.sin(t2 * D), r = Math.sqrt(164 + 160 * Math.cos(t2 * D));
      const top = `<div><b>det J</b> = 80 sin θ₂ = <b>${f1(80 * sn)}</b></div>`;
      if (Math.abs(sn) < 1e-9) return top + `<div>특이점이다. 손끝을 팔 방향으로는 <b>움직일 수 없다</b>. 타원이 선분이 되었다.</div>`;
      const w = r / (80 * Math.abs(sn));
      return top + `<div>손끝을 받침에서 멀어지는 쪽으로 1 cm/s 보내려면 팔꿈치가 <b>${f2(w)} rad/s</b> <span class="q">(초당 ${Math.round(w / D)}°)</span>로 돌아야 한다.</div>`;
    },
  });
})();
