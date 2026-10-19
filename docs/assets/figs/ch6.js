// 6장 그림: 자코비안, 외적, 속도 전파
(function () {
  const { D, f1, f2, svg, T, L, A, C, joint, link, arc, interactive, sub, matrix2 } = FigKit;
  const FIG = window.FIG;

  // 종이 팔 (cm, 각도는 도로 받는다)
  const arm = (t1, t2) => {
    const a = t1 * D, b = (t1 + t2) * D, ex = 10 * Math.cos(a), ey = 10 * Math.sin(a);
    return { a, b, ex, ey, hx: ex + 8 * Math.cos(b), hy: ey + 8 * Math.sin(b) };
  };
  // 종이 팔의 자코비안 [[J11, J12], [J21, J22]]
  const jac = (t1, t2) => { const q = arm(t1, t2); return [[-q.hy, -8 * Math.sin(q.b)], [q.hx, 8 * Math.cos(q.b)]]; };
  // 화살표: 너무 짧으면 그리지 않는다
  const arrow = (id, x1, y1, x2, y2, c, w = 2.5, more = '') =>
    Math.hypot(x2 - x1, y2 - y1) < 7 ? '' : L(x1, y1, x2, y2, c, w, `${more} ${A(id, c)}`);
  const poly = (pts, c, w = 1.5, more = '') =>
    `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" class="s-${c}" stroke-width="${w}" ${more}/>`;
  // 3차원 → 화면 (정사영). psi: 바라보는 방위, el: 내려다보는 각(도), u: 1 단위의 px
  const cam = (psi, el, ox, oy, u) => {
    const p = psi * D, e = el * D, rx = [-Math.sin(p), Math.cos(p)], up = [-Math.sin(e) * Math.cos(p), -Math.sin(e) * Math.sin(p), Math.cos(e)];
    return (x, y, z) => [ox + u * (x * rx[0] + y * rx[1]), oy - u * (x * up[0] + y * up[1] + z * up[2])];
  };
  const add = (a, b, k = 1) => a.map((v, i) => v + k * b[i]);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dash = 'stroke-dasharray="4 4"';
  const cf = v => (v < 0 ? `(${f1(v)})` : f1(v));   // 음수 계수는 괄호로

  // 그림 6-1 관절의 작은 변화 → 손끝의 작은 변화
  FIG.fig6_1 = el => {
    const id = 'f61', bx = 268, by = 246, s = 9, S = (x, y) => [bx + s * x, by - s * y];
    const q0 = arm(30, 60), q1 = arm(42, 75);
    const E0 = S(q0.ex, q0.ey), H0 = S(q0.hx, q0.hy), E1 = S(q1.ex, q1.ey), H1 = S(q1.hx, q1.hy);
    const P0 = [78, 186], P1 = [114, 141];
    el.innerHTML += svg(id, [40, 248], [
      T(96, 58, '관절 공간', { a: 'middle', c: 'b' }),
      L(28, 226, 172, 226, 'axis', 1.25, A(id, 'axis')), L(28, 226, 28, 76, 'axis', 1.25, A(id, 'axis')),
      T(172, 246, 'θ₁', { a: 'end', c: 'q', s: 13 }), T(36, 84, 'θ₂', { c: 'q', s: 13 }),
      L(P0[0], P0[1], P0[0], 226, 'grid', 1, 'stroke-dasharray="3 3"'), L(P0[0], P0[1], 28, P0[1], 'grid', 1, 'stroke-dasharray="3 3"'),
      arrow(id, P0[0], P0[1], P1[0], P1[1], 'c2', 2.5),
      C(P0[0], P0[1], 6, 'f-c1', 0), T(P0[0] - 4, P0[1] + 24, '지금 θ', { a: 'middle', s: 13 }),
      T(P1[0] + 8, P1[1] - 6, 'δθ', { c: 'b', s: 15 }),
      L(184, 150, 226, 150, 'ink', 2, A(id, 'ink')), T(205, 138, 'J(θ)', { a: 'middle', c: 'b', s: 15 }),
      T(372, 58, '작업 공간', { a: 'middle', c: 'b' }),
      L(bx, by, 470, by, 'axis', 1, A(id, 'axis')), L(bx, by, bx, 66, 'axis', 1, A(id, 'axis')),
      T(466, by + 18, 'x', { a: 'end', c: 'q', s: 13 }), T(bx + 8, 76, 'y', { c: 'q', s: 13 }),
      L(bx, by, E1[0], E1[1], 'c2', 1.5, dash), L(E1[0], E1[1], H1[0], H1[1], 'c2', 1.5, dash), C(E1[0], E1[1], 5, 'f-none s-c2'),
      link(bx, by, E0[0], E0[1]), link(E0[0], E0[1], H0[0], H0[1]), joint(bx, by, 7), joint(E0[0], E0[1], 7),
      arc(bx, by, 34, 0, 30 * D, 'c1', 1.25), arc(bx, by, 50, 30 * D, 42 * D, 'c2', 2),
      T(bx + 52, by - 8, 'θ₁', { c: 'q', s: 13 }), T(bx + 34, by - 42, 'δθ₁', { a: 'end', c: 'b', s: 13 }),
      arrow(id, H0[0], H0[1], H1[0] + 4, H1[1] + 1, 'ink', 2.5), C(H0[0], H0[1], 5, 'f-c1', 0), C(H1[0], H1[1], 4, 'f-c2', 0),
      T(H0[0] + 12, H0[1] + 6, '손끝', { s: 13 }), T((H0[0] + H1[0]) / 2, H1[1] - 12, 'δx', { a: 'middle', c: 'b', s: 15 }),
    ].join(''), '관절의 작은 변화 델타 세타가 손끝의 작은 변화 델타 x를 만든다');
  };

  // 그림 6-2 편미분: 직사각형 넓이
  FIG.fig6_2 = el => {
    const id = 'f62', u = 34, x0 = 36, y0 = 210, a = 4, b = 3, da = 0.55, db = 0.55;
    const X = x0 + u * a, Y = y0 - u * b;
    el.innerHTML += svg(id, [52, 190], [
      `<rect x="${x0}" y="${Y}" width="${u * a}" height="${u * b}" class="f-tint s-axis" stroke-width="1.25"/>`,
      `<rect x="${X}" y="${Y}" width="${u * da}" height="${u * b}" class="f-c1 s-c1" fill-opacity="0.3" stroke-width="1.25"/>`,
      `<rect x="${x0}" y="${Y - u * db}" width="${u * a}" height="${u * db}" class="f-c2 s-c2" fill-opacity="0.3" stroke-width="1.25"/>`,
      `<rect x="${X}" y="${Y - u * db}" width="${u * da}" height="${u * db}" class="f-axis" fill-opacity="0.35"/>`,
      T(x0 + u * a / 2, y0 - u * b / 2 + 5, 'A = a × b', { a: 'middle', s: 14 }),
      T(x0 + u * a / 2, y0 + 20, 'a = 4', { a: 'middle', c: 'q', s: 13 }), T(x0 - 6, y0 - u * b / 2 + 5, 'b = 3', { a: 'end', c: 'q', s: 13 }),
      T(X + u * da / 2, y0 + 20, 'δa', { a: 'middle', c: 'b', s: 13 }), T(X + u * da + 6, Y - u * db / 2 + 5, 'δb', { c: 'b', s: 13 }),
      T(244, 80, '가로만 δa 늘리면', { c: 'b', s: 13 }), T(244, 99, '넓이가 b × δa 늘어난다', { s: 13 }), T(244, 118, '→ ∂A/∂a = b = 3', { s: 13 }),
      T(244, 150, '세로만 δb 늘리면', { c: 'b', s: 13 }), T(244, 169, '넓이가 a × δb 늘어난다', { s: 13 }), T(244, 188, '→ ∂A/∂b = a = 4', { s: 13 }),
      T(244, 220, '모서리 δa × δb는 아주 작아 버린다', { c: 'q', s: 12.5 }),
      L(236, 68, 236, 124, 'c1', 4), L(236, 138, 236, 194, 'c2', 4),
    ].join(''), '가로만 늘리면 넓이는 세로 길이만큼의 비율로 늘어난다');
  };

  // 그림 6-3 종이 팔의 자코비안 (슬라이더)
  const armSliders = [
    { key: 't1', label: '어깨 θ₁', min: 0, max: 180, unit: '°' },
    { key: 't2', label: '팔꿈치 θ₂', min: -150, max: 150, unit: '°' },
    { key: 'w1', label: '어깨 속도 θ̇₁', min: -1, max: 1, step: 0.1, unit: '' },
    { key: 'w2', label: '팔꿈치 속도 θ̇₂', min: -1, max: 1, step: 0.1, unit: '' },
  ];
  const armBase = (id, bx, by) => [
    L(44, by, 446, by, 'axis', 1, A(id, 'axis')), L(bx, by + 170, bx, 50, 'axis', 1, A(id, 'axis')),
    T(446, by + 18, 'x', { a: 'end', c: 'q', s: 13 }), T(bx + 8, 60, 'y', { c: 'q', s: 13 }),
  ].join('');
  const tipLabel = (H, P, txt, c) => {
    const dx = P[0] - H[0], dy = P[1] - H[1], n = Math.hypot(dx, dy);
    return n < 12 ? '' : T(P[0] + 14 * dx / n, P[1] + 14 * dy / n + 5, txt, { a: 'middle', c, s: 15 });
  };

  FIG.fig6_3 = el => interactive(el, {
    state: { t1: 30, t2: 60, w1: 0.5, w2: 1 },
    sliders: armSliders,
    draw: ({ t1, t2, w1, w2 }) => {
      const id = 'f63', s = 9, k = 6, bx = 240, by = 274, P = (x, y) => [bx + s * x, by - s * y];
      const q = arm(t1, t2), J = jac(t1, t2), E = P(q.ex, q.ey), H = P(q.hx, q.hy);
      const V = (vx, vy) => [H[0] + k * vx, H[1] - k * vy];
      const a1 = V(J[0][0] * w1, J[1][0] * w1), a2 = V(J[0][1] * w2, J[1][1] * w2);
      const sm = V(J[0][0] * w1 + J[0][1] * w2, J[1][0] * w1 + J[1][1] * w2);
      const r1 = Math.hypot(q.hx, q.hy), ph = Math.atan2(q.hy, q.hx);
      return svg(id, [40, 420], [
        armBase(id, bx, by),
        arc(bx, by, s * r1, ph - 0.55, ph + 0.55, 'c1', 1.25, dash),
        arc(E[0], E[1], s * 8, q.b - 0.8, q.b + 0.8, 'c2', 1.25, dash),
        link(bx, by, E[0], E[1], 'axis'), link(E[0], E[1], H[0], H[1], 'axis'), joint(bx, by), joint(E[0], E[1], 7),
        L(a1[0], a1[1], sm[0], sm[1], 'c2', 1, 'stroke-dasharray="3 3"'), L(a2[0], a2[1], sm[0], sm[1], 'c1', 1, 'stroke-dasharray="3 3"'),
        arrow(id, H[0], H[1], a1[0], a1[1], 'c1'), arrow(id, H[0], H[1], a2[0], a2[1], 'c2'),
        arrow(id, H[0], H[1], sm[0], sm[1], 'ink', 2.75), C(H[0], H[1], 5, 'f-ink', 0),
        tipLabel(H, sm, 'ẋ', 'b'),
        T(bx - 12, by + 22, '어깨', { a: 'end', c: 'q', s: 12.5 }),
      ].join(''), '손끝 속도는 자코비안 첫 열과 둘째 열을 관절 속도만큼 섞어 더한 것이다');
    },
    readout: ({ t1, t2, w1, w2 }) => {
      const J = jac(t1, t2), vx = J[0][0] * w1 + J[0][1] * w2, vy = J[1][0] * w1 + J[1][1] * w2;
      return `<div class="matrow"><b>J</b> = ${matrix2(f2(J[0][0]), f2(J[0][1]), f2(J[1][0]), f2(J[1][1]))}<span class="q">파란 열 = 어깨만 1 rad/s, 주황 열 = 팔꿈치만 1 rad/s일 때의 손끝 속도</span></div>` +
        `<div><b>ẋ</b> = ${cf(w1)} × <span class="c1">(${f2(J[0][0])}, ${f2(J[1][0])})</span> + ${cf(w2)} × <span class="c2">(${f2(J[0][1])}, ${f2(J[1][1])})</span> = <b>(${f2(vx)}, ${f2(vy)})</b> cm/s</div>`;
    },
  });

  // 그림 6-4 작을 때만 맞는다 (슬라이더)
  FIG.fig6_4 = el => interactive(el, {
    state: { d1: 20, d2: 20 },
    sliders: [{ key: 'd1', label: '어깨를 더 돌림 δθ₁', min: -30, max: 30, unit: '°' }, { key: 'd2', label: '팔꿈치를 더 돌림 δθ₂', min: -30, max: 30, unit: '°' }],
    draw: ({ d1, d2 }) => {
      const id = 'f64', s = 17, bx = 72, by = 330, P = (x, y) => [bx + s * x, by - s * y];
      const q0 = arm(30, 60), q1 = arm(30 + d1, 60 + d2), J = jac(30, 60), r1 = d1 * D, r2 = d2 * D;
      const E0 = P(q0.ex, q0.ey), H0 = P(q0.hx, q0.hy), E1 = P(q1.ex, q1.ey), H1 = P(q1.hx, q1.hy);
      const Pr = P(q0.hx + J[0][0] * r1 + J[0][1] * r2, q0.hy + J[1][0] * r1 + J[1][1] * r2);
      const path = [];
      for (let i = 0; i <= 24; i++) { const q = arm(30 + d1 * i / 24, 60 + d2 * i / 24); path.push(P(q.hx, q.hy)); }
      return svg(id, [24, 322], [
        L(bx, by, 466, by, 'axis', 1, A(id, 'axis')), L(bx, by, bx, 34, 'axis', 1, A(id, 'axis')),
        link(bx, by, E0[0], E0[1], 'axis', 10), link(E0[0], E0[1], H0[0], H0[1], 'axis', 10),
        link(bx, by, E1[0], E1[1], 'c1', 10), link(E1[0], E1[1], H1[0], H1[1], 'c1', 10),
        joint(bx, by, 7), joint(E0[0], E0[1], 6), joint(E1[0], E1[1], 6),
        poly(path, 'c1', 1.25, 'stroke-dasharray="3 3"'),
        L(H1[0], H1[1], Pr[0], Pr[1], 'ink', 1, 'stroke-dasharray="2 3"'),
        arrow(id, H0[0], H0[1], H1[0], H1[1], 'c1', 2.5), arrow(id, H0[0], H0[1], Pr[0], Pr[1], 'c2', 2.5),
        C(H0[0], H0[1], 5, 'f-ink', 0), C(H1[0], H1[1], 4, 'f-c1', 0),
        L(262, 46, 290, 46, 'c1', 2.5), T(298, 51, '실제로 옮겨 간 손끝', { s: 13 }),
        L(262, 70, 290, 70, 'c2', 2.5), T(298, 75, '예측: 처음 자세의 J × δθ', { s: 13 }),
      ].join(''), '관절을 많이 돌릴수록 자코비안 예측과 실제 이동이 벌어진다');
    },
    readout: ({ d1, d2 }) => {
      const q0 = arm(30, 60), q1 = arm(30 + d1, 60 + d2), J = jac(30, 60), r1 = d1 * D, r2 = d2 * D;
      const ax = q1.hx - q0.hx, ay = q1.hy - q0.hy, px = J[0][0] * r1 + J[0][1] * r2, py = J[1][0] * r1 + J[1][1] * r2;
      const err = Math.hypot(ax - px, ay - py), n = Math.hypot(ax, ay);
      return `<div>δθ = (${f2(r1)}, ${f2(r2)}) rad</div>` +
        `<div><span class="c1">실제 δx</span> = (${f2(ax)}, ${f2(ay)}) cm · <span class="c2">예측 J δθ</span> = (${f2(px)}, ${f2(py)}) cm</div>` +
        `<div>차이 <b>${f2(err)} cm</b>` + (n > 0.01 ? ` <span class="q">(실제 이동 거리의 ${Math.round(100 * err / n)}%)</span>` : '') + '</div>';
    },
  });

  // 그림 6-5 Scheinman 팔의 손목점과 위치 자코비안의 세 열
  FIG.fig6_5 = el => {
    const id = 'f65', P = cam(-15, 38, 96, 286, 24), p = v => P(v[0], v[1], v[2]);
    const t1 = 30 * D, t2 = 55 * D, d2 = 3, d3 = 10, c1 = Math.cos(t1), s1 = Math.sin(t1), c2 = Math.cos(t2), s2 = Math.sin(t2);
    const Sh = [-s1 * d2, c1 * d2, 0], z3 = [c1 * s2, s1 * s2, c2], W = add(Sh, z3, d3), y1 = [-s1, c1, 0];
    const col1 = [-W[1], W[0], 0], col2 = [c1 * c2 * d3, s1 * c2 * d3, -s2 * d3], g = 0.34;
    const O = p([0, 0, 0]), Sp = p(Sh), M = p(add(Sh, z3, 5.2)), Wp = p(W);
    const T1 = p(add(W, col1, g)), T2 = p(add(W, col2, g)), T3 = p(add(W, z3, 3.2));
    const R = Math.hypot(W[0], W[1]), fw = Math.atan2(W[1], W[0]), circ1 = [], circ2 = [];
    for (let i = -12; i <= 12; i++) { const f = fw + 0.022 * i; circ1.push(p([R * Math.cos(f), R * Math.sin(f), W[2]])); }
    for (let i = -12; i <= 12; i++) { const t = t2 + 0.02 * i; circ2.push(p(add(Sh, [c1 * Math.sin(t) * d3, s1 * Math.sin(t) * d3, Math.cos(t) * d3]))); }
    const ext = p(add(W, z3, 4.2)), foot = p([0, 0, -2.6]), zt = p([0, 0, 7.6]), shA = p(add(Sh, y1, 1.8)), shB = p(add(Sh, y1, -1.2));
    const t1a = p([0, 0, 6.2]);
    el.innerHTML += svg(id, [96, 334], [
      `<rect x="${O[0] - 16}" y="${O[1] + 6}" width="32" height="${foot[1] - O[1] - 6}" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(O[0], O[1], zt[0], zt[1], 'axis', 1.25, `${dash} ${A(id, 'axis')}`), T(zt[0] + 8, zt[1] + 6, sub('z', '0'), { c: 'q', s: 13 }),
      `<ellipse cx="${t1a[0]}" cy="${t1a[1]}" rx="16" ry="6" fill="none" class="s-axis" stroke-width="1.25"/>`,
      T(t1a[0] - 22, t1a[1] + 5, 'θ₁', { a: 'end', c: 'q', s: 13 }),
      L(shB[0], shB[1], shA[0], shA[1], 'axis', 1, 'stroke-dasharray="3 3"'), T(shA[0] + 4, shA[1] - 4, '어깨 축', { c: 'q', s: 12.5 }),
      link(O[0], O[1], Sp[0], Sp[1], 'axis', 10), T((O[0] + Sp[0]) / 2 + 2, (O[1] + Sp[1]) / 2 + 24, sub('d', '2'), { a: 'middle', c: 'q', s: 13 }),
      link(Sp[0], Sp[1], M[0], M[1], 'axis', 16), link(M[0], M[1], Wp[0], Wp[1], 'axis', 8), joint(O[0], O[1], 7), joint(Sp[0], Sp[1], 8),
      T(Sp[0] + 2, Sp[1] + 26, 'θ₂', { a: 'middle', c: 'q', s: 13 }), T((M[0] + Wp[0]) / 2, (M[1] + Wp[1]) / 2 + 24, sub('d', '3'), { a: 'middle', c: 'q', s: 13 }),
      L(Wp[0], Wp[1], ext[0], ext[1], 'ink', 1, 'stroke-dasharray="3 3"'),
      poly(circ1, 'c1', 1.25, dash), poly(circ2, 'c2', 1.25, dash),
      arrow(id, Wp[0], Wp[1], T1[0], T1[1], 'c1', 2.5), arrow(id, Wp[0], Wp[1], T2[0], T2[1], 'c2', 2.5), arrow(id, Wp[0], Wp[1], T3[0], T3[1], 'ink', 2.5),
      C(Wp[0], Wp[1], 6, 'f-ink', 0), T(Wp[0] - 14, Wp[1] - 8, '손목점', { a: 'end', c: 'b', s: 13 }),
      T(T1[0] + 2, T1[1] - 8, '①', { a: 'middle', c: 'b', s: 15 }), T(T2[0] + 14, T2[1] + 4, '②', { c: 'b', s: 15 }), T(T3[0] + 8, T3[1] + 6, '③', { c: 'b', s: 15 }),
      L(150, 372, 174, 372, 'c1', 2.5), T(182, 377, '① θ₁만: 받침 축 둘레로 수평으로 돈다', { s: 13 }),
      L(150, 396, 174, 396, 'c2', 2.5), T(182, 401, '② θ₂만: 어깨 축 둘레로 숙인다', { s: 13 }),
      L(150, 420, 174, 420, 'ink', 2.5), T(182, 425, '③ d₃만: 팔 방향으로 뻗는다', { s: 13 }),
    ].join(''), '스탠퍼드 Scheinman 팔의 손목점은 앞의 세 관절로만 움직인다');
  };

  // 그림 6-6 극좌표: 같은 속도, 다른 각속도
  FIG.fig6_6 = el => {
    const id = 'f66', ox = 30, oy = 206, u = 54, rs = [1, 2, 4, 8], lab = ['1.0', '0.50', '0.25', '0.13'];
    const b = [
      L(ox, oy, 472, oy, 'axis', 1.25, A(id, 'axis')), C(ox, oy, 5, 'f-ink', 0), T(ox, oy + 24, '받침', { a: 'middle', c: 'q', s: 12.5 }),
      T(16, 62, '점 위의 숫자: 방향 각이 바뀌는 빠르기 φ̇ (rad/s)', { c: 'b', s: 13.5 }),
      T(16, 82, '점선: 1초 동안 곧게 갔을 때 받침에서 본 방향', { c: 'q', s: 12.5 }),
    ];
    rs.forEach((r, i) => {
      const x = ox + u * r;
      b.push(L(ox, oy, x, oy - u, 'axis', 1, 'stroke-dasharray="3 4"'),
        arrow(id, x, oy, x, oy - u, 'c1', 2.5), C(x, oy, 5, 'f-c1', 0),
        T(x, oy - u - 12, lab[i], { a: 'middle', c: 'b', s: 14 }), T(x, oy + 22, `r = ${r}`, { a: 'middle', c: 'q', s: 12.5 }));
    });
    el.innerHTML += svg(id, [44, 192], b.join(''), '같은 속도로 움직여도 받침에 가까울수록 방향 각은 빨리 바뀐다');
  };

  // 그림 6-7 도는 물체 위의 점: v = ω × p
  FIG.fig6_7 = el => {
    const id = 'f67', P = cam(-20, 20, 190, 268, 46), p = v => P(v[0], v[1], v[2]);
    const R = 2.3, h = 2.6, t = 25 * D, Pt = [R * Math.cos(t), R * Math.sin(t), h], F = [0, 0, h], w = [0, 0, 1];
    const v = cross(w, Pt), vn = Math.hypot(v[0], v[1]), Vt = add(Pt, v, 1.25 / vn);
    const O = p([0, 0, 0]), Pp = p(Pt), Fp = p(F), Vp = p(Vt), top = p([0, 0, 4.6]), bot = p([0, 0, -0.8]), Wt = p([0, 0, 1.7]), Q = p([0, 0, 3.8]);
    const ring = [];
    for (let i = 0; i <= 48; i++) { const f = 2 * Math.PI * i / 48; ring.push(p([R * Math.cos(f), R * Math.sin(f), h])); }
    const ang = Math.atan2(R, h), phiArc = [];
    for (let i = 0; i <= 10; i++) { const f = ang * i / 10; phiArc.push(p([0.7 * Math.sin(f) * Math.cos(t), 0.7 * Math.sin(f) * Math.sin(t), 0.7 * Math.cos(f)])); }
    el.innerHTML += svg(id, [44, 256], [
      L(bot[0], bot[1], top[0], top[1], 'axis', 1.25, dash), T(top[0] + 8, top[1] + 4, '회전축', { c: 'q', s: 12.5 }),
      poly(ring, 'axis', 1.25, 'stroke-dasharray="5 4"'),
      L(Fp[0], Fp[1], Pp[0], Pp[1], 'axis', 1.25), C(Fp[0], Fp[1], 3, 'f-axis', 0),
      T((Fp[0] + Pp[0]) / 2 + 4, (Fp[1] + Pp[1]) / 2 - 14, '|p| sin φ', { a: 'middle', c: 'q', s: 12.5 }),
      L(O[0], O[1], Wt[0], Wt[1], 'c2', 3, A(id, 'c2')), T(Wt[0] - 10, Wt[1] + 18, 'ω', { a: 'end', c: 'b', s: 16 }),
      L(O[0], O[1], Pp[0] - 3, Pp[1] + 4, 'c1', 2.5, A(id, 'c1')), T((O[0] + Pp[0]) / 2 + 12, (O[1] + Pp[1]) / 2 + 12, 'p', { c: 'b', s: 16 }),
      poly(phiArc, 'axis', 1.25), T(O[0] + 6, O[1] - 40, 'φ', { c: 'q', s: 13 }),
      arrow(id, Pp[0], Pp[1], Vp[0], Vp[1], 'ink', 3), T(Vp[0] + 8, Vp[1] + 5, 'v = ω × p', { c: 'b', s: 15 }),
      C(O[0], O[1], 5, 'f-ink', 0), T(O[0] - 12, O[1] + 6, 'O', { a: 'end', c: 'b', s: 14 }),
      C(Pp[0], Pp[1], 6, 'f-c1', 0), T(Pp[0] + 4, Pp[1] + 24, 'P', { c: 'b', s: 14 }),
      C(Q[0], Q[1], 4, 'f-none s-ink'), T(Q[0] - 10, Q[1] + 5, '축 위의 점: 속도 0', { a: 'end', c: 'q', s: 12.5 }),
    ].join(''), '축 둘레로 도는 물체 위의 점은 축에서 멀수록 빠르고 오메가와 p 모두에 수직으로 움직인다');
  };

  // 그림 6-8 외적과 오른손 법칙
  FIG.fig6_8 = el => {
    const id = 'f68', P = cam(-10, 40, 120, 252, 40), p = v => P(v[0], v[1], v[2]);
    const aa = 20 * D, bb = 80 * D, la = 2.6, lb = 2.2;
    const a = [la * Math.cos(aa), la * Math.sin(aa), 0], b = [lb * Math.cos(bb), lb * Math.sin(bb), 0], c = cross(a, b);
    const O = p([0, 0, 0]), Ap = p(a), Bp = p(b), AB = p(add(a, b)), Cp = p(c), Fl = p([1.3 * Math.cos(50 * D), 1.3 * Math.sin(50 * D), 0]);
    const sweep = [];
    for (let i = 0; i <= 14; i++) { const f = aa + 0.12 + (bb - aa - 0.3) * i / 14; sweep.push(p([0.85 * Math.cos(f), 0.85 * Math.sin(f), 0])); }
    el.innerHTML += svg(id, [70, 272], [
      `<polygon points="${[O, Ap, AB, Bp].map(q => q.join(',')).join(' ')}" class="f-c1 s-grid" fill-opacity="0.14" stroke-width="1"/>`,
      L(O[0], O[1], Ap[0], Ap[1], 'c1', 2.5, A(id, 'c1')), L(O[0], O[1], Bp[0], Bp[1], 'c2', 2.5, A(id, 'c2')),
      L(O[0], O[1], Cp[0], Cp[1], 'ink', 3, A(id, 'ink')),
      poly(sweep, 'axis', 1.5, A(id, 'axis')),
      T(Ap[0] - 8, Ap[1] + 4, 'a', { a: 'end', c: 'b', s: 16 }), T(Bp[0] + 10, Bp[1] - 6, 'b', { c: 'b', s: 16 }),
      T(Cp[0] + 12, Cp[1] + 10, 'a × b', { c: 'b', s: 16 }), T(Fl[0], Fl[1] + 5, 'φ', { a: 'middle', c: 'q', s: 13 }),
      T(290, 96, '방향: a와 b 모두에 수직', { s: 13 }),
      T(290, 116, '오른손 네 손가락을 a에서', { c: 'q', s: 12.5 }), T(290, 134, 'b 쪽으로 감으면 엄지 쪽', { c: 'q', s: 12.5 }),
      T(290, 172, '길이: |a| |b| sin φ', { s: 13 }), T(290, 192, '= 파란 평행사변형의 넓이', { c: 'q', s: 12.5 }),
      T(290, 230, '순서를 바꾸면 반대쪽:', { s: 13 }), T(290, 250, 'b × a = −(a × b)', { c: 'q', s: 12.5 }),
    ].join(''), '외적 a 곱하기 b는 두 화살표에 수직이고 길이는 평행사변형 넓이다');
  };

  // 그림 6-9 속도 전파 (슬라이더)
  FIG.fig6_9 = el => interactive(el, {
    state: { t1: 30, t2: 60, w1: 0.5, w2: 1 },
    sliders: armSliders,
    draw: ({ t1, t2, w1, w2 }) => {
      const id = 'f69', s = 9, k = 6, bx = 240, by = 274, P = (x, y) => [bx + s * x, by - s * y];
      const q = arm(t1, t2), E = P(q.ex, q.ey), H = P(q.hx, q.hy), w12 = w1 + w2;
      const v2 = [-w1 * q.ey, w1 * q.ex], rx = q.hx - q.ex, ry = q.hy - q.ey, u2 = [-w12 * ry, w12 * rx];
      const Ev = [E[0] + k * v2[0], E[1] - k * v2[1]], Hv = [H[0] + k * v2[0], H[1] - k * v2[1]], Hs = [Hv[0] + k * u2[0], Hv[1] - k * u2[1]];
      const spin = (x, y, ang, w, c) => {
        if (Math.abs(w) < 0.05) return '';
        const half = Math.min(1.3, 0.75 * Math.abs(w)), f = w > 0 ? ang - half : ang + half, t = w > 0 ? ang + half : ang - half;
        return arc(x, y, 22, f, t, c, 1.75, A(id, c));
      };
      const out = q.a - (w1 < 0 ? -1 : 1) * Math.PI / 2;   // v₂와 반대쪽
      return svg(id, [40, 420], [
        armBase(id, bx, by),
        link(bx, by, E[0], E[1], 'axis'), link(E[0], E[1], H[0], H[1], 'axis'), joint(bx, by), joint(E[0], E[1], 7),
        spin(bx, by, q.a + Math.PI, w1, 'c1'), spin(E[0], E[1], out, w12, 'c2'),
        arrow(id, E[0], E[1], Ev[0], Ev[1], 'c1', 2.5),
        arrow(id, H[0], H[1], Hv[0], Hv[1], 'c1', 1.75, 'stroke-dasharray="5 4"'), arrow(id, Hv[0], Hv[1], Hs[0], Hs[1], 'c2', 2.5),
        arrow(id, H[0], H[1], Hs[0], Hs[1], 'ink', 2.75), C(H[0], H[1], 5, 'f-ink', 0),
        Math.hypot(Ev[0] - E[0], Ev[1] - E[1]) < 12 ? '' : T((E[0] + Ev[0]) / 2 + 16 * Math.cos(q.a), (E[1] + Ev[1]) / 2 - 16 * Math.sin(q.a) + 5, sub('v', '2'), { a: 'middle', c: 'b', s: 15 }),
        tipLabel(H, Hs, sub('v', '3'), 'b'),
      ].join(''), '팔꿈치 속도에 링크 2가 돌아서 생기는 몫을 더하면 손끝 속도가 된다');
    },
    readout: ({ t1, t2, w1, w2 }) => {
      const q = arm(t1, t2), w12 = w1 + w2, rx = q.hx - q.ex, ry = q.hy - q.ey;
      const v2 = [-w1 * q.ey, w1 * q.ex], u2 = [-w12 * ry, w12 * rx];
      return `<div>① 링크 1: ω₁ = θ̇₁ = <b>${f2(w1)}</b> rad/s → 팔꿈치 <span class="c1">v₂ = ω₁ × p₁₂ = (${f2(v2[0])}, ${f2(v2[1])})</span></div>` +
        `<div>② 링크 2: ω₂ = θ̇₁ + θ̇₂ = <b>${f2(w12)}</b> rad/s → <span class="c2">ω₂ × p₂₃ = (${f2(u2[0])}, ${f2(u2[1])})</span></div>` +
        `<div>③ 손끝 v₃ = v₂ + ω₂ × p₂₃ = <b>(${f2(v2[0] + u2[0])}, ${f2(v2[1] + u2[1])})</b> cm/s <span class="q">그림 6-3의 ẋ와 같다</span></div>`;
    },
  });
})();
