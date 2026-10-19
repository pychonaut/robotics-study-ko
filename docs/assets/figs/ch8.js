// 8장 그림: 특이점 다시 보기, 점 옮기기, resolved-rate 제어, 정적 힘
(function () {
  const { D, f1, f2, svg, T, L, A, AA, C, joint, link, arc, interactive, sub, matrix2 } = FigKit;
  const FIG = window.FIG;

  // 종이 팔 (cm)
  const fk = ([a, b]) => [10 * Math.cos(a) + 8 * Math.cos(a + b), 10 * Math.sin(a) + 8 * Math.sin(a + b)];
  const elbowOf = ([a]) => [10 * Math.cos(a), 10 * Math.sin(a)];
  const jac = ([a, b]) => {
    const s1 = Math.sin(a), c1 = Math.cos(a), s12 = Math.sin(a + b), c12 = Math.cos(a + b);
    return [[-10 * s1 - 8 * s12, -8 * s12], [10 * c1 + 8 * c12, 8 * c12]];
  };
  const solve2 = (M, [u, v]) => {               // M x = (u, v)
    const d = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    return [(M[1][1] * u - M[0][1] * v) / d, (-M[1][0] * u + M[0][0] * v) / d];
  };
  const ik = ([x, y]) => {                      // θ2 > 0 쪽
    const c2 = Math.max(-1, Math.min(1, (x * x + y * y - 164) / 160)), t2 = Math.acos(c2);
    return [Math.atan2(y, x) - Math.atan2(8 * Math.sin(t2), 10 + 8 * Math.cos(t2)), t2];
  };
  const nrm = ([x, y]) => { const n = Math.hypot(x, y) || 1; return [x / n, y / n]; };
  const poly = (pts, cls, w = 1.25, more = '') => `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" class="${cls}" stroke-width="${w}" fill="none" ${more}/>`;
  const base = (x, y, w = 32) => `<rect x="${x - w / 2}" y="${y + 9}" width="${w}" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`;
  const outDot = (x, y, r = 7) => C(x, y, r, 'f-tint s-ink', 1.5) + C(x, y, 2.3, 'f-ink', 0);
  // 축에 수직인 고리 (회전 관절 표시): 화면 각 ang(도, 수학 방향)으로 놓인 축 둘레
  const ring = (x, y, ang, ry, cls) => `<ellipse cx="${x}" cy="${y}" rx="${ry * 0.32}" ry="${ry}" transform="rotate(${-ang} ${x} ${y})" class="f-none ${cls}" stroke-width="1.75"/>`;
  // 굽은 화살표: 가운데 각 mid(라디안)에서 span만큼, 부호대로 (+면 반시계)
  const turn = (id, x, y, r, mid, span, c, w = 2.25) => {
    if (Math.abs(span) < 0.05) return '';
    const a0 = mid - span / 2, a1 = mid + span / 2;
    return arc(x, y, r, a0, a1, c, w, A(id, c));
  };

  // 그림 8-1 스탠퍼드 팔의 손목 특이점 (슬라이더)
  FIG.fig8_1 = el => interactive(el, {
    state: { t5: 30 },
    sliders: [{ key: 't5', label: '손목 θ₅', min: -75, max: 75, unit: '°' }],
    draw: ({ t5 }) => {
      const id = 'f81', W = [230, 176], r = t5 * D, d = [Math.cos(r), -Math.sin(r)], ns = [Math.sin(r), Math.cos(r)];
      const at = k => [W[0] + k * d[0], W[1] + k * d[1]];
      const H = at(100), R6 = at(60), sing = t5 === 0, side = t5 >= 0 ? -1 : 1;
      const fing = s => { const b = [H[0] + s * 10 * ns[0], H[1] + s * 10 * ns[1]]; return L(H[0], H[1], b[0], b[1], 'c2', 3, 'stroke-linecap="round"') + L(b[0], b[1], b[0] + 14 * d[0], b[1] + 14 * d[1], 'c2', 3, 'stroke-linecap="round"'); };
      const z6a = at(120), z6b = at(140), z6l = [z6b[0] - 16 * ns[0], z6b[1] - 16 * ns[1]];
      const b = [
        // 잃기 쉬운 축 n (세로)
        L(W[0], 40, W[0], 316, sing ? 'c2' : 'axis', sing ? 2 : 1.25, 'stroke-dasharray="6 5"'),
        T(W[0] - 10, 52, 'n = ' + sub('z', '5') + ' × ' + sub('z', '4'), { a: 'end', c: sing ? 'f-c2 b' : 'q', s: 13 }),
        sing ? T(W[0] - 10, 72, '이 축으로는 못 돈다', { a: 'end', c: 'f-c2 b', s: 12.5 }) : T(W[0] - 10, 72, '이 축으로 돌기가 어렵다', { a: 'end', c: 'q', s: 12.5 }),
        // 붐과 축 z4
        L(54, 176, 456, 176, 'ink', 1.25, 'stroke-dasharray="3 4" ' + A(id, 'ink')),
        T(456, 164, sub('z', '4'), { a: 'end', s: 14 }),
        link(36, 176, 214, 176, 'axis', 18),
        T(70, 210, '붐', { a: 'middle', c: 'q', s: 12.5 }),
        ring(150, 176, 0, 22, 's-c1'), T(150, 144, '관절 4', { a: 'middle', c: 'f-c1 b', s: 12.5 }),
        // 손과 축 z6
        link(W[0], W[1], H[0], H[1], 'c2', 10), fing(1), fing(-1),
        L(z6a[0], z6a[1], z6b[0], z6b[1], 'c2', 1.5, 'stroke-dasharray="3 3" ' + A(id, 'c2')),
        T(z6l[0], z6l[1] + 5, sub('z', '6'), { a: 'middle', c: 'f-c2 b', s: 14 }),
        ring(R6[0], R6[1], t5, 20, 's-c2'),
        T(R6[0] + side * 46 * ns[0], R6[1] + side * 46 * ns[1] + 5, '관절 6', { a: 'middle', c: 'f-c2 b', s: 12.5 }),
        // 관절 5 (화면 밖으로 나오는 축)
        Math.abs(t5) >= 4 ? arc(W[0], W[1], 32, Math.min(0, r), Math.max(0, r), 'ink', 1.25) : '',
        Math.abs(t5) >= 20 ? T(W[0] + 44 * Math.cos(r / 2), W[1] - 44 * Math.sin(r / 2) + 5, 'θ₅', { a: 'middle', c: 'b', s: 13 }) : '',
        outDot(W[0], W[1], 12),
        T(W[0] - 22, W[1] + 40, '관절 5 · ' + sub('z', '5') + ' ⊙', { a: 'end', s: 12.5 }),
        sing ? T(452, 206, sub('z', '4') + '와 ' + sub('z', '6') + '이 한 줄', { a: 'end', c: 'f-c2 b', s: 13 }) : '',
      ];
      return svg(id, [24, 300], b.join(''), '손목 관절 5를 0으로 펴면 축 4와 축 6이 한 줄이 되어 한 축으로는 돌 수 없다');
    },
    readout: ({ t5 }) => {
      const s = Math.sin(t5 * D), c = Math.cos(t5 * D);
      const top = `<div><b>z₄와 z₆ 사이의 각</b> = ${Math.abs(t5)}° <span class="q">손목 덩어리의 det = −sin θ₅ = ${f2(-s)}</span></div>`;
      if (t5 === 0) return top + `<div><b class="c2">특이점</b>: 관절 4와 6이 같은 축으로 돈다. 손을 축 n으로는 어떤 관절 속도로도 돌릴 수 없다.</div>`;
      return top + `<div>손을 축 n으로 1 rad/s 돌리려면 <span class="c2">관절 6은 <b>${f2(1 / Math.abs(s))} rad/s</b></span>, <span class="c1">관절 4는 반대 방향으로 <b>${f2(Math.abs(c / s))} rad/s</b></span></div>`;
    },
  });

  // 그림 8-2 사람 팔 모양 6관절 팔의 세 가지 특이점 (옆모습)
  FIG.fig8_2 = el => {
    const id = 'f82', k = 5.6, sy = 236;
    const P = (xc, a2, a23) => {                 // 어깨, 팔꿈치, W (화면)
      const E = [xc + 10 * k * Math.cos(a2), sy - 10 * k * Math.sin(a2)];
      return { S: [xc, sy], E, W: [E[0] + 8 * k * Math.cos(a23), E[1] - 8 * k * Math.sin(a23)], u: [Math.cos(a23), -Math.sin(a23)] };
    };
    const stand = xc => [
      L(xc, 266, xc, 112, 'ink', 1.1, 'stroke-dasharray="3 4" ' + A(id, 'ink')), T(xc + 7, 122, sub('z', '1'), { s: 12.5 }),
      `<ellipse cx="${xc}" cy="${sy + 22}" rx="28" ry="7" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(xc, sy + 20, xc, sy + 6, 'axis', 8, 'stroke-linecap="round" stroke-opacity="0.5"'),
    ].join('');
    const arm = (g, hand) => link(g.S[0], g.S[1], g.E[0], g.E[1], 'axis', 9) + link(g.E[0], g.E[1], g.W[0], g.W[1], 'axis', 8) +
      (hand ? L(g.W[0], g.W[1], g.W[0] + hand * g.u[0], g.W[1] + hand * g.u[1], 'c2', 3.5, 'stroke-linecap="round"') : '') +
      joint(g.S[0], g.S[1], 6) + joint(g.E[0], g.E[1], 5.5);
    const foot = (x, l1, l2, l3) => T(x, 286, l1, { a: 'middle', c: 'b', s: 12.5 }) + T(x, 304, l2, { a: 'middle', s: 12.5 }) + T(x, 322, l3, { a: 'middle', c: 'q', s: 12.5 });
    // (가) 팔꿈치: 쭉 편 팔
    const a = P(28, 30 * D, 30 * D);
    const ar0 = [a.W[0] + 20 * a.u[0], a.W[1] + 20 * a.u[1]], ar1 = [a.W[0] + 42 * a.u[0], a.W[1] + 42 * a.u[1]], am = [(ar0[0] + ar1[0]) / 2, (ar0[1] + ar1[1]) / 2];
    const rim = [];
    for (let t = 6; t <= 56; t += 2) rim.push([28 + 18 * k * Math.cos(t * D), sy - 18 * k * Math.sin(t * D)]);
    // (나) 어깨: W가 z1 위 (θ2 = 60°, θ3 = 68.7°)
    const b = P(232, 60 * D, 128.68 * D);
    // (다) 손목: 축 4 = 축 6
    const c = P(352, 40 * D, -20 * D);
    const c0 = [c.E[0] + 6 * c.u[0], c.E[1] + 6 * c.u[1]], c1 = [c.W[0] + 34 * c.u[0], c.W[1] + 34 * c.u[1]];
    const r4 = [c.W[0] - 18 * c.u[0], c.W[1] - 18 * c.u[1]], r6 = [c.W[0] + 13 * c.u[0], c.W[1] + 13 * c.u[1]];
    el.innerHTML += svg(id, [78, 254], [
      T(80, 98, '(가) 팔꿈치', { a: 'middle', c: 'b', s: 15 }), T(240, 98, '(나) 어깨', { a: 'middle', c: 'b', s: 15 }), T(400, 98, '(다) 손목', { a: 'middle', c: 'b', s: 15 }),
      L(160, 108, 160, 326, 'grid', 1), L(320, 108, 320, 326, 'grid', 1),
      // (가)
      stand(28), poly(rim, 's-axis', 1.25, 'stroke-dasharray="2 4"'), arm(a, 14), C(a.W[0], a.W[1], 4.5, 'f-ink', 0),
      L(ar0[0], ar0[1], ar1[0], ar1[1], 'ink', 1.25, 'stroke-dasharray="3 3" ' + AA(id, 'ink')),
      L(am[0] - 6, am[1] - 6, am[0] + 6, am[1] + 6, 'c2', 2.25), L(am[0] - 6, am[1] + 6, am[0] + 6, am[1] - 6, 'c2', 2.25),
      T(a.W[0] - 4, a.W[1] + 22, 'W', { a: 'middle', c: 'b', s: 13 }),
      foot(80, 'θ₃ = 0°: 쭉 편 팔', '팔 방향으로 못 간다', '경계 특이점'),
      // (나)
      stand(232), arm(b, 14), C(b.W[0], b.W[1], 4.5, 'f-ink', 0),
      `<ellipse cx="${b.W[0]}" cy="${b.W[1] + 2}" rx="22" ry="6" class="f-none s-c1" stroke-width="1.5"/>`,
      L(b.W[0] + 4, b.W[1] + 8, b.W[0] - 4, b.W[1] + 8, 'c1', 1.5, A(id, 'c1')),
      T(b.W[0] + 28, b.W[1] + 6, 'W', { c: 'b', s: 13 }),
      T(b.W[0] + 28, b.W[1] - 26, '돌려도', { c: 'f-c1', s: 12.5 }), T(b.W[0] + 28, b.W[1] - 10, '제자리', { c: 'f-c1', s: 12.5 }),
      foot(240, 'r = 0: W가 축 위', '판에 수직으로 못 간다', '내부 특이점'),
      // (다)
      stand(352), L(c0[0], c0[1], c1[0], c1[1], 'c2', 1.25, 'stroke-dasharray="3 3"'),
      arm(c, 0), L(c.W[0], c.W[1], c.W[0] + 20 * c.u[0], c.W[1] + 20 * c.u[1], 'c2', 3.5, 'stroke-linecap="round"'),
      ring(r4[0], r4[1], -20, 12, 's-c1'), ring(r6[0], r6[1], -20, 12, 's-c2'), outDot(c.W[0], c.W[1], 5.5),
      T(r4[0] - 4, r4[1] - 18, '4', { a: 'middle', c: 'f-c1 b', s: 12.5 }), T(r6[0] + 4, r6[1] - 18, '6', { a: 'middle', c: 'f-c2 b', s: 12.5 }),
      T(c1[0] - 4, c1[1] + 22, sub('z', '4') + ' = ' + sub('z', '6'), { a: 'end', c: 'f-c2 b', s: 13 }),
      foot(400, 'θ₅ = 0°: 축 4·6 한 줄', '한 축으로 못 돈다', '내부 특이점'),
    ].join(''), '팔꿈치를 쭉 편 자세, 손목점이 돌림판 축 위에 온 자세, 손목 축 4와 6이 한 줄인 자세');
  };

  // 3관절 팔 (8, 7, 5 cm), θ = (0°, 90°, −90°): 관절 (0,0), (8,0), W (8,7), E (13,7)
  const arm3 = (ox, oy, s) => {
    const P = ([x, y]) => [ox + s * x, oy - s * y];
    const O = P([0, 0]), J = P([8, 0]), W = P([8, 7]), E = P([13, 7]);
    return {
      O, J, W, E, body: [base(O[0], O[1]), link(O[0], O[1], J[0], J[1], 'axis', 9), link(J[0], J[1], W[0], W[1], 'axis', 9),
        L(W[0], W[1], E[0], E[1], 'c2', 5, 'stroke-linecap="round" stroke-opacity="0.45"'), L(W[0], W[1], E[0], E[1], 'c2', 2),
        joint(O[0], O[1], 6.5), joint(J[0], J[1], 6), joint(W[0], W[1], 6)].join(''),
    };
  };

  // 그림 8-3 손목 속도 + ω × p = 손끝 속도
  FIG.fig8_3 = el => {
    const id = 'f83', g = arm3(60, 310, 15), k = 8;
    const { W, E } = g, vW = [-7 * k, -4 * k], Wt = [W[0] + vW[0], W[1] + vW[1]], Ec = [E[0] + vW[0], E[1] + vW[1]], Et = [Ec[0], Ec[1] - 5 * k];
    el.innerHTML += svg(id, [104, 236], [
      g.body,
      arc(W[0], W[1], 24, 195 * D, 250 * D, 'ink', 1.5, A(id, 'ink')), T(W[0] - 44, W[1] + 50, 'ω = 1 rad/s', { a: 'middle', s: 12.5 }),
      T((W[0] + E[0]) / 2 + 10, W[1] + 24, sub('p', 'WE'), { a: 'middle', c: 'f-c2 b', s: 13 }),
      L(W[0], W[1], Wt[0], Wt[1], 'c1', 2.5, A(id, 'c1')), T(Wt[0] - 6, Wt[1] - 4, sub('v', 'W'), { a: 'end', c: 'f-c1 b', s: 14 }),
      L(E[0], E[1], Ec[0], Ec[1], 'c1', 1.5, 'stroke-dasharray="4 3" ' + A(id, 'c1')),
      L(Ec[0], Ec[1], Et[0], Et[1], 'c2', 2.5, A(id, 'c2')), T(Ec[0] - 10, Et[1] + 14, 'ω × ' + sub('p', 'WE'), { a: 'end', c: 'f-c2 b', s: 13 }),
      L(E[0], E[1], Et[0], Et[1], 'ink', 2.75, A(id, 'ink')), T(Et[0] + 4, Et[1] - 8, sub('v', 'E'), { a: 'middle', c: 'b', s: 14 }),
      C(W[0], W[1], 3, 'f-ink', 0), C(E[0], E[1], 5, 'f-ink', 0),
      T(W[0] + 8, W[1] + 20, 'W', { c: 'b', s: 13 }), T(E[0] + 10, E[1] + 5, 'E', { c: 'b', s: 13 }),
      T(300, 150, sub('v', 'W') + ' = (−7, 4)', { c: 'f-c1 b', s: 13 }),
      T(300, 176, 'ω × ' + sub('p', 'WE') + ' = (0, 5)', { c: 'f-c2 b', s: 13 }),
      T(300, 202, sub('v', 'E') + ' = (−7, 9) cm/s', { c: 'b', s: 13 }),
      T(300, 234, sub('p', 'WE') + ' = (5, 0) cm', { c: 'q', s: 12.5 }),
      T(300, 254, '화살표 1 cm/s = 8칸', { c: 'q', s: 12.5 }),
    ].join(''), '손목 속도에 손이 도는 몫 오메가 곱하기 p를 더하면 손끝 속도가 된다');
  };

  // 그림 8-4 resolved-rate 걸음: 속도만 더하기 vs 다시 재기 (슬라이더)
  const A4 = [14, 4], B4 = [-2, 12];
  const walk = (N, remeasure) => {
    let q = ik(A4);
    const pts = [fk(q)];
    for (let k = 0; k < N; k++) {
      const x = fk(q), tgt = [A4[0] + (B4[0] - A4[0]) * (k + 1) / N, A4[1] + (B4[1] - A4[1]) * (k + 1) / N];
      const dx = remeasure ? [tgt[0] - x[0], tgt[1] - x[1]] : [(B4[0] - A4[0]) / N, (B4[1] - A4[1]) / N];
      const dq = solve2(jac(q), dx);
      q = [q[0] + dq[0], q[1] + dq[1]];
      pts.push(fk(q));
    }
    return pts;
  };
  FIG.fig8_4 = el => interactive(el, {
    state: { n: 8 },
    sliders: [{ key: 'n', label: '걸음 수', min: 4, max: 32, unit: '번' }],
    draw: ({ n }) => {
      const id = 'f84', s = 16, bx = 94, by = 230, P = ([x, y]) => [bx + s * x, by - s * y];
      const q0 = ik(A4), e0 = P(elbowOf(q0)), h0 = P(fk(q0)), pa = P(A4), pb = P(B4);
      const open = walk(n, false).map(P), shut = walk(n, true).map(P);
      const dots = (pts, c) => pts.map((p, i) => C(p[0], p[1], i === pts.length - 1 ? 5 : 3.2, c, 0)).join('');
      return svg(id, [14, 286], [
        L(24, by, 340, by, 'grid', 1, A(id, 'axis')), L(bx, 294, bx, 22, 'grid', 1, A(id, 'axis')),
        T(338, by + 18, sub('x', '0'), { a: 'end', c: 'q', s: 12.5 }), T(bx + 8, 32, sub('y', '0'), { c: 'q', s: 12.5 }),
        base(bx, by), link(bx, by, e0[0], e0[1], 'axis', 8), link(e0[0], e0[1], h0[0], h0[1], 'axis', 8), joint(bx, by, 6), joint(e0[0], e0[1], 5),
        L(pa[0], pa[1], pb[0], pb[1], 'ink', 1.5, 'stroke-dasharray="6 4"'),
        poly(open, 's-c2', 1.5), poly(shut, 's-c1', 1.5), dots(open, 'f-c2'), dots(shut, 'f-c1'),
        C(pa[0], pa[1], 5.5, 'f-none s-ink', 1.5), C(pb[0], pb[1], 5.5, 'f-none s-ink', 1.5),
        T(pa[0] + 10, pa[1] + 18, 'A', { c: 'b', s: 13 }), T(pb[0] - 10, pb[1] - 8, 'B', { a: 'end', c: 'b', s: 13 }),
        C(356, 160, 5, 'f-c2', 0), T(368, 165, '속도만 더하기', { s: 13 }),
        C(356, 186, 5, 'f-c1', 0), T(368, 191, '다시 재기', { s: 13 }),
        L(348, 212, 364, 212, 'ink', 1.5, 'stroke-dasharray="6 4"'), T(368, 217, '목표 직선', { s: 13 }),
      ].join(''), '손끝 위치를 다시 재며 걸으면 걸음이 커도 목표 직선을 지킨다');
    },
    readout: ({ n }) => {
      const eo = Math.hypot(...walk(n, false)[n].map((v, i) => v - B4[i])), ec = Math.hypot(...walk(n, true)[n].map((v, i) => v - B4[i]));
      return `<div><b>걸음 ${n}번</b> · Δt = 8/${n} = ${f2(8 / n)} s</div>` +
        `<div><span class="dot c2">●</span> 속도만 더하기: 끝에서 <b>${f2(eo)} cm</b> 빗나감 · <span class="dot c1">●</span> 다시 재기: <b>${ec.toFixed(3)} cm</b></div>`;
    },
  });

  // 그림 8-5 경계로 가는 직선과 관절 속도, 감쇠 최소제곱 (슬라이더)
  const X5 = 10, Y5 = 5, T5 = 7.29, K5 = 4, cache5 = {};
  const sim5 = lam => {
    const key = lam.toFixed(2);
    if (cache5[key]) return cache5[key];
    const out = [];
    if (lam === 0) {
      for (let i = 0; i <= 729; i++) {
        const t = i / 100, q = ik([X5 + t, Y5]), qd = solve2(jac(q), [1, 0]);
        out.push({ t, q, qd, err: 0 });
      }
    } else {
      let q = ik([X5, Y5]);
      const dt = 0.002, n = Math.round(T5 / dt);
      for (let i = 0; i <= n; i++) {
        const t = i * dt, x = fk(q), J = jac(q), u = [1 + K5 * (X5 + t - x[0]), K5 * (Y5 - x[1])];
        const M = [[J[0][0] ** 2 + J[0][1] ** 2 + lam * lam, J[0][0] * J[1][0] + J[0][1] * J[1][1]],
          [J[0][0] * J[1][0] + J[0][1] * J[1][1], J[1][0] ** 2 + J[1][1] ** 2 + lam * lam]];
        const w = solve2(M, u), qd = [J[0][0] * w[0] + J[1][0] * w[1], J[0][1] * w[0] + J[1][1] * w[1]];
        if (i % 5 === 0) out.push({ t: Math.round(t * 100) / 100, q: q.slice(), qd, err: Math.hypot(X5 + t - x[0], Y5 - x[1]) });
        q = [q[0] + qd[0] * dt, q[1] + qd[1] * dt];
      }
    }
    return (cache5[key] = out);
  };
  FIG.fig8_5 = el => interactive(el, {
    state: { t: 6, lam: 0 },
    sliders: [{ key: 't', label: '시간 t', min: 0, max: 7.29, step: 0.01, unit: ' s' }, { key: 'lam', label: '감쇠 λ', min: 0, max: 2, step: 0.1, unit: ' cm' }],
    draw: ({ t, lam }) => {
      const id = 'f85', s = 17, bx = 36, by = 150, P = ([x, y]) => [bx + s * x, by - s * y];
      const ref = sim5(0), cur = sim5(lam), i = Math.min(cur.length - 1, Math.round(t * 100)), now = cur[i];
      const E = P(elbowOf(now.q)), H = P(fk(now.q)), Xd = P([X5 + t, Y5]);
      const rim = [];
      for (let a = -14; a <= 22; a += 1) rim.push([bx + 18 * s * Math.cos(a * D), by - 18 * s * Math.sin(a * D)]);
      // 그래프
      const X0 = 62, X1 = 446, Y0 = 400, top = 2, ky = 72, X = tt => X0 + (X1 - X0) * tt / T5, Y = v => Y0 - ky * Math.min(top, Math.abs(v));
      const curve = (data, j) => data.map(d => [X(d.t), Y(d.qd[j])]);
      const faint = lam > 0 ? 'stroke-opacity="0.35"' : '';
      const b = [
        poly(rim, 's-axis', 1.25, 'stroke-dasharray="2 4"'), T(350, 112, '닿는 영역의 끝', { c: 'q', s: 12.5 }), T(350, 130, '(18 cm)', { c: 'q', s: 12.5 }),
        L(24, by, 360, by, 'grid', 1), base(bx, by),
        L(P([X5, Y5])[0], P([X5, Y5])[1], P([X5 + T5, Y5])[0], P([X5 + T5, Y5])[1], 'ink', 1.5, 'stroke-dasharray="6 4"'),
        T(P([X5, Y5])[0] - 8, P([X5, Y5])[1] + 5, '출발', { a: 'end', c: 'q', s: 12.5 }),
        link(bx, by, E[0], E[1], 'axis', 9), link(E[0], E[1], H[0], H[1], 'axis', 9), joint(bx, by, 6.5), joint(E[0], E[1], 5.5),
        C(Xd[0], Xd[1], 6, 'f-none s-ink', 1.25), C(H[0], H[1], 4.5, 'f-c1', 0),
        T(E[0] + 10, E[1] + 20, 'θ₂ = ' + f1(now.q[1] / D) + '°', { c: 'b', s: 13 }),
        // 축
        L(X0, Y0, X1 + 8, Y0, 'axis', 1.25), L(X0, Y0, X0, Y0 - ky * top - 10, 'axis', 1.25),
        L(X0, Y0 - ky, X1, Y0 - ky, 'grid', 1, 'stroke-dasharray="3 4"'), L(X0, Y0 - 2 * ky, X1, Y0 - 2 * ky, 'grid', 1, 'stroke-dasharray="3 4"'),
        T(X0 - 6, Y0 + 4, '0', { a: 'end', c: 'q', s: 12 }), T(X0 - 6, Y0 - ky + 4, '1', { a: 'end', c: 'q', s: 12 }), T(X0 - 6, Y0 - 2 * ky + 4, '2', { a: 'end', c: 'q', s: 12 }),
        T(X0 + 6, Y0 - 2 * ky - 12, '관절 속도 크기 (rad/s)', { c: 'q', s: 12 }),
        ...[0, 2, 4, 6].map(v => T(X(v), Y0 + 18, String(v), { a: 'middle', c: 'q', s: 12 })), T(X1, Y0 + 18, 't (s)', { a: 'end', c: 'q', s: 12 }),
        poly(curve(ref, 0), 's-c1', 1.75, faint), poly(curve(ref, 1), 's-c2', 1.75, faint),
        T(X1 - 4, Y0 - 2 * ky - 12, '↑ 8 rad/s까지', { a: 'end', c: lam > 0 ? 'q' : 'f-c2 b', s: 12 }),
      ];
      if (lam > 0) b.push(poly(curve(cur, 0), 's-c1', 2.5), poly(curve(cur, 1), 's-c2', 2.5));
      b.push(L(X(t), Y0, X(t), Y0 - ky * top, 'ink', 1, 'stroke-dasharray="2 3"'),
        C(X(t), Y(now.qd[0]), 4.5, 'f-c1', 0), C(X(t), Y(now.qd[1]), 4.5, 'f-c2', 0));
      return svg(id, [26, 400], b.join(''), '손끝이 경계에 가까워지면 관절 속도가 치솟고, 감쇠를 넣으면 눌린다');
    },
    readout: ({ t, lam }) => {
      const cur = sim5(lam), now = cur[Math.min(cur.length - 1, Math.round(t * 100))];
      const tail = lam > 0 ? ` · 손끝은 목표에서 <b>${now.err.toFixed(3)} cm</b> 뒤` : ' · 손끝은 목표 그대로';
      return `<div><b>θ₂ = ${f1(now.q[1] / D)}°</b>${tail}</div>` +
        `<div><span class="c1">|θ̇₁| = <b>${f2(Math.abs(now.qd[0]))}</b></span>, <span class="c2">|θ̇₂| = <b>${f2(Math.abs(now.qd[1]))}</b></span> rad/s <span class="q">(손끝 목표 속도 1 cm/s)</span></div>`;
    },
  });

  // 그림 8-6 문: 속도와 힘
  FIG.fig8_6 = el => {
    const id = 'f86';
    const door = (hx, isForce) => {
      const y = 170, Px = hx + 140, c = isForce ? 'c2' : 'c1';
      return [
        `<rect x="${hx - 22}" y="${y - 22}" width="14" height="44" class="f-tint s-axis" stroke-width="1.25"/>`,
        `<rect x="${hx}" y="${y - 6}" width="170" height="12" rx="2" class="f-tint s-ink" stroke-width="1.25"/>`,
        L(hx, y, Px - 6, y, 'ink', 1.25, 'stroke-dasharray="4 3" ' + A(id, 'ink')), T(hx + 70, y + 26, 'p', { a: 'middle', c: 'b', s: 14 }),
        outDot(hx, y, 6.5),
        arc(hx, y, 26, -20 * D, 70 * D, c, 2.25, A(id, c)),
        C(Px, y, 5, 'f-ink', 0), T(Px + 10, y + 24, 'P', { c: 'b', s: 13 }),
        L(Px, y - 8, Px, y - 66, c, 2.75, A(id, c)),
        L(Px + 22, y + 40, Px - 40, y + 40, 'axis', 1.5, 'stroke-dasharray="4 3" ' + AA(id, 'axis')),
      ].join('');
    };
    el.innerHTML += svg(id, [40, 234], [
      T(120, 62, '(가) 속도: 경첩 → 점', { a: 'middle', c: 'b', s: 15 }), T(360, 62, '(나) 힘: 점 → 경첩', { a: 'middle', c: 'b', s: 15 }),
      L(240, 74, 240, 270, 'grid', 1),
      door(44, false), door(284, true),
      T(44 + 34, 128, 'ω', { a: 'middle', c: 'f-c1 b', s: 14 }), T(178, 112, 'v = ω × p', { a: 'end', c: 'f-c1 b', s: 13 }),
      T(284 + 34, 128, 'τ = p × F', { c: 'f-c2 b', s: 13 }), T(418, 112, 'F', { a: 'end', c: 'f-c2 b', s: 14 }),
      T(166, 232, '이 방향 속도 0', { a: 'middle', c: 'q', s: 12.5 }), T(406, 232, '이 방향 힘은 토크 0', { a: 'middle', c: 'q', s: 12.5 }),
      T(120, 260, '0.5 rad/s × 0.7 m = 0.35 m/s', { a: 'middle', s: 12.5 }), T(360, 260, '0.7 m × 20 N = 14 N·m', { a: 'middle', s: 12.5 }),
    ].join(''), '문에서 속도는 오메가 곱하기 p, 토크는 p 곱하기 F다');
  };

  // 타원 (화면 중심, 반지름 a는 수학 각 ang 방향, b는 수직 방향)
  const ellipse = (x, y, a, b, ang, cls) => `<ellipse cx="${x}" cy="${y}" rx="${a}" ry="${b}" transform="rotate(${-ang / D} ${x} ${y})" class="${cls}" stroke-width="1.75" fill-opacity="0.14"/>`;
  // 그림 8-8 속도 타원과 힘 타원
  FIG.fig8_8 = el => {
    const id = 'f88', q = [20 * D, 30 * D], J = jac(q), s = 7;
    // 2×2 특이값 분해 (JJᵀ의 고유값)
    const a = J[0][0] ** 2 + J[0][1] ** 2, bb = J[0][0] * J[1][0] + J[0][1] * J[1][1], c = J[1][0] ** 2 + J[1][1] ** 2;
    const ph = 0.5 * Math.atan2(2 * bb, a - c), m = (a + c) / 2, r = Math.hypot((a - c) / 2, bb);
    const s1 = Math.sqrt(m + r), s2 = Math.sqrt(m - r);           // ph 방향이 s1
    const panel = ox => {
      const O = [ox, 236], e = elbowOf(q), h = fk(q), E = [ox + s * e[0], 236 - s * e[1]], H = [ox + s * h[0], 236 - s * h[1]];
      const u = nrm(h), far = [ox + s * h[0] + 34 * u[0], 236 - s * h[1] - 34 * u[1]];
      return { H, body: [L(O[0], O[1], far[0], far[1], 'axis', 1, 'stroke-dasharray="3 4"'), base(O[0], O[1]), link(O[0], O[1], E[0], E[1], 'axis', 9), link(E[0], E[1], H[0], H[1], 'axis', 9), joint(O[0], O[1], 6.5), joint(E[0], E[1], 5.5)].join('') };
    };
    const g1 = panel(34), g2 = panel(274), kv = 3.6, kf = 14.4 * 1.0;
    const armDir = nrm(fk(q)), out = [armDir[0], -armDir[1]];   // 화면에서 받침 → 손끝 방향
    let u1 = [Math.cos(ph), -Math.sin(ph)], u2 = [-u1[1], u1[0]];
    if (u1[1] > 0) u1 = [-u1[0], -u1[1]];                          // 긴 축(속도)은 위쪽 끝에 글자
    if (u2[0] * out[0] + u2[1] * out[1] < 0) u2 = [-u2[0], -u2[1]]; // 짧은 축(속도)은 팔 바깥쪽
    const lv1 = [g1.H[0] + kv * s1 * u1[0], g1.H[1] + kv * s1 * u1[1]], lf2 = [g2.H[0] + kf * 10 / s2 * u2[0], g2.H[1] + kf * 10 / s2 * u2[1]];
    el.innerHTML += svg(id, [40, 246], [
      T(120, 62, '(가) 속도 타원: ẋ = J θ̇', { a: 'middle', c: 'b', s: 15 }), T(360, 62, '(나) 힘 타원: F = (Jᵀ)⁻¹τ', { a: 'middle', c: 'b', s: 15 }),
      L(240, 74, 240, 282, 'grid', 1),
      g1.body, ellipse(g1.H[0], g1.H[1], kv * s1, kv * s2, ph, 'f-c1 s-c1'), C(g1.H[0], g1.H[1], 4, 'f-ink', 0),
      T(lv1[0] - 6, lv1[1] - 4, '19 cm/s', { a: 'end', c: 'f-c1 b', s: 13 }),
      T(g1.H[0] + 24 * u2[0] + 4, g1.H[1] + 24 * u2[1] + 4, '2.1', { c: 'f-c1 b', s: 13 }),
      g2.body, ellipse(g2.H[0], g2.H[1], kf * 10 / s1, kf * 10 / s2, ph, 'f-c2 s-c2'), C(g2.H[0], g2.H[1], 4, 'f-ink', 0),
      T(lf2[0] + 6, lf2[1] - 6, '4.8 N', { c: 'f-c2 b', s: 13 }),
      T(g2.H[0] + 26 * u1[0] - 4, g2.H[1] + 26 * u1[1] + 2, '0.53', { a: 'end', c: 'f-c2 b', s: 13 }),
      T(120, 276, '관절 속도 원 |θ̇| = 1 rad/s에서', { a: 'middle', c: 'q', s: 12.5 }), T(360, 276, '관절 토크 원 |τ| = 10 N·cm에서', { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '속도 타원은 팔에 수직으로 길고, 힘 타원은 팔 방향으로 길다');
  };

  // 그림 8-7 손끝 힘과 관절 토크 τ = JᵀF (슬라이더)
  FIG.fig8_7 = el => interactive(el, {
    state: { t2: 60, ph: 90, F: 1 },
    sliders: [
      { key: 't2', label: '팔꿈치 θ₂', min: 0, max: 150, unit: '°' },
      { key: 'ph', label: '힘의 방향', min: -180, max: 180, step: 5, unit: '°' },
      { key: 'F', label: '힘의 크기', min: 0, max: 2, step: 0.1, unit: ' N' },
    ],
    draw: ({ t2, ph, F }) => {
      const id = 'f87', s = 10.5, bx = 120, by = 300, q = [30 * D, t2 * D], P = ([x, y]) => [bx + s * x, by - s * y];
      const e = elbowOf(q), h = fk(q), E = P(e), H = P(h), J = jac(q);
      const f = [F * Math.cos(ph * D), F * Math.sin(ph * D)], tau = [J[0][0] * f[0] + J[1][0] * f[1], J[0][1] * f[0] + J[1][1] * f[1]];
      const Ft = [H[0] + 32 * f[0], H[1] - 32 * f[1]], kd = 7 * D;
      // 팔꿈치 고리의 가운데 각: 두 링크의 바깥쪽
      const da = [Math.cos(q[0] + Math.PI) + Math.cos(q[0] + q[1]), Math.sin(q[0] + Math.PI) + Math.sin(q[0] + q[1])];
      const mid2 = Math.hypot(...da) < 0.2 ? q[0] + Math.PI / 2 : Math.atan2(da[1], da[0]) + Math.PI;
      const bar = (y, v, c, lab) => {
        const w = Math.max(-58, Math.min(58, 1.6 * v));
        return T(352, y + 5, lab, { a: 'end', c: c === 'c1' ? 'f-c1 b' : 'f-c2 b', s: 13 }) +
          `<rect x="${Math.min(412, 412 + w)}" y="${y - 7}" width="${Math.abs(w)}" height="14" rx="2" class="f-${c}" fill-opacity="0.7"/>`;
      };
      return svg(id, [40, 300], [
        L(24, by, 330, by, 'grid', 1), base(bx, by),
        L(bx, by, H[0], H[1], 'c1', 1.25, 'stroke-dasharray="4 4"'), L(E[0], E[1], H[0], H[1], 'c2', 1.25, 'stroke-dasharray="4 4"'),
        link(bx, by, E[0], E[1], 'axis', 10), link(E[0], E[1], H[0], H[1], 'axis', 10), joint(bx, by, 7), joint(E[0], E[1], 6),
        turn(id, bx, by, 30, 150 * D, kd * tau[0], 'c1'), turn(id, E[0], E[1], 22, mid2, kd * tau[1], 'c2'),
        Math.abs(kd * tau[0]) >= 0.05 ? T(bx - 38, by - 34, 'τ₁', { a: 'end', c: 'f-c1 b', s: 14 }) : '',
        Math.abs(kd * tau[1]) >= 0.05 ? T(E[0] + 42 * Math.cos(mid2), E[1] - 42 * Math.sin(mid2) + 5, 'τ₂', { a: 'middle', c: 'f-c2 b', s: 14 }) : '',
        F > 0 ? L(H[0], H[1], Ft[0], Ft[1], 'ink', 2.75, A(id, 'ink')) : '',
        C(H[0], H[1], 5, 'f-ink', 0),
        F > 0 ? T(Ft[0] + 12 * Math.cos(ph * D), Ft[1] - 12 * Math.sin(ph * D) + 5, 'F', { a: 'middle', c: 'b', s: 14 }) : '',
        L(412, 58, 412, 118, 'axis', 1), T(412, 132, '0', { a: 'middle', c: 'q', s: 12 }),
        T(352, 50, '토크 (N·cm)', { c: 'q', s: 12 }),
        bar(74, tau[0], 'c1', 'τ₁'), bar(102, tau[1], 'c2', 'τ₂'),
      ].join(''), '손끝 힘을 자코비안 전치로 옮기면 두 관절의 토크가 나온다');
    },
    readout: ({ t2, ph, F }) => {
      const J = jac([30 * D, t2 * D]), f = [F * Math.cos(ph * D), F * Math.sin(ph * D)];
      const tau = [J[0][0] * f[0] + J[1][0] * f[1], J[0][1] * f[0] + J[1][1] * f[1]];
      return `<div class="matrow"><b>Jᵀ</b> = ${matrix2(f2(J[0][0]), f2(J[1][0]), f2(J[0][1]), f2(J[1][1]), ['', ''])}<span class="q">윗줄 × F = τ₁, 아랫줄 × F = τ₂</span></div>` +
        `<div><b>F</b> = (${f2(f[0])}, ${f2(f[1])}) N → <span class="c1">τ₁ = <b>${f2(tau[0])}</b></span>, <span class="c2">τ₂ = <b>${f2(tau[1])}</b></span> N·cm</div>`;
    },
  });

  // 그림 8-9 손끝의 힘을 손목으로 옮기기
  FIG.fig8_9 = el => {
    const id = 'f89', ga = arm3(40, 270, 10), gb = arm3(280, 270, 10), kf = 25;
    const mom = gb.W;
    el.innerHTML += svg(id, [52, 272], [
      T(120, 74, '(가) 손끝 E에서', { a: 'middle', c: 'b', s: 15 }), T(360, 74, '(나) 손목 W에서', { a: 'middle', c: 'b', s: 15 }),
      L(240, 86, 240, 316, 'grid', 1),
      ga.body, C(ga.E[0], ga.E[1], 4.5, 'f-ink', 0), T(ga.W[0] - 12, ga.W[1] + 5, 'W', { a: 'end', c: 'b', s: 13 }), T(ga.E[0] + 10, ga.E[1] + 18, 'E', { c: 'b', s: 13 }),
      L(ga.E[0], ga.E[1] - 6, ga.E[0], ga.E[1] - 6 - 2 * kf, 'c2', 2.75, A(id, 'c2')), T(ga.E[0] + 10, ga.E[1] - 34, 'f = 2 N', { c: 'f-c2 b', s: 13 }),
      gb.body, C(gb.E[0], gb.E[1], 4.5, 'f-none s-ink', 1.5), T(gb.E[0] + 10, gb.E[1] + 18, 'E', { c: 'q', s: 13 }),
      T((gb.W[0] + gb.E[0]) / 2, gb.W[1] + 22, sub('p', 'WE'), { a: 'middle', c: 'f-c2', s: 13 }),
      L(mom[0], mom[1] - 8, mom[0], mom[1] - 8 - 2 * kf, 'c2', 2.75, A(id, 'c2')), T(mom[0] + 10, mom[1] - 34, 'f = 2 N', { c: 'f-c2 b', s: 13 }),
      arc(mom[0], mom[1], 22, 120 * D, 240 * D, 'c2', 2.25, A(id, 'c2')),
      T(mom[0] - 30, mom[1] - 8, 'n = p × f', { a: 'end', c: 'f-c2 b', s: 13 }), T(mom[0] - 30, mom[1] + 10, '= 10 N·cm', { a: 'end', c: 'f-c2 b', s: 13 }),
      T(120, 316, 'τ = (26, 10, 10) N·cm', { a: 'middle', s: 13 }), T(360, 316, 'τ = (26, 10, 10) N·cm', { a: 'middle', s: 13 }),
    ].join(''), '손끝의 힘은 손목에서 같은 힘과 지렛대 모멘트로 바뀌고 관절 토크는 같다');
  };
})();
