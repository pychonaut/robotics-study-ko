// 16장 그림: 컴플라이언스, 힘 제어, 선택 행렬, 사람 곁의 안전, 매크로-미니 구동, 과제와 자세, 전신 제어
(function () {
  const { D, f1, f2, svg, T, L, A, AA, C, joint, link, arc, interactive, sub, matrix2 } = FigKit;
  const FIG = window.FIG;

  // 종이 팔 (cm)
  const elbowOf = ([a]) => [10 * Math.cos(a), 10 * Math.sin(a)];
  const jac = ([a, b]) => {
    const s1 = Math.sin(a), c1 = Math.cos(a), s12 = Math.sin(a + b), c12 = Math.cos(a + b);
    return [[-10 * s1 - 8 * s12, -8 * s12], [10 * c1 + 8 * c12, 8 * c12]];
  };
  const ik = ([x, y], up = false) => {          // up이면 θ2 < 0 (팔꿈치가 위)
    const c2 = Math.max(-1, Math.min(1, (x * x + y * y - 164) / 160)), t2 = (up ? -1 : 1) * Math.acos(c2);
    return [Math.atan2(y, x) - Math.atan2(8 * Math.sin(t2), 10 + 8 * Math.cos(t2)), t2];
  };
  const poly = (pts, cls, w = 1.25, more = '') => `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" class="${cls}" stroke-width="${w}" fill="none" ${more}/>`;
  const base = (x, y, w = 32) => `<rect x="${x - w / 2}" y="${y + 9}" width="${w}" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`;
  // 지그재그 용수철 (화면 좌표)
  const spring = (x1, y1, x2, y2, n, amp, c, w = 1.75) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux;
    const lead = Math.min(6, len * 0.15), pts = [[x1, y1]];
    for (let k = 0; k <= 2 * n; k++) {
      const s = lead + (len - 2 * lead) * k / (2 * n), o = k === 0 || k === 2 * n ? 0 : (k % 2 ? amp : -amp);
      pts.push([x1 + ux * s + px * o, y1 + uy * s + py * o]);
    }
    pts.push([x2, y2]);
    return `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" class="s-${c}" stroke-width="${w}" fill="none" stroke-linejoin="round"/>`;
  };
  // 종이 팔 그리기: 받침 화면 좌표 (bx, by), 축척 s, 손끝 목표 (cm)
  const paperArm = (bx, by, s, hand, c = 'axis', fat = 9) => {
    const q = ik(hand, true), e = elbowOf(q), E = [bx + s * e[0], by - s * e[1]], H = [bx + s * hand[0], by - s * hand[1]];
    return { E, H, q, body: base(bx, by) + link(bx, by, E[0], E[1], c, fat) + link(E[0], E[1], H[0], H[1], c, fat) + joint(bx, by, 6.5) + joint(E[0], E[1], 5.5) };
  };

  // 그림 16-1 딱딱한 팔과 부드러운 팔이 장애물에 닿을 때
  FIG.fig16_1 = el => {
    const id = 'f161', s = 11, dx = 2.5;
    const panel = (x0, title, k, F, dense) => {
      const bx = x0 + 24, by = 204, hx = 14, hy = 3;
      const g = paperArm(bx, by, s, [hx, hy], 'c1', 9);
      const tx = bx + s * (hx + dx), ty = by - s * hy;
      const boxL = bx + s * hx, boxR = x0 + 232;
      return [
        T(x0 + 120, 58, title, { a: 'middle', c: 'b', s: 15 }),
        `<rect x="${boxL}" y="${by - s * 9}" width="${boxR - boxL}" height="${s * 10.5}" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
        T((boxL + boxR) / 2, by - s * 9 + 20, '장애물', { a: 'middle', c: 'q', s: 12.5 }),
        L(bx + s * 4, ty, boxL - 2, ty, 'axis', 1.25, 'stroke-dasharray="5 4"'),
        L(boxL, ty, tx, ty, 'ink', 1, 'stroke-dasharray="2 3"'),
        g.body,
        spring(g.H[0], g.H[1] + 16, tx, ty + 16, dense ? 5 : 3, dense ? 4 : 6, 'c1', dense ? 2.5 : 1.25),
        L(g.H[0], g.H[1] + 4, g.H[0], g.H[1] + 22, 'c1', 1), L(tx, ty + 4, tx, ty + 22, 'c1', 1),
        C(tx, ty, 5, 'f-none s-ink', 1.5), C(g.H[0], g.H[1], 4.5, 'f-c1', 0),
        T(tx + 2, ty - 10, '목표', { a: 'middle', c: 'b', s: 12.5 }),
        T((g.H[0] + tx) / 2, 240, 'Δx = 2.5 cm', { a: 'middle', s: 12.5 }),
        L(g.H[0], 224, g.H[0], 230, 'ink', 1), L(tx, 224, tx, 230, 'ink', 1), L(g.H[0], 227, tx, 227, 'ink', 1),
        T(x0 + 70, 266, 'k = ' + k + ' N/cm', { a: 'middle', c: 'b', s: 13 }),
        T(x0 + 20, 292, '누르는 힘', { c: 'q', s: 12.5 }),
        `<rect x="${x0 + 84}" y="${281}" width="${Math.max(2, F * 2)}" height="14" rx="2" class="f-c2" fill-opacity="0.75"/>`,
        T(x0 + 84 + Math.max(2, F * 2) + 6, 293, F + ' N', { c: 'f-c2 b', s: 13 }),
      ].join('');
    };
    el.innerHTML += svg(id, [40, 266], [
      panel(0, '(가) 딱딱한 위치 제어', 20, 50, true),
      L(240, 50, 240, 300, 'grid', 1),
      panel(240, '(나) 부드러운 제어', 0.4, 1, false),
    ].join(''), '목표가 장애물 속 2.5 cm에 있을 때, 딱딱한 제어는 50 N, 부드러운 제어는 1 N으로 누른다');
  };

  // 그림 16-2 종이 팔로 벽 누르기: 두 용수철이 목표 깊이를 나눠 가진다 (슬라이더)
  FIG.fig16_2 = el => interactive(el, {
    state: { kp: 2, kw: 50, d: 1 },
    sliders: [
      { key: 'kp', label: '제어 강성 kₚ (N/cm)', min: 0.5, max: 50, step: 0.5, unit: '' },
      { key: 'kw', label: '벽 강성 (N/cm)', min: 1, max: 100, step: 1, unit: '' },
      { key: 'd', label: '목표 깊이 d', min: 0, max: 2, step: 0.1, unit: ' cm' },
    ],
    draw: ({ kp, kw, d }) => {
      const id = 'f162', s = 11, bx = 58, by = 196, xw = 13, hy = 5;
      const F = kp * kw / (kp + kw) * d, del = F / kw;
      const g = paperArm(bx, by, s, [xw + del, hy], 'c1', 9);
      const Wx = bx + s * xw, Hy = by - s * hy, Tx = bx + s * (xw + d);
      const dent = s * del;
      // 아래 막대: 1 cm = 120 px
      const k = 120, X0 = 70, yb = 286, a = (d - del) * k, b = del * k;
      const b1 = [
        `<path d="M${Wx} 44L320 44L320 232L${Wx} 232L${Wx} ${Hy + 18}L${Wx + dent} ${Hy}L${Wx} ${Hy - 18}Z" class="f-tint s-axis" stroke-width="1.25"/>`,
        T(272, 70, '벽', { a: 'middle', c: 'b', s: 14 }), T(272, 90, sub('k', 'w') + ' = ' + kw + ' N/cm', { a: 'middle', c: 'q', s: 12.5 }),
        g.body,
        d > 0 ? L(g.H[0] + 5, Hy, Tx - 5, Hy, 'c1', 1.25, 'stroke-dasharray="3 3"') : '',
        C(Tx, Hy, 5, 'f-none s-ink', 1.5), C(g.H[0], g.H[1], 4.5, 'f-c1', 0),
        T(Tx + 10, Hy - 12, '목표', { c: 'b', s: 12.5 }),
        T(24, 64, '종이 팔 (위에서 본 모습)', { c: 'q', s: 12.5 }),
        // 힘 막대
        T(338, 140, '누르는 힘', { c: 'q', s: 12.5 }),
        `<rect x="338" y="150" width="${Math.max(1.5, Math.min(120, F * 1.8))}" height="14" rx="2" class="f-c2" fill-opacity="0.75"/>`,
        T(338, 186, 'F = ' + f2(F) + ' N', { c: 'f-c2 b', s: 14 }),
        // 목표 깊이 나누기
        T(X0, 252, '목표 깊이 d = ' + f1(d) + ' cm를 두 용수철이 나눠 가진다', { c: 'q', s: 12.5 }),
        L(X0, yb - 12, X0, yb + 12, 'ink', 1.25),
        a > 0.5 ? `<rect x="${X0}" y="${yb - 8}" width="${a}" height="16" class="f-c1" fill-opacity="0.55"/>` : '',
        b > 0.5 ? `<rect x="${X0 + a}" y="${yb - 8}" width="${b}" height="16" class="f-axis" fill-opacity="0.6"/>` : '',
        d > 0 ? L(X0 + a + b, yb - 12, X0 + a + b, yb + 12, 'ink', 1.25) : '',
        C(334, yb - 10, 5, 'f-c1', 0), T(344, yb - 5, '제어 용수철 d − δ', { s: 12.5 }),
        C(334, yb + 12, 5, 'f-axis', 0), T(344, yb + 17, '벽 눌림 δ', { s: 12.5 }),
      ];
      return svg(id, [36, 270], b1.join(''), '제어 용수철과 벽 용수철이 목표 깊이를 나눠 가지고, 둘의 힘은 같다');
    },
    readout: ({ kp, kw, d }) => {
      const F = kp * kw / (kp + kw) * d, del = F / kw;
      return `<div><b>누르는 힘</b> F = k<sub>p</sub>k<sub>w</sub>/(k<sub>p</sub> + k<sub>w</sub>) × d = <b class="c2">${f2(F)} N</b></div>` +
        `<div><span class="c1">제어 용수철 늘어남 d − δ = <b>${(d - del).toFixed(3)} cm</b></span> · 벽 눌림 δ = <b>${del.toFixed(3)} cm</b> <span class="q">(무른 쪽이 더 많이 늘어난다)</span></div>`;
    },
  });

  // 1자유도 힘 제어 시뮬레이션: m ẍ = F − F_s − 마찰, F = F_d + k_f(F_d − F_s) − k_v ẋ, F_s = k_e x (x > 0)
  const M3 = 0.5, KE3 = 5000, FD3 = 2, T3 = 0.3, DT3 = 1e-4, cache3 = {};
  const sim3 = (kf, kv, fr) => {
    const key = kf + '|' + kv + '|' + fr;
    if (cache3[key]) return cache3[key];
    let x = 0, v = 0;
    const out = [], n = Math.round(T3 / DT3);
    for (let i = 0; i <= n; i++) {
      const Fs = x > 0 ? KE3 * x : 0;
      if (i % 10 === 0) out.push([i * DT3, Fs]);
      const Fn = FD3 + kf * (FD3 - Fs) - kv * v - Fs;
      let acc;
      if (v === 0) acc = Math.abs(Fn) <= fr ? 0 : (Fn - fr * Math.sign(Fn)) / M3;
      else acc = (Fn - fr * Math.sign(v)) / M3;
      let vn = v + acc * DT3;
      if (v !== 0 && Math.sign(vn) !== Math.sign(v)) vn = 0;   // 마찰은 방향을 뒤집지 못한다: 멈춘다
      v = vn; x += v * DT3;
      if (!isFinite(x) || Math.abs(x) > 1) { x = 0; v = 0; }   // 안전장치
    }
    return (cache3[key] = out);
  };
  FIG.fig16_3 = el => interactive(el, {
    state: { kf: 1, kv: 30, fr: 0.5 },
    sliders: [
      { key: 'kf', label: '힘 이득', min: 0, max: 9, step: 0.5, unit: '' },
      { key: 'kv', label: '감쇠 (N·s/m)', min: 0, max: 150, step: 5, unit: '' },
      { key: 'fr', label: '마찰', min: 0, max: 2.5, step: 0.1, unit: ' N' },
    ],
    draw: ({ kf, kv, fr }) => {
      const id = 'f163', X0 = 66, X1 = 452, Y0 = 280, ky = 52;
      const X = t => X0 + (X1 - X0) * t / T3, Y = F => Y0 - ky * Math.min(4.6, Math.max(0, F));
      const data = sim3(kf, kv, fr), e = fr / (1 + kf);
      const b = [
        e > 0.005 ? `<rect x="${X0}" y="${Y(FD3 + e)}" width="${X1 - X0}" height="${Y(FD3 - e) - Y(FD3 + e)}" class="f-c2" fill-opacity="0.12"/>` : '',
        L(X0, Y0, X1 + 8, Y0, 'axis', 1.25), L(X0, Y0, X0, Y(4.6) - 6, 'axis', 1.25),
        ...[1, 3, 4].map(v => L(X0, Y(v), X1, Y(v), 'grid', 1, 'stroke-dasharray="3 4"')),
        ...[0, 1, 2, 3, 4].map(v => T(X0 - 8, Y(v) + 4, String(v), { a: 'end', c: 'q', s: 12.5 })),
        ...[0, 0.1, 0.2, 0.3].map(v => T(X(v), Y0 + 20, String(v), { a: 'middle', c: 'q', s: 12.5 })),
        T(X1, Y0 + 40, '시간 t (s)', { a: 'end', c: 'q', s: 12.5 }),
        T(X0 + 6, Y(4.6) - 12, '접촉 힘 ' + sub('F', 's') + ' (N)', { c: 'q', s: 12.5 }),
        L(X0, Y(FD3), X1, Y(FD3), 'c2', 1.5, 'stroke-dasharray="6 4"'),
        T(X1, Y(4.6) - 12, '점선: 목표 ' + sub('F', 'd') + ' = 2 N', { a: 'end', c: 'f-c2 b', s: 12.5 }),
        poly(data.map(([t, F]) => [X(t), Y(F)]), 's-c1', 2),
      ];
      return svg(id, [16, 308], b.join(''), '힘 이득, 감쇠, 마찰에 따라 접촉 힘이 목표 2 N으로 가는 모양이 바뀐다');
    },
    readout: ({ kf, kv, fr }) => {
      const data = sim3(kf, kv, fr), peak = Math.max(...data.map(d => d[1])), last = data[data.length - 1][1];
      const w = Math.sqrt((1 + kf) * KE3 / M3), z = kv / (2 * Math.sqrt((1 + kf) * KE3 * M3)), e = fr / (1 + kf);
      return `<div><b>흔들림</b> ω = √((1 + k<sub>f</sub>)k<sub>e</sub>/m) = ${w.toFixed(0)} rad/s · 감쇠비 ζ = <b>${f2(z)}</b> <span class="q">(0.7쯤이면 알맞다)</span></div>` +
        `<div><span class="c1">최대 <b>${f2(peak)} N</b>, 0.3초 뒤 <b>${f2(last)} N</b></span> · <span class="c2">마찰로 남을 수 있는 오차 ±${f2(e)} N</span></div>`;
    },
  });

  // 그림 16-4 닿는 모양에 따라 잃는 자유도
  FIG.fig16_4 = el => {
    const id = 'f164';
    const table = cx => `<path d="M${cx - 70} 214L${cx + 44} 214L${cx + 70} 186L${cx - 44} 186Z" class="f-tint s-axis" stroke-width="1.25"/>`;
    const slide = cx => L(cx - 6, 226, cx + 40, 226, 'c1', 2, AA(id, 'c1')) + L(cx + 46, 236, cx + 70, 210, 'c1', 2, AA(id, 'c1'));
    const down = (x, y) => L(x, y - 42, x, y - 4, 'c2', 2.5, A(id, 'c2'));
    const foot = (cx, a, b, c) => T(cx, 262, a, { a: 'middle', c: 'b', s: 14 }) + T(cx, 282, b, { a: 'middle', c: 'q', s: 12.5 }) +
      T(cx, 302, c, { a: 'middle', s: 12.5 });
    // 공
    const p1 = 80, ball = [table(p1), `<circle cx="${p1}" cy="176" r="24" class="f-c1 s-c1" fill-opacity="0.18" stroke-width="1.5"/>`,
      C(p1, 200, 3.5, 'f-c2', 0), down(p1, 152), slide(p1),
      foot(p1, '공', '점으로 닿는다', '움직임 5 · 힘 1')];
    // 눕힌 원기둥 (축이 x 방향)
    const p2 = 240, cy2 = 180;
    const cyl = [table(p2),
      `<path d="M${p2 - 46} ${cy2 - 30}L${p2 + 38} ${cy2 - 30}A9 15 0 0 1 ${p2 + 38} ${cy2}L${p2 - 46} ${cy2}Z" class="f-c1 s-c1" fill-opacity="0.18" stroke-width="1.5"/>`,
      `<ellipse cx="${p2 - 46}" cy="${cy2 - 15}" rx="9" ry="15" class="f-c1 s-c1" fill-opacity="0.3" stroke-width="1.5"/>`,
      L(p2 - 46, cy2 + 1, p2 + 38, cy2 + 1, 'c2', 3, 'stroke-linecap="round"'),
      down(p2 - 4, cy2 - 30),
      arc(p2 - 4, cy2 - 15, 34, 145 * D, 35 * D, 'c2', 2, A(id, 'c2')),
      slide(p2),
      foot(p2, '눕힌 원기둥', '선으로 닿는다', '움직임 4 · 힘 2')];
    // 상자
    const p3 = 400, bxl = p3 - 40, bxr = p3 + 26, top3 = 150, bot3 = 200, dep = 16;
    const box = [table(p3),
      `<path d="M${bxl} ${bot3}L${bxr} ${bot3}L${bxr + dep} ${bot3 - dep}L${bxl + dep} ${bot3 - dep}Z" class="f-c2" fill-opacity="0.35"/>`,
      `<path d="M${bxl} ${top3}L${bxr} ${top3}L${bxr} ${bot3}L${bxl} ${bot3}Z" class="f-c1 s-c1" fill-opacity="0.18" stroke-width="1.5"/>`,
      `<path d="M${bxr} ${top3}L${bxr + dep} ${top3 - dep}L${bxr + dep} ${bot3 - dep}L${bxr} ${bot3}Z" class="f-c1 s-c1" fill-opacity="0.28" stroke-width="1.5"/>`,
      `<path d="M${bxl} ${top3}L${bxl + dep} ${top3 - dep}L${bxr + dep} ${top3 - dep}L${bxr} ${top3}Z" class="f-c1 s-c1" fill-opacity="0.1" stroke-width="1.5"/>`,
      L(p3 - 2, top3 - 44, p3 - 2, top3 - 4, 'c2', 2.5, A(id, 'c2')),
      arc(p3 - 8, 176, 44, 150 * D, 112 * D, 'c2', 2, A(id, 'c2')),
      `<path d="M${p3 + 44} 132 A10 24 0 0 1 ${p3 + 48} 176" fill="none" class="s-c2" stroke-width="2" ${A(id, 'c2')}/>`,
      slide(p3),
      foot(p3, '상자', '면으로 닿는다', '움직임 3 · 힘 3')];
    el.innerHTML += svg(id, [80, 236], [
      L(160, 96, 160, 306, 'grid', 1), L(320, 96, 320, 306, 'grid', 1),
      ...ball, ...cyl, ...box,
    ].join(''), '공은 하나, 눕힌 원기둥은 둘, 상자는 셋의 자유도를 움직임에서 힘으로 넘긴다');
  };

  // 그림 16-5 비스듬한 판에 펜 대기: Ω와 Ω̃ (슬라이더)
  const Q5 = [30 * D, 60 * D], H5 = [10 * Math.cos(Q5[0]) + 8 * Math.cos(Q5[0] + Q5[1]), 10 * Math.sin(Q5[0]) + 8 * Math.sin(Q5[0] + Q5[1])];
  const FM5 = [1, 0.6];
  FIG.fig16_5 = el => interactive(el, {
    state: { al: 20, fd: 1 },
    sliders: [
      { key: 'al', label: '판의 기울기 α', min: -45, max: 40, step: 5, unit: '°' },
      { key: 'fd', label: '누르는 힘', min: 0, max: 2, step: 0.1, unit: ' N' },
    ],
    draw: ({ al, fd }) => {
      const id = 'f165', s = 12, bx = 96, by = 298, k = 50;
      const a = al * D, t = [Math.cos(a), Math.sin(a)], n = [-Math.sin(a), Math.cos(a)];
      const e = elbowOf(Q5), E = [bx + s * e[0], by - s * e[1]], H = [bx + s * H5[0], by - s * H5[1]];
      const tm = t[0] * FM5[0] + t[1] * FM5[1], Fm = [tm * t[0], tm * t[1]], Ff = [fd * n[0], fd * n[1]], F = [Fm[0] + Ff[0], Fm[1] + Ff[1]];
      const P = v => [H[0] + k * v[0], H[1] - k * v[1]];
      const pr = P(FM5), pm = P(Fm), pf = P(Ff), pF = P(F);
      // 글자: 화살표 끝 p에서 수학 방향 u로 off만큼 (u는 단위 벡터가 아니어도 된다)
      const lab = (p, u, txt, cls, off) => {
        const m = Math.hypot(u[0], u[1]) || 1;
        return T(p[0] + off * u[0] / m, p[1] - off * u[1] / m + 5, txt, { a: 'middle', c: cls, s: 13 });
      };
      const sgn = tm >= 0 ? 1 : -1;
      const b = [
        `<rect x="${H[0] - 400}" y="${H[1] - 400}" width="800" height="400" transform="rotate(${-al} ${H[0]} ${H[1]})" class="f-tint s-axis" stroke-width="1.25"/>`,
        L(H[0] - 400 * t[0], H[1] + 400 * t[1], H[0] + 400 * t[0], H[1] - 400 * t[1], 'ink', 1.5),
        T(H[0] - 120 * t[0] + 30 * n[0], H[1] + 120 * t[1] - 30 * n[1] + 5, '판', { a: 'middle', c: 'b', s: 14 }),
        base(bx, by), link(bx, by, E[0], E[1], 'axis', 9), link(E[0], E[1], H[0], H[1], 'axis', 9), joint(bx, by, 6.5), joint(E[0], E[1], 5.5),
        L(H[0], H[1], pr[0], pr[1], 'axis', 1.75, 'stroke-dasharray="4 3" ' + A(id, 'axis')),
        Math.abs(tm) > 0.05 ? L(H[0], H[1], pm[0], pm[1], 'c1', 2.75, A(id, 'c1')) : '',
        fd > 0.05 ? L(H[0], H[1], pf[0], pf[1], 'c2', 2.75, A(id, 'c2')) : '',
        fd > 0.05 && Math.abs(tm) > 0.05 ? L(pm[0], pm[1], pF[0], pF[1], 'ink', 1, 'stroke-dasharray="3 3"') + L(pf[0], pf[1], pF[0], pF[1], 'ink', 1, 'stroke-dasharray="3 3"') : '',
        fd > 0.05 ? L(H[0], H[1], pF[0], pF[1], 'ink', 2, A(id, 'ink')) : '',
        C(H[0], H[1], 4.5, 'f-ink', 0),
        Math.abs(tm) > 0.05 ? lab(pm, [sgn * t[0] - 1.2 * n[0], sgn * t[1] - 1.2 * n[1]], fd > 0.05 ? 'ΩF′' : 'F = ΩF′', 'f-c1 b', fd > 0.05 ? 22 : 34) : '',
        fd > 0.05 ? lab(pf, [n[0] - 1.3 * sgn * t[0], n[1] - 1.3 * sgn * t[1]], sub('F', 'd') + 'n', 'f-c2 b', 24) : '',
        fd > 0.05 ? lab(pF, F, 'F', 'b', 14) : '',
      ];
      return svg(id, [14, 300], b.join(''), '판 방향으로는 움직임 제어만, 판에 수직으로는 힘 제어만 남긴다');
    },
    readout: ({ al, fd }) => {
      const a = al * D, c = Math.cos(a), s = Math.sin(a), tm = c * FM5[0] + s * FM5[1];
      const F = [tm * c - fd * s, tm * s + fd * c], J = jac(Q5), tau = [J[0][0] * F[0] + J[1][0] * F[1], J[0][1] * F[0] + J[1][1] * F[1]];
      return `<div class="matrow"><b>Ω</b> = ${matrix2(f2(c * c), f2(c * s), f2(c * s), f2(s * s), ['c1', 'c1'])}<b>Ω̃ = I − Ω</b> = ${matrix2(f2(s * s), f2(-c * s), f2(-c * s), f2(c * c), ['c2', 'c2'])}</div>` +
        `<div><span class="c1">ΩF′ = (${f2(tm * c)}, ${f2(tm * s)})</span> + <span class="c2">F<sub>d</sub>n = (${f2(-fd * s)}, ${f2(fd * c)})</span> = <b>F = (${f2(F[0])}, ${f2(F[1])}) N</b></div>` +
        `<div><b>τ = JᵀF</b> = (${f2(tau[0])}, ${f2(tau[1])}) N·cm <span class="q">F′ = (1, 0.6) N은 움직임 제어기가 내놓은 힘</span></div>`;
    },
  });

  // 그림 16-6 부딪힐 때: 실효 질량과 쿠션 두께 (슬라이더)
  const FL6 = 150, K6 = 50000;
  FIG.fig16_6 = el => interactive(el, {
    state: { m: 35, v: 1 },
    sliders: [
      { key: 'm', label: '실효 질량 m', min: 0.5, max: 40, step: 0.5, unit: ' kg' },
      { key: 'v', label: '부딪히는 속도 v', min: 0.1, max: 2, step: 0.1, unit: ' m/s' },
    ],
    draw: ({ m, v }) => {
      const id = 'f166', X0 = 64, X1 = 440, Y0 = 268, ky = 5, top = 40;
      const X = mm => X0 + (X1 - X0) * mm / 40, Y = cm => Y0 - ky * Math.min(top, cm);
      const need = mm => 100 * mm * v * v / FL6;
      const mEnd = Math.min(40, top * FL6 / (100 * v * v));
      const cur = need(m), clipped = cur > top;
      const marks = [[1.5, '공기 근육 팔', 14, 'start'], [3.5, 'DM²', 32, 'start'], [35, 'PUMA급', 14, 'end']];
      const b = [
        L(X0, Y0, X1 + 8, Y0, 'axis', 1.25), L(X0, Y0, X0, Y(top) - 8, 'axis', 1.25),
        ...[10, 20, 30, 40].map(c => L(X0, Y(c), X1, Y(c), 'grid', 1, 'stroke-dasharray="3 4"')),
        ...[0, 10, 20, 30, 40].map(c => T(X0 - 8, Y(c) + 4, String(c), { a: 'end', c: 'q', s: 12.5 })),
        ...[0, 10, 20, 30, 40].map(mm => T(X(mm), Y0 + 20, String(mm), { a: 'middle', c: 'q', s: 12.5 })),
        T(X1 + 8, Y0 + 40, '실효 질량 (kg)', { a: 'end', c: 'q', s: 12.5 }),
        T(X0 + 6, Y(top) - 14, '150 N 아래로 묶는 데 필요한 쿠션 (cm)', { c: 'q', s: 12.5 }),
        ...marks.map(([mm, lab, dy, an]) => L(X(mm), Y0, X(mm), Y(top) + dy - 10, 'axis', 1, 'stroke-dasharray="2 4"') +
          T(X(mm) + (an === 'start' ? 5 : -5), Y(top) + dy, lab, { a: an, c: 'q', s: 12.5 })),
        L(X(0), Y(0), X(mEnd), Y(need(mEnd)), 'c2', 2.25),
        mEnd < 40 ? T(X(mEnd) + 6, Y(top) + 14, '↑', { c: 'f-c2 b', s: 13 }) : '',
        L(X(m), Y0, X(m), Y(cur), 'ink', 1, 'stroke-dasharray="3 3"'),
        L(X0, Y(cur), X(m), Y(cur), 'ink', 1, 'stroke-dasharray="3 3"'),
        C(X(m), Y(cur), 5.5, 'f-c2', 0),
        clipped ? '' : T(X(m) + (m > 30 ? -10 : 10), Y(cur) - 10, f1(cur) + ' cm', { a: m > 30 ? 'end' : 'start', c: 'f-c2 b', s: 14 }),
      ];
      return svg(id, [20, 300], b.join(''), '실효 질량이 크면 같은 속도에서 필요한 쿠션 두께가 그만큼 커진다');
    },
    readout: ({ m, v }) => {
      const Fp = v * Math.sqrt(m * K6), need = 100 * m * v * v / FL6;
      return `<div><b>운동 에너지</b> ½mv² = ${f2(0.5 * m * v * v)} J</div><div class="c2">얇은 덮개(50 kN/m)라면 최대 힘 v√(mk) = <b>${Fp.toFixed(0)} N</b></div>` +
        `<div>150 N 아래로 묶으려면 쿠션이 <b>mv²/150 = ${f1(need)} cm</b> 눌려야 한다 <span class="q">(150 N은 예로 정한 한계)</span></div>`;
    },
  });

  // 그림 16-7 매크로-미니 구동
  FIG.fig16_7 = el => {
    const id = 'f167';
    const jx = 150, jy = 120, tipx = 228, tipy = 86;
    const wave = (x0, y0, w, f, amp, ph = 0, fn = Math.sin) => {
      const pts = [];
      for (let i = 0; i <= 120; i++) { const u = i / 120; pts.push([x0 + w * u, y0 - amp * fn(2 * Math.PI * f * u + ph)]); }
      return pts;
    };
    const big = u => Math.sin(2 * Math.PI * u) * 0.8 + 0.4, small = u => 0.18 * Math.sin(2 * Math.PI * 9 * u) * Math.exp(-((u - 0.55) ** 2) / 0.02) + 0.06 * Math.sin(2 * Math.PI * 14 * u);
    const plot = (y0, f, lab, cls, k = 26) => {
      const pts = [];
      for (let i = 0; i <= 160; i++) { const u = i / 160; pts.push([270 + 190 * u, y0 - k * f(u)]); }
      return L(270, y0, 462, y0, 'grid', 1) + poly(pts, cls, 2) + T(270, y0 - 38, lab, { c: cls === 's-ink' ? 'b' : cls === 's-c2' ? 'f-c2 b' : 'f-c1 b', s: 13 });
    };
    el.innerHTML += svg(id, [40, 274], [
      T(120, 60, '(가) 팔의 생김새', { a: 'middle', c: 'b', s: 15 }), T(366, 60, '(나) 토크 나눠 맡기', { a: 'middle', c: 'b', s: 15 }),
      L(250, 72, 250, 300, 'grid', 1),
      // 받침과 큰 모터
      `<rect x="20" y="236" width="110" height="16" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      `<circle cx="56" cy="206" r="26" class="f-c2 s-c2" fill-opacity="0.2" stroke-width="1.75"/>`, T(56, 211, '큰', { a: 'middle', c: 'f-c2 b', s: 13 }),
      T(56, 276, '큰 모터 (받침)', { a: 'middle', c: 'f-c2 b', s: 12.5 }),
      // 용수철과 줄
      spring(82, 206, 120, 206, 4, 6, 'ink', 1.5), L(120, 206, 138, 206, 'ink', 1.5),
      L(138, 206, jx - 10, jy + 4, 'ink', 1.25), L(138, 206, jx + 10, jy + 8, 'ink', 1.25),
      T(100, 186, '탄성', { a: 'middle', s: 12.5 }),
      // 링크와 관절
      `<rect x="${jx - 12}" y="${jy - 2}" width="24" height="122" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
      link(jx, jy, tipx, tipy, 'c1', 12),
      C(jx, jy, 12, 'f-none s-ink', 1.5), C(jx, jy, 6, 'f-c1', 0),
      T(jx - 20, jy - 2, '작은 모터', { a: 'end', c: 'f-c1 b', s: 12.5 }), T(jx - 20, jy + 15, '(관절)', { a: 'end', c: 'f-c1 b', s: 12.5 }),
      // 부딪힘
      L(tipx + 26, tipy - 4, tipx + 6, tipy - 1, 'ink', 2, A(id, 'ink')), T(tipx + 2, tipy + 26, '부딪힘', { a: 'middle', s: 12.5 }),
      T(150, 300, '가벼운 팔 + 용수철 뒤에 숨은 큰 모터', { a: 'middle', c: 'q', s: 12.5 }),
      // 토크 그래프
      plot(130, big, '큰 모터: 느리고 크게', 's-c2'),
      plot(200, small, '작은 모터: 빠르고 작게', 's-c1'),
      plot(278, u => big(u) + small(u), '합: 관절에 걸리는 토크', 's-ink', 22),
      T(462, 306, '시간 →', { a: 'end', c: 'q', s: 12.5 }),
    ].join(''), '큰 모터는 받침에서 탄성을 거쳐 느리고 큰 토크를, 작은 모터는 관절에서 빠르고 작은 토크를 낸다');
  };

  // 그림 16-8 손끝은 고정, 자세만 움직이기: 3관절 팔의 영공간 (슬라이더)
  const H8 = [12, 4];
  const pose8 = t1 => {
    const E = [8 * Math.cos(t1), 8 * Math.sin(t1)], d = [H8[0] - E[0], H8[1] - E[1]], r = Math.hypot(d[0], d[1]);
    const c = Math.max(-1, Math.min(1, (r * r - 74) / 70)), q3 = -Math.acos(c);
    const a = Math.atan2(d[1], d[0]) - Math.atan2(5 * Math.sin(q3), 7 + 5 * Math.cos(q3));
    const W = [E[0] + 7 * Math.cos(a), E[1] + 7 * Math.sin(a)];
    const P = [[0, 0], E, W], J = [P.map(p => -(H8[1] - p[1])), P.map(p => H8[0] - p[0])];
    const nv = [J[0][1] * J[1][2] - J[0][2] * J[1][1], J[0][2] * J[1][0] - J[0][0] * J[1][2], J[0][0] * J[1][1] - J[0][1] * J[1][0]];
    const nn = nv.map(v => v / nv[0]);
    return { q: [t1, a - t1, q3], E, W, J, n: nn };
  };
  FIG.fig16_8 = el => interactive(el, {
    state: { t1: 50 },
    sliders: [{ key: 't1', label: '어깨 θ₁ (자세)', min: -40, max: 75, unit: '°' }],
    draw: ({ t1 }) => {
      const id = 'f168', s = 14, bx = 100, by = 196, P = ([x, y]) => [bx + s * x, by - s * y];
      const g = pose8(t1 * D), E = P(g.E), W = P(g.W), Hh = P(H8);
      const ghost = [-30, 0, 30, 70].map(a => { const h = pose8(a * D), e = P(h.E), w = P(h.W); return poly([[bx, by], e, w, Hh], 's-grid', 2, 'stroke-linejoin="round"'); }).join('');
      // 영공간을 따라 0.1 rad만큼 움직일 때 점들의 속도 (화면, 축척 k)
      const k = 0.5 * s, vE = [-g.E[1] * g.n[0], g.E[0] * g.n[0]];
      const a12 = g.n[0] + g.n[1], vW = [vE[0] - (g.W[1] - g.E[1]) * a12, vE[1] + (g.W[0] - g.E[0]) * a12];
      const arrow = (p, v) => { const len = Math.hypot(v[0], v[1]) * k, cap = Math.min(1, 60 / (len || 1)); return len > 3 ? L(p[0], p[1], p[0] + v[0] * k * cap, p[1] - v[1] * k * cap, 'c2', 2.5, A(id, 'c2')) : ''; };
      return svg(id, [48, 234], [
        L(30, by, 400, by, 'grid', 1),
        ghost,
        base(bx, by), link(bx, by, E[0], E[1], 'c1', 9), link(E[0], E[1], W[0], W[1], 'c1', 9), link(W[0], W[1], Hh[0], Hh[1], 'c1', 9),
        joint(bx, by, 6.5), joint(E[0], E[1], 6), joint(W[0], W[1], 6),
        arrow(E, vE), arrow(W, vW),
        C(Hh[0], Hh[1], 12, 'f-none s-ink', 1.5), C(Hh[0], Hh[1], 4, 'f-ink', 0),
        T(Hh[0] + 18, Hh[1] + 5, '손끝 (12, 4) cm 고정', { c: 'b', s: 13 }), T(Hh[0] + 18, Hh[1] + 25, '= 과제', { c: 'q', s: 12.5 }),
        T(300, 66, '주황 화살표: 자세가 바뀌는 쪽', { c: 'f-c2', s: 12.5 }), T(300, 86, '회색: 같은 손끝의 다른 자세', { c: 'q', s: 12.5 }),
      ].join(''), '손끝을 고정한 채 팔의 자세만 바꿀 수 있다');
    },
    readout: ({ t1 }) => {
      const g = pose8(t1 * D), Jn = [0, 1].map(r => g.J[r][0] * g.n[0] + g.J[r][1] * g.n[1] + g.J[r][2] * g.n[2]);
      const qd = g.q.map(v => Math.round(v / D));
      return `<div><b>관절</b> θ = (${qd[0]}°, ${qd[1]}°, ${qd[2]}°) · <b>영공간 속도</b> θ̇ = <span class="c2">(1, ${f2(g.n[1])}, ${f2(g.n[2])}) rad/s</span></div>` +
        `<div>J θ̇ = (${f2(Jn[0])}, ${f2(Jn[1])}) cm/s <span class="q">이렇게 돌리면 손끝은 움직이지 않는다</span></div>`;
    },
  });

  // 그림 16-9 여러 곳이 닿는 휴머노이드
  FIG.fig16_9 = el => {
    const id = 'f169';
    const hip = [196, 176], neck = [204, 98], head = [206, 74];
    const kneeL = [176, 220], footL = [160, 262], kneeR = [222, 222], footR = [244, 262];
    const shR = [210, 106], elR = [254, 120], handR = [300, 112];   // 벽 짚는 손
    const shL = [198, 106], elL = [160, 138], handL = [120, 116];   // 뻗는 손
    const limb = (pts, c) => poly(pts, 's-' + c, 6, 'stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.35"') + poly(pts, 's-' + c, 2, 'stroke-linejoin="round"');
    const com = [200, 150];
    el.innerHTML += svg(id, [40, 262], [
      `<rect x="30" y="262" width="400" height="12" class="f-tint s-axis" stroke-width="1.25"/>`,
      `<rect x="300" y="50" width="14" height="212" class="f-tint s-axis" stroke-width="1.25"/>`,
      T(324, 66, '벽', { c: 'q', s: 12.5 }), T(400, 292, '바닥', { a: 'middle', c: 'q', s: 12.5 }),
      limb([hip, kneeL, footL], 'axis'), limb([hip, kneeR, footR], 'axis'),
      limb([hip, neck], 'axis'), C(head[0], head[1], 16, 'f-tint s-axis', 1.5),
      limb([shR, elR, handR], 'axis'), limb([shL, elL, handL], 'c1'),
      joint(hip[0], hip[1], 5), joint(kneeL[0], kneeL[1], 4.5), joint(kneeR[0], kneeR[1], 4.5), joint(elR[0], elR[1], 4.5), joint(elL[0], elL[1], 4.5),
      // 닿는 곳의 힘 (바깥이 몸을 미는 힘)
      L(footL[0], footL[1] + 30, footL[0], footL[1] + 2, 'c2', 2.5, A(id, 'c2')),
      L(footR[0], footR[1] + 30, footR[0], footR[1] + 2, 'c2', 2.5, A(id, 'c2')),
      L(handR[0] + 40, handR[1], handR[0] + 2, handR[1], 'c2', 2.5, A(id, 'c2')),
      C(footL[0], footL[1], 4, 'f-c2', 0), C(footR[0], footR[1], 4, 'f-c2', 0), C(handR[0], handR[1], 4, 'f-c2', 0),
      // 과제: 뻗는 손
      C(76, 110, 7, 'f-none s-c1', 1.75), L(handL[0] - 6, handL[1] - 1, 88, 111, 'c1', 2.25, A(id, 'c1')),
      T(76, 90, '목표', { a: 'middle', c: 'f-c1 b', s: 12.5 }),
      // 질량 중심
      C(com[0], com[1], 6, 'f-ink', 0), L(com[0], com[1] + 8, com[0], 262, 'ink', 1, 'stroke-dasharray="3 4"'),
      T(com[0] + 10, com[1] + 4, '질량 중심', { s: 12.5 }),
      L(footL[0], 270, footR[0], 270, 'c2', 4, 'stroke-opacity="0.5"'),
      // 설명
      T(40, 66, '파랑: 과제 (손을 목표로)', { c: 'f-c1', s: 12.5 }),
      T(40, 300, '주황: 닿는 곳의 힘', { c: 'f-c2', s: 12.5 }),
    ].join(''), '두 발과 한 손이 닿은 채, 다른 손을 목표로 뻗는 휴머노이드');
  };
})();
