// 12장 그림: 질량 행렬, 원심력·코리올리 힘, 중력
(function () {
  const { D, f1, f2, svg, T, L, A, AA, C, joint, link, arc, interactive, sub, matrix2 } = FigKit;
  const FIG = window.FIG;

  // 종이 팔 (cm, g): 링크 1 = 10 cm·20 g, 링크 2 = 8 cm·15 g, 질량 중심은 가운데
  const m1 = 20, m2 = 15, l1 = 10, l2 = 8, lc1 = 5, lc2 = 4, I1 = m1 * l1 * l1 / 12, I2 = m2 * l2 * l2 / 12;
  const g = 980, TO = 1e-4;                                   // g·cm²/s² → mN·m
  const dir = a => [Math.cos(a), Math.sin(a)];
  // 화면 좌표의 팔: 어깨 (bx, by), 1 cm = s px, 각도는 도
  const arm = (bx, by, s, t1, t2) => {
    const a = t1 * D, b = (t1 + t2) * D, P = (x, y) => [bx + s * x, by - s * y];
    const e = [l1 * Math.cos(a), l1 * Math.sin(a)], h = [e[0] + l2 * Math.cos(b), e[1] + l2 * Math.sin(b)];
    return {
      S: [bx, by], E: P(...e), H: P(...h),
      C1: P(lc1 * Math.cos(a), lc1 * Math.sin(a)), C2: P(e[0] + lc2 * Math.cos(b), e[1] + lc2 * Math.sin(b)), a, b,
    };
  };
  const Mof = (t2, mp = 0) => {
    const c = Math.cos(t2 * D);
    const p1 = m1 * lc1 * lc1 + I1, p2 = m2 * (l1 * l1 + lc2 * lc2 + 2 * l1 * lc2 * c) + I2, pp = mp * (l1 * l1 + l2 * l2 + 2 * l1 * l2 * c);
    return { m11: p1 + p2 + pp, m12: m2 * (lc2 * lc2 + l1 * lc2 * c) + I2 + mp * (l2 * l2 + l1 * l2 * c), m22: m2 * lc2 * lc2 + I2 + mp * l2 * l2, parts: [p1, p2, pp] };
  };
  // 둥근 화살표: 가운데 각 mid(라디안)에서 펼친 각 ext, 부호대로 방향
  const turn = (id, x, y, r, mid, ext, sign, c, w = 2.5, more = '') => {
    if (Math.abs(sign) < 1e-9 || ext < 1e-3) return '';
    const a0 = mid - ext / 2, a1 = mid + ext / 2;
    return sign > 0 ? arc(x, y, r, a0, a1, c, w, A(id, c) + ' ' + more) : arc(x, y, r, a1, a0, c, w, A(id, c) + ' ' + more);
  };
  // 가운데가 0인 막대 (값 v, 최댓값 vmax)
  const dbar = (x0, y, half, v, vmax, cls, hgt = 12) => {
    const w = half * Math.max(-1, Math.min(1, v / vmax));
    return `<rect x="${x0 - half}" y="${y}" width="${2 * half}" height="${hgt}" rx="3" fill="none" class="s-grid" stroke-width="1"/>` +
      (Math.abs(w) > 0.3 ? `<rect x="${w >= 0 ? x0 : x0 + w}" y="${y}" width="${Math.abs(w)}" height="${hgt}" rx="3" class="${cls}" fill-opacity="0.55"/>` : '') +
      L(x0, y - 3, x0, y + hgt + 3, 'axis', 1.25);
  };
  // 자물쇠 (가운데 x, y)
  const lock = (x, y) => `<rect x="${x - 6}" y="${y - 3}" width="12" height="9" rx="1.5" class="f-axis"/>` +
    `<path d="M${x - 3.5} ${y - 3}v-3a3.5 3.5 0 0 1 7 0v3" fill="none" class="s-axis" stroke-width="1.75"/>`;
  const fmt = v => Math.round(v).toString();

  // 그림 12-1 링크의 운동 에너지 = 미끄러지기 + 제자리 돌기
  FIG.fig12_1 = el => {
    const id = 'f121', y = 168, k = 4, half = 52;
    const fr = [0, 0.25, 0.5, 0.75, 1];
    const panel = (cx, title, vel, c) => {
      const b = [T(cx, 62, title, { a: 'middle', c: 'b', s: 13.5 }), link(cx - half, y, cx + half, y, 'axis', 10)];
      fr.forEach(f => {
        const x = cx - half + 2 * half * f, v = vel(f);
        if (Math.abs(v) > 0.01) b.push(L(x, y, x, y - k * v + (v > 0 ? 2 : -2), c, 1.75, A(id, c)));
      });
      b.push(C(cx, y, 4.5, 'f-ink', 0));
      return b;
    };
    const p1 = 84, p2 = 248, p3 = 412;
    el.innerHTML += svg(id, [40, 236], [
      ...panel(p1, '실제 움직임', f => 16 * f, 'ink'),
      joint(p1 - half, y, 7), C(p1 - half, y, 2, 'f-ink', 0),
      turn(id, p1 - half, y, 26, -55 * D, 70 * D, 1, 'ink', 1.5),
      T(p1 - half + 30, y + 36, 'ω', { c: 'b', s: 13 }),
      T(p1 + half, y - 72, '16', { a: 'middle', s: 12.5 }), T(p1, y - 40, '8', { a: 'middle', s: 12.5 }),
      T(p1 + 8, y + 22, 'c', { c: 'q', s: 12.5 }),
      T(166, y + 7, '=', { a: 'middle', s: 22 }),
      ...panel(p2, '① 통째로 이동', () => 8, 'c1'),
      T(p2, y - 44, '모두 8', { a: 'middle', s: 12.5 }),
      T(330, y + 7, '+', { a: 'middle', s: 22 }),
      ...panel(p3, '② 제자리 회전', f => 16 * (f - 0.5), 'c2'),
      turn(id, p3, y, 20, 90 * D, 110 * D, 1, 'c2', 1.5),
      T(p3, y - 28, 'ω', { a: 'middle', c: 'b', s: 13 }),
      T(p3 + half, y - 40, '+8', { a: 'middle', s: 12.5 }), T(p3 - half - 6, y + 38, '−8', { a: 'end', s: 12.5 }),
      L(16, 214, 464, 214, 'grid', 1),
      T(p1, 238, 'K', { a: 'middle', c: 'b', s: 14 }), T(p1, 260, '640', { a: 'middle', c: 'b', s: 14 }),
      T(p2, 238, '½ m ' + sub('v', 'c') + 'ᵀ' + sub('v', 'c'), { a: 'middle', c: 'f-c1 b', s: 14 }), T(p2, 260, '480', { a: 'middle', c: 'f-c1 b', s: 14 }),
      T(p3, 238, '½ ωᵀ ' + sub('I', 'c') + ' ω', { a: 'middle', c: 'f-c2 b', s: 14 }), T(p3, 260, '160', { a: 'middle', c: 'f-c2 b', s: 14 }),
    ].join(''), '끝을 축으로 도는 막대의 속도는 질량 중심 속도로 미끄러지는 몫과 질량 중심 둘레로 도는 몫의 합이다');
  };

  // 그림 12-2 링크마다 M에 보태는 몫
  FIG.fig12_2 = el => {
    const id = 'f122', P = arm(60, 238, 13, 30, 60), { S, E, H, C1, C2 } = P;
    const cw = 52, ch = 32, gy = 292, gx = [40, 188, 336];
    const grid = (x, vals, cls, title) => {
      const b = [T(x + cw, gy - 10, title, { a: 'middle', c: 'b', s: 13 })];
      vals.forEach((v, n) => {
        const r = Math.floor(n / 2), c = n % 2, zero = v === 0, cl = cls ? (zero ? 'f-tint s-grid' : cls) : 'f-tint s-axis';
        b.push(`<rect x="${x + c * cw + 1.5}" y="${gy + r * ch + 1.5}" width="${cw - 3}" height="${ch - 3}" rx="4" class="${cl}" ${cls && !zero ? 'fill-opacity="0.16"' : ''} stroke-width="1.25"/>`,
          T(x + c * cw + cw / 2, gy + r * ch + ch / 2 + 5, zero ? '0' : fmt(v), { a: 'middle', c: zero ? 'q' : 'b', s: 13 }));
      });
      return b;
    };
    const M = Mof(60);
    el.innerHTML += svg(id, [52, 332], [
      `<rect x="${S[0] - 18}" y="${S[1] + 9}" width="36" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      link(S[0], S[1], E[0], E[1], 'axis', 10), link(E[0], E[1], H[0], H[1], 'axis', 10),
      L(S[0], S[1], C2[0], C2[1], 'c2', 1.75, 'stroke-dasharray="5 4" ' + A(id, 'c2')),
      L(S[0], S[1], C1[0], C1[1], 'c1', 2.25, A(id, 'c1')),
      L(E[0], E[1], C2[0], C2[1], 'c2', 2.25, A(id, 'c2')),
      joint(S[0], S[1], 7), joint(E[0], E[1], 6),
      C(C1[0], C1[1], 5, 'f-c1', 0), C(C2[0], C2[1], 5, 'f-c2', 0),
      T(C1[0] + 6, C1[1] + 22, sub('c', '1'), { c: 'f-c1 b', s: 13 }), T(C2[0] + 12, C2[1] + 5, sub('c', '2'), { c: 'f-c2 b', s: 13 }),
      T(S[0] - 12, S[1] - 10, '어깨', { a: 'end', c: 'q', s: 12.5 }), T(E[0] + 12, E[1] + 16, '팔꿈치', { c: 'q', s: 12.5 }),
      L(256, 92, 286, 92, 'c1', 2.25), T(294, 97, '어깨 → ' + sub('c', '1'), { s: 13 }),
      L(256, 118, 286, 118, 'c2', 1.75, 'stroke-dasharray="5 4"'), T(294, 123, '어깨 → ' + sub('c', '2'), { s: 13 }),
      L(256, 144, 286, 144, 'c2', 2.25), T(294, 149, '팔꿈치 → ' + sub('c', '2'), { s: 13 }),
      T(256, 188, '칸 = 질량 × 두 화살표의 내적', { c: 'q', s: 12.5 }),
      T(256, 208, '    + 제자리 회전 몫 I', { c: 'q', s: 12.5 }),
      ...grid(gx[0], [M.parts[0], 0, 0, 0], 'f-c1 s-c1', '링크 1의 몫'),
      T(166, gy + ch + 6, '+', { a: 'middle', s: 20 }),
      ...grid(gx[1], [M.parts[1], M.m12, M.m12, M.m22], 'f-c2 s-c2', '링크 2의 몫'),
      T(314, gy + ch + 6, '=', { a: 'middle', s: 20 }),
      ...grid(gx[2], [M.m11, M.m12, M.m12, M.m22], '', 'M'),
    ].join(''), '링크 1은 질량 행렬의 왼쪽 위 칸에만, 링크 2는 네 칸 모두에 보탠다');
  };

  // 그림 12-3 종이 팔의 질량 행렬 (슬라이더)
  FIG.fig12_3 = el => interactive(el, {
    state: { t2: 60, mp: 0 },
    sliders: [{ key: 't2', label: '팔꿈치 θ₂', min: 0, max: 180, unit: '°' }, { key: 'mp', label: '손에 든 물건', min: 0, max: 50, step: 5, unit: ' g' }],
    draw: ({ t2, mp }) => {
      const id = 'f123', P = arm(56, 206, 9, 20, t2), { S, E, H, C1, C2 } = P, M = Mof(t2, mp);
      // 오른쪽: θ₂에 따른 M의 칸
      const top = Mof(0, mp).m11, lo = -0.1 * top, X = t => 290 + t * 170 / 180, Y = v => 196 - (v - lo) / (top - lo) * 128;
      const curve = key => { const p = []; for (let t = 0; t <= 180; t += 4) p.push(X(t).toFixed(1) + ' ' + Y(Mof(t, mp)[key]).toFixed(1)); return 'M' + p.join('L'); };
      const r2 = Math.hypot(H[0] - S[0], H[1] - S[1]) / 9;
      const W = 448, sc = W / top, segs = [['c1', M.parts[0]], ['c2', M.parts[1]], ['ink', M.parts[2]]];
      let x = 16;
      const bar = segs.map(([c, v]) => { const w = v * sc, r = `<rect x="${x}" y="258" width="${Math.max(0, w)}" height="16" class="f-${c}" fill-opacity="${c === 'ink' ? 0.45 : 0.55}"/>`; x += w; return r; }).join('');
      const b = [
        `<rect x="${S[0] - 18}" y="${S[1] + 9}" width="36" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
        L(S[0], S[1], H[0], H[1], 'axis', 1, 'stroke-dasharray="4 4"'),
        link(S[0], S[1], E[0], E[1], 'c1', 10), link(E[0], E[1], H[0], H[1], 'c2', 9),
        joint(S[0], S[1], 7), joint(E[0], E[1], 6), C(C1[0], C1[1], 4, 'f-c1', 0), C(C2[0], C2[1], 4, 'f-c2', 0),
        T(16, 60, '어깨에서 손까지 ' + f1(r2) + ' cm', { s: 13 }),
        // 그래프
        T(290, 56, 'θ₂에 따른 M의 칸 (g·cm²)', { c: 'b', s: 12.5 }),
        L(X(0), Y(0), X(180), Y(0), 'axis', 1), L(X(0), Y(lo), X(0), Y(top) - 6, 'axis', 1),
        `<path d="${curve('m22')}" fill="none" class="s-axis" stroke-width="1.75" stroke-dasharray="2 3"/>`,
        `<path d="${curve('m12')}" fill="none" class="s-ink" stroke-width="1.5" stroke-dasharray="5 3"/>`,
        `<path d="${curve('m11')}" fill="none" class="s-ink" stroke-width="2.25"/>`,
        T(X(0) - 6, Y(Mof(0, mp).m11) + 5, sub('M', '11'), { a: 'end', c: 'b', s: 13 }),
        T(X(0) - 6, Y(Mof(0, mp).m12) + 1, sub('M', '12'), { a: 'end', s: 13 }),
        T(X(0) - 6, Y(Mof(0, mp).m22) + 12, sub('M', '22'), { a: 'end', c: 'q', s: 13 }),
        T(X(0), 214, '0°', { a: 'middle', c: 'q', s: 12 }), T(X(90), 214, '90°', { a: 'middle', c: 'q', s: 12 }), T(X(180), 214, '180°', { a: 'middle', c: 'q', s: 12 }),
        T(X(135), 214, 'θ₂', { a: 'middle', c: 'q', s: 12.5 }),
        L(X(t2), Y(lo), X(t2), Y(top), 'c1', 1, 'stroke-dasharray="2 3"'),
        C(X(t2), Y(M.m11), 4.5, 'f-ink', 0), C(X(t2), Y(M.m12), 3.5, 'f-ink', 0), C(X(t2), Y(M.m22), 3.5, 'f-axis', 0),
        // M₁₁ 막대
        T(16, 248, sub('M', '11') + ' = 어깨가 느끼는 관성', { c: 'b', s: 13 }), T(464, 248, fmt(M.m11) + ' g·cm²', { a: 'end', c: 'b', s: 13 }),
        `<rect x="16" y="258" width="${W}" height="16" rx="3" fill="none" class="s-grid" stroke-width="1"/>`, bar,
        `<rect x="16" y="284" width="11" height="11" class="f-c1" fill-opacity="0.55"/>`, T(32, 294, '링크 1', { s: 12.5 }),
        `<rect x="86" y="284" width="11" height="11" class="f-c2" fill-opacity="0.55"/>`, T(102, 294, '링크 2', { s: 12.5 }),
        `<rect x="156" y="284" width="11" height="11" class="f-ink" fill-opacity="0.45"/>`, T(172, 294, '물건', { s: 12.5 }),
        T(464, 294, '막대 끝 = 편 팔(θ₂ = 0°)', { a: 'end', c: 'q', s: 12 }),
      ];
      if (mp > 0) {
        const k = 4 + mp / 10;
        b.push(`<rect x="${H[0] - k}" y="${H[1] - k}" width="${2 * k}" height="${2 * k}" rx="2" class="f-ink s-ink" fill-opacity="0.35" stroke-width="1.25"/>`);
      } else b.push(C(H[0], H[1], 4, 'f-ink', 0));
      return svg(id, [40, 266], b.join(''), '팔꿈치를 접으면 어깨가 느끼는 관성 M11이 줄어든다');
    },
    readout: ({ t2, mp }) => {
      const M = Mof(t2, mp), det = M.m11 * M.m22 - M.m12 * M.m12;
      return `<div class="matrow"><b>M</b> = ${matrix2(fmt(M.m11), fmt(M.m12), fmt(M.m12), fmt(M.m22), ['', ''])}<span class="q">g·cm² · 대칭이다 (M<sub>12</sub> = M<sub>21</sub>)</span></div>` +
        `<div>M<sub>11</sub>은 팔을 편 때(θ₂ = 0°)의 <b>${Math.round(M.m11 / Mof(0, mp).m11 * 100)}%</b> · det M = ${fmt(det)} <span class="q">(늘 양수)</span></div>`;
    },
  });

  // 그림 12-4 질량 행렬의 칸 읽기
  FIG.fig12_4 = el => {
    const id = 'f124', s = 7, t1 = 30, t2 = 70, g = 14;
    const panel = (px, title, lines, mode) => {
      const P = arm(px + 30, 190, s, t1, t2), { S, E, H } = P;
      const b = [T(px + 75, 58, title, { a: 'middle', c: 'b', s: 15 })];
      // 흐린 점선: 조금 움직인 뒤
      if (mode === 'a') { const G = arm(px + 30, 190, s, t1 + g, t2); b.push(L(S[0], S[1], G.E[0], G.E[1], 'c1', 1.25, 'stroke-dasharray="4 3"'), L(G.E[0], G.E[1], G.H[0], G.H[1], 'c1', 1.25, 'stroke-dasharray="4 3"')); }
      else { const G = arm(px + 30, 190, s, t1, t2 + g); b.push(L(E[0], E[1], G.H[0], G.H[1], 'c2', 1.25, 'stroke-dasharray="4 3"')); }
      b.push(`<rect x="${S[0] - 16}" y="${S[1] + 9}" width="32" height="11" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
        link(S[0], S[1], E[0], E[1], 'axis', 9), link(E[0], E[1], H[0], H[1], 'axis', 8), joint(S[0], S[1], 6.5), joint(E[0], E[1], 5.5));
      if (mode === 'a') {
        b.push(lock(E[0] + 14, E[1] + 14), turn(id, S[0], S[1], 22, 105 * D, 80 * D, 1, 'c1', 2.25),
          T(S[0] + 4, S[1] - 30, 'θ̈₁', { c: 'f-c1 b', s: 13 }));
      } else {
        b.push(turn(id, E[0], E[1], 18, 5 * D, 90 * D, 1, 'c2', 2.25), T(E[0] + 30, E[1] + 6, 'θ̈₂', { c: 'f-c2 b', s: 13 }));
        if (mode === 'b') b.push(lock(S[0] - 22, S[1] - 12));
        else b.push(turn(id, S[0], S[1], 22, 105 * D, 80 * D, 1, 'c1', 2.25), T(S[0] - 10, S[1] - 32, sub('M', '12') + 'θ̈₂', { a: 'middle', c: 'f-c1 b', s: 13 }));
      }
      lines.forEach((t, i) => b.push(T(px + 75, 230 + 19 * i, t, { a: 'middle', c: i === 2 ? 'q' : '', s: 12.5 })));
      return b;
    };
    el.innerHTML += svg(id, [40, 236], [
      ...panel(6, '(가) ' + sub('M', '11'), ['팔꿈치를 얼리고', '어깨를 돌린다', '자세에 따라 바뀐다'], 'a'),
      L(162, 48, 162, 274, 'grid', 1),
      ...panel(166, '(나) ' + sub('M', '22'), ['어깨를 얼리고', '팔꿈치를 돌린다', '늘 320으로 같다'], 'b'),
      L(322, 48, 322, 274, 'grid', 1),
      ...panel(326, '(다) ' + sub('M', '12'), ['팔꿈치를 가속하면', '어깨도 버텨야 한다', 'τ₁ = ' + sub('M', '12') + 'θ̈₂'], 'c'),
    ].join(''), '대각 칸은 다른 관절을 얼렸을 때의 관성이고 비대각 칸은 한 관절의 가속이 다른 관절에 거는 토크다');
  };

  // 그림 12-5 원심력과 코리올리 힘의 느낌
  FIG.fig12_5 = el => {
    const id = 'f125';
    // (가) 원심력
    const P = arm(30, 230, 11, 15, 75), { S, E, H, C2 } = P;
    const rv = [C2[0] - S[0], C2[1] - S[1]], R = Math.hypot(...rv), u = [rv[0] / R, rv[1] / R], ang = Math.atan2(-rv[1], rv[0]);
    const straight = [E[0] + 88 * Math.cos(15 * D), E[1] - 88 * Math.sin(15 * D)], tipU = [C2[0] + 46 * u[0], C2[1] + 46 * u[1]];
    // (나) 코리올리: 도는 판, 레일은 위쪽으로
    const ox = 360, oy = 184, Rd = 70, B0 = [ox, oy - 24], B1 = [ox, oy - 52];
    el.innerHTML += svg(id, [40, 262], [
      T(120, 58, '(가) 원심력', { a: 'middle', c: 'b', s: 15 }),
      arc(S[0], S[1], R, ang - 22 * D, ang + 30 * D, 'axis', 1.25, 'stroke-dasharray="3 4"'),
      `<rect x="${S[0] - 16}" y="${S[1] + 9}" width="32" height="11" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(E[0], E[1], straight[0], straight[1], 'c2', 1.25, 'stroke-dasharray="4 3"'),
      link(S[0], S[1], E[0], E[1], 'axis', 10), link(E[0], E[1], H[0], H[1], 'axis', 9),
      joint(S[0], S[1], 7), joint(E[0], E[1], 6), C(C2[0], C2[1], 5.5, 'f-c2', 0),
      T(C2[0] - 12, C2[1] + 5, sub('c', '2'), { a: 'end', c: 'f-c2 b', s: 13 }),
      L(C2[0] + 7 * u[0], C2[1] + 7 * u[1], tipU[0], tipU[1], 'c2', 2.5, A(id, 'c2')),
      T(tipU[0] + 6, tipU[1] - 8, '바깥으로', { s: 12.5 }), T(tipU[0] + 6, tipU[1] + 9, '쏠린다', { s: 12.5 }),
      turn(id, E[0], E[1], 30, 52 * D, 50 * D, -1, 'c2', 1.75, 'stroke-dasharray="4 3"'),
      T((E[0] + straight[0]) / 2 + 8, (E[1] + straight[1]) / 2 + 24, '펴지려 한다', { a: 'middle', c: 'f-c2 b', s: 12.5 }),
      turn(id, S[0], S[1], 26, 72 * D, 70 * D, 1, 'c1', 2.25), T(S[0] + 10, S[1] - 34, 'θ̇₁', { c: 'f-c1 b', s: 13 }),
      T(120, 270, '어깨가 돌면 팔뚝이 바깥으로', { a: 'middle', s: 12.5 }), T(120, 289, '쏠려 팔꿈치가 펴지려 한다', { a: 'middle', s: 12.5 }),
      L(240, 48, 240, 296, 'grid', 1),
      T(360, 58, '(나) 코리올리 힘', { a: 'middle', c: 'b', s: 15 }),
      C(ox, oy, Rd, 'f-tint s-axis', 1.25), C(ox, oy, 3, 'f-ink', 0),
      L(ox, oy, ox, oy - Rd, 'ink', 1.5),
      turn(id, ox, oy, Rd + 11, 200 * D, 54 * D, 1, 'c1', 2.25), T(ox - 84, oy + 44, 'θ̇', { a: 'end', c: 'f-c1 b', s: 14 }),
      C(B0[0], B0[1], 5, 'f-none s-axis', 1.25),
      L(B0[0] - 7, B0[1], B0[0] - 7 - 13, B0[1], 'axis', 1.5, A(id, 'axis')),
      C(B1[0], B1[1], 6.5, 'f-c1', 0),
      L(B1[0] - 9, B1[1], B1[0] - 9 - 30, B1[1], 'axis', 1.75, A(id, 'axis')),
      T(B1[0] - 44, B1[1] + 5, 'rθ̇', { a: 'end', c: 'q', s: 12.5 }),
      L(B1[0] + 40, B1[1], B1[0] + 10, B1[1], 'c2', 2.5, A(id, 'c2')),
      T(B1[0] + 46, B1[1] - 4, '레일이', { c: 'f-c2 b', s: 12.5 }), T(B1[0] + 46, B1[1] + 13, '옆으로 민다', { c: 'f-c2 b', s: 12.5 }),
      L(ox, oy - 60, ox, oy - 96, 'ink', 1.75, A(id, 'ink')), T(ox + 8, oy - 86, 'ṙ', { c: 'b', s: 14 }),
      T(360, 270, '바깥으로 갈수록 옆으로 빨라져야', { a: 'middle', s: 12.5 }), T(360, 289, '해서 모터 토크가 더 든다', { a: 'middle', s: 12.5 }),
    ].join(''), '어깨가 돌면 팔뚝이 바깥으로 쏠리고, 도는 판 위에서 바깥으로 나가는 구슬은 옆으로 밀어 줘야 한다');
  };

  // 그림 12-6 원심력·코리올리 힘 V (슬라이더)
  const Vparts = (t2, w1, w2) => {
    const s2 = Math.sin(t2 * D), b = m2 * l1 * lc2;              // b = 600 g·cm²
    return { v1c: -b * s2 * w2 * w2 * TO, v1b: -2 * b * s2 * w1 * w2 * TO, v2: b * s2 * w1 * w1 * TO };
  };
  FIG.fig12_6 = el => interactive(el, {
    state: { t2: 90, w1: 8, w2: 0 },
    sliders: [{ key: 't2', label: '팔꿈치 θ₂', min: -180, max: 180, unit: '°' },
      { key: 'w1', label: '어깨 빠르기 θ̇₁', min: -10, max: 10, step: 0.5, unit: '' },
      { key: 'w2', label: '팔꿈치 빠르기 θ̇₂', min: -10, max: 10, step: 0.5, unit: '' }],
    draw: ({ t2, w1, w2 }) => {
      const id = 'f126', P = arm(118, 182, 8.5, 30, t2), { S, E, H } = P, v = Vparts(t2, w1, w2), V1 = v.v1c + v.v1b;
      const ext = x => (50 + 250 * Math.min(1, Math.abs(x) / 18)) * D;
      const midE = (t2 > 0 ? -60 + t2 / 2 : 120 + t2 / 2) * D, lab2 = [E[0] + 54 * Math.cos(midE), E[1] - 54 * Math.sin(midE)];
      const rows = [['어깨 · 원심력 (θ̇₂²)', v.v1c, 'f-c1'], ['어깨 · 코리올리 (θ̇₁θ̇₂)', v.v1b, 'f-c1'], ['팔꿈치 · 원심력 (θ̇₁²)', v.v2, 'f-c2']];
      return svg(id, [40, 304], [
        `<rect x="${S[0] - 18}" y="${S[1] + 9}" width="36" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
        turn(id, S[0], S[1], 50, 210 * D, Math.min(1, Math.abs(w1) / 10) * 100 * D, w1, 'axis', 1.25, 'stroke-dasharray="3 3"'),
        turn(id, E[0], E[1], 36, midE, Math.min(1, Math.abs(w2) / 10) * 100 * D, w2, 'axis', 1.25, 'stroke-dasharray="3 3"'),
        link(S[0], S[1], E[0], E[1], 'axis', 10), link(E[0], E[1], H[0], H[1], 'axis', 9),
        joint(S[0], S[1], 7), joint(E[0], E[1], 6), C(H[0], H[1], 4, 'f-ink', 0),
        Math.abs(V1) > 0.05 ? turn(id, S[0], S[1], 28, 210 * D, ext(V1), V1, 'c1', 2.5) : '',
        Math.abs(v.v2) > 0.05 ? turn(id, E[0], E[1], 22, midE, ext(v.v2), v.v2, 'c2', 2.5) : '',
        Math.abs(V1) > 0.05 ? T(S[0] - 58, S[1] - 34, sub('V', '1'), { a: 'end', c: 'f-c1 b', s: 14 }) : '',
        Math.abs(v.v2) > 0.05 ? T(lab2[0], lab2[1] + 5, sub('V', '2'), { a: 'middle', c: 'f-c2 b', s: 14 }) : '',
        T(318, 70, '책상 위에서 본 팔', { c: 'q', s: 12.5 }),
        L(318, 92, 340, 92, 'c1', 2.5), T(346, 97, '모터가 더 낼 토크', { c: 'q', s: 12.5 }),
        L(318, 114, 340, 114, 'axis', 1.25, 'stroke-dasharray="3 3"'), T(346, 119, '관절이 도는 쪽', { c: 'q', s: 12.5 }),
        T(16, 252, '더 내야 할 토크 (mN·m)', { c: 'b', s: 13 }), T(300, 252, '0', { a: 'middle', c: 'q', s: 12 }),
        T(190, 252, '−12', { a: 'middle', c: 'q', s: 12 }), T(410, 252, '+12', { a: 'middle', c: 'q', s: 12 }),
        ...rows.map(([lab, val, cls], i) => T(16, 276 + 26 * i, lab, { s: 12.5 }) + dbar(300, 266 + 26 * i, 110, val, 12, cls) +
          T(466, 276 + 26 * i, f2(val), { a: 'end', c: 'b', s: 12.5 })),
      ].join(''), '관절 속도가 있으면 지금 빠르기를 지키려고 모터가 더 내야 할 토크가 생긴다');
    },
    readout: ({ t2, w1, w2 }) => {
      const v = Vparts(t2, w1, w2);
      return `<div><b class="c1">V<sub>1</sub></b> = −600 sin θ₂ (θ̇₂² + 2θ̇₁θ̇₂) = <b>${f2(v.v1c + v.v1b)}</b> mN·m</div>` +
        `<div><b class="c2">V<sub>2</sub></b> = 600 sin θ₂ · θ̇₁² = <b>${f2(v.v2)}</b> mN·m <span class="q">(빠르기 단위 rad/s, + = 시계 반대)</span></div>`;
    },
  });

  // 그림 12-7 벽에 세운 종이 팔의 중력 (슬라이더)
  const Gof = (t1, t2) => {
    const c1 = Math.cos(t1 * D), c12 = Math.cos((t1 + t2) * D);
    return [((m1 * lc1 + m2 * l1) * c1 + m2 * lc2 * c12) * g * TO, m2 * lc2 * c12 * g * TO];
  };
  FIG.fig12_7 = el => interactive(el, {
    state: { t1: 30, t2: 45 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: -180, max: 180, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -180, max: 180, unit: '°' }],
    draw: ({ t1, t2 }) => {
      const id = 'f127', P = arm(200, 184, 7, t1, t2), { S, E, H, C1, C2 } = P, G = Gof(t1, t2);
      const lever = (Cp, c) => L(S[0], Cp[1], Cp[0], Cp[1], c, 3.5, 'stroke-opacity="0.55" stroke-linecap="round"');
      const side1 = C1[0] >= C2[0] ? 1 : -1;
      const wt = (Cp, len, lab, side) => L(Cp[0], Cp[1] + 5, Cp[0], Cp[1] + len, 'ink', 1.75, A(id, 'ink')) +
        T(Cp[0] + side * 7, Cp[1] + len - 2, lab, { a: side > 0 ? 'start' : 'end', s: 12.5 });
      return svg(id, [40, 360], [
        L(S[0], 52, S[0], 316, 'axis', 1, 'stroke-dasharray="3 4"'),
        lever(C1, 'c1'), lever(C2, 'c2'),
        `<rect x="${S[0] - 13}" y="${S[1] - 13}" width="26" height="26" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
        link(S[0], S[1], E[0], E[1], 'c1', 10), link(E[0], E[1], H[0], H[1], 'c2', 9),
        joint(S[0], S[1], 7), joint(E[0], E[1], 6), C(H[0], H[1], 4, 'f-ink', 0),
        C(C1[0], C1[1], 4.5, 'f-c1', 0), C(C2[0], C2[1], 4.5, 'f-c2', 0),
        wt(C1, 34, sub('m', '1') + 'g', side1), wt(C2, 27, sub('m', '2') + 'g', -side1),
        L(440, 60, 440, 108, 'ink', 1.75, A(id, 'ink')), T(448, 92, 'g', { c: 'b', s: 14 }),
        T(464, 144, '굵은 선 = 어깨에서', { a: 'end', c: 'q', s: 12 }), T(464, 162, '질량 중심까지 수평 거리', { a: 'end', c: 'q', s: 12 }),
        L(16, 326, 464, 326, 'grid', 1),
        T(16, 348, '모터가 받칠 토크 (mN·m)', { c: 'b', s: 13 }),
        T(190, 348, '−32', { a: 'middle', c: 'q', s: 12 }), T(300, 348, '0', { a: 'middle', c: 'q', s: 12 }), T(410, 348, '+32', { a: 'middle', c: 'q', s: 12 }),
        T(16, 372, '어깨 ' + sub('G', '1'), { s: 13 }), dbar(300, 362, 110, G[0], 32, 'f-c1'), T(466, 372, f2(G[0]), { a: 'end', c: 'b', s: 13 }),
        T(16, 396, '팔꿈치 ' + sub('G', '2'), { s: 13 }), dbar(300, 386, 110, G[1], 32, 'f-c2'), T(466, 396, f2(G[1]), { a: 'end', c: 'b', s: 13 }),
      ].join(''), '벽에 세운 팔에서 모터가 받쳐야 할 중력 토크는 질량 중심까지의 수평 거리로 정해진다');
    },
    readout: ({ t1, t2 }) => {
      const G = Gof(t1, t2);
      return `<div><b class="c1">G<sub>1</sub></b> = 24.5 cos θ₁ + 5.9 cos(θ₁ + θ₂) = <b>${f2(G[0])}</b> mN·m</div>` +
        `<div><b class="c2">G<sub>2</sub></b> = 5.9 cos(θ₁ + θ₂) = <b>${f2(G[1])}</b> mN·m <span class="q">(+ = 시계 반대로 받친다)</span></div>`;
    },
  });

  // 그림 12-8 강의 예제: 회전 + 직동 팔
  FIG.fig12_8 = el => {
    const id = 'f128', ox = 80, oy = 236, a = 32 * D, u = [Math.cos(a), -Math.sin(a)], n = [Math.sin(a), Math.cos(a)];   // n: 화면에서 오른쪽 아래
    const at = (k, side = 0) => [ox + k * u[0] + side * n[0], oy + k * u[1] + side * n[1]];
    const M1 = at(62), M2 = at(196), tip = at(250);
    el.innerHTML += svg(id, [40, 244], [
      L(ox, oy, ox + 130, oy, 'axis', 1, 'stroke-dasharray="4 4"'),
      `<rect x="${ox - 22}" y="${oy + 8}" width="44" height="13" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      arc(ox, oy, 62, 0, a, 'axis', 1.25), T(ox + 74, oy - 8, 'θ₁', { c: 'b', s: 13 }),
      L(...at(0), ...at(128), 'axis', 22, 'stroke-linecap="round" stroke-opacity="0.45"'),
      link(...at(36), ...tip, 'c1', 9),
      joint(ox, oy, 8), C(ox, oy, 2.5, 'f-ink', 0),
      C(M1[0], M1[1], 5, 'f-ink', 0), T(at(62, -22)[0], at(62, -22)[1], sub('m', '1'), { a: 'middle', c: 'b', s: 13 }),
      C(M2[0], M2[1], 6.5, 'f-c1', 0), T(at(196, -22)[0], at(196, -22)[1], sub('m', '2'), { a: 'middle', c: 'f-c1 b', s: 13 }),
      // d₂ 치수선 (오른쪽 아래)
      L(...at(0, 34), ...at(196, 34), 'ink', 1, AA(id, 'ink')), L(...at(196, 10), ...at(196, 40), 'axis', 1), L(...at(0, 14), ...at(0, 40), 'axis', 1),
      T(at(110, 52)[0], at(110, 52)[1], sub('d', '2'), { a: 'middle', c: 'b', s: 13 }),
      // 원심력: 링크를 따라 바깥으로 (오른쪽 아래)
      L(...at(206, 16), ...at(250, 16), 'c2', 2.75, A(id, 'c2')),
      T(at(234, 16)[0] + 10, at(234, 16)[1] + 22, '원심력', { c: 'f-c2 b', s: 12.5 }),
      T(at(234, 16)[0] + 10, at(234, 16)[1] + 40, sub('m', '2') + sub('d', '2') + 'θ̇₁²', { c: 'f-c2 b', s: 12.5 }),
      // ḋ₂
      L(...at(258), ...at(294), 'ink', 1.75, A(id, 'ink')), T(at(302)[0], at(302)[1] + 5, 'ḋ₂', { c: 'b', s: 14 }),
      // 끝이 쓸고 가는 길 θ̇₁
      arc(ox, oy, 250, a + 4 * D, a + 13 * D, 'axis', 1.5, 'stroke-dasharray="3 3" ' + A(id, 'axis')),
      T(ox + 250 * Math.cos(a + 15 * D) - 6, oy - 250 * Math.sin(a + 15 * D), 'θ̇₁', { a: 'end', c: 'q', s: 13 }),
      // 코리올리: 관절 1의 토크
      turn(id, ox, oy, 30, 140 * D, 110 * D, 1, 'c2', 2.75),
      T(ox - 14, oy - 48, '코리올리', { a: 'middle', c: 'f-c2 b', s: 12.5 }),
      T(ox - 14, oy - 66, '2' + sub('m', '2') + sub('d', '2') + 'θ̇₁ḋ₂', { a: 'middle', c: 'f-c2 b', s: 12.5 }),
      L(440, 70, 440, 112, 'ink', 1.75, A(id, 'ink')), T(448, 96, 'g', { c: 'b', s: 14 }),
    ].join(''), '돌면서 늘어나는 팔에서 직동 관절은 바깥으로 쏠리는 원심력을, 회전 관절은 코리올리 토크를 느낀다');
  };
})();
