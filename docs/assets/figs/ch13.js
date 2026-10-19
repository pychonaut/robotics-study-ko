// 13장 그림: 제어의 첫걸음 (피드백, 관절의 용수철, 질량-용수철-댐퍼, 감쇠비, 에너지와 안정성, PD 제어)
(function () {
  const { D, f1, f2, svg, T, L, A, C, joint, link, interactive, sub } = FigKit;
  const FIG = window.FIG;

  const dash = 'stroke-dasharray="4 4"';
  const mn = v => String(v).replace('-', '−');
  const m1 = v => mn(f1(v)), m2 = v => mn(f2(v));
  const path = (pts, cls, w = 1.5, more = '') =>
    `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" class="${cls}" stroke-width="${w}" stroke-linejoin="round" ${more}/>`;
  const area = (pts, cls, more = '') => `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}Z" class="${cls}" ${more}/>`;
  const rect = (x, y, w, h, cls, more = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" ${more}/>`;

  // 그래프 틀: 가로 t, 세로 v. 눈금, 0선, 제목까지 그린다.
  const frame = o => {
    const X = t => o.x + (t - o.t0) / (o.t1 - o.t0) * o.w, Y = v => o.y + o.h - (v - o.v0) / (o.v1 - o.v0) * o.h;
    const b = [];
    (o.yt || []).forEach(([v, txt]) => b.push(L(o.x, Y(v), o.x + o.w, Y(v), 'grid', 1), T(o.x - 6, Y(v) + 4.5, txt, { a: 'end', c: 'q', s: 12.5 })));
    b.push(L(o.x, o.y, o.x, o.y + o.h, 'axis', 1.25));
    const z = o.v0 <= 0 && o.v1 >= 0 ? Y(0) : o.y + o.h;
    b.push(L(o.x, z, o.x + o.w, z, 'axis', 1.25));
    (o.xt || []).forEach(([t, txt]) => b.push(L(X(t), o.y + o.h, X(t), o.y + o.h + 4, 'axis', 1), T(X(t), o.y + o.h + 18, txt, { a: 'middle', c: 'q', s: 12.5 })));
    if (o.title) b.push(T(o.x, o.y - 10, o.title, { c: 'b', s: 13 }));
    const clip = `<clipPath id="${o.id}"><rect x="${o.x}" y="${o.y - 2}" width="${o.w}" height="${o.h + 4}"/></clipPath>`;
    const line = (pts, cls, w = 2, more = '') => path(pts.map(([t, v]) => [X(t), Y(v)]), cls, w, `clip-path="url(#${o.id})" ${more}`);
    const fill = (top, bot, cls, op = 0.35) =>
      area(top.map(([t, v]) => [X(t), Y(v)]).concat(bot.slice().reverse().map(([t, v]) => [X(t), Y(v)])), cls, `fill-opacity="${op}" stroke="none" clip-path="url(#${o.id})"`);
    return { X, Y, svg: clip + b.join(''), line, fill, x: o.x, y: o.y, w: o.w, h: o.h };
  };

  // m ẍ + b ẋ + k x = 0 을 룽게-쿠타 4단으로 푼다. every 걸음마다 [t, x, v]를 남긴다.
  const simulate = (m, b, k, x0, T, dt, every) => {
    const acc = (x, v) => -(b * v + k * x) / m, out = [[0, x0, 0]];
    let x = x0, v = 0;
    const n = Math.round(T / dt);
    for (let i = 1; i <= n; i++) {
      const a1 = acc(x, v), x2 = x + dt / 2 * v, v2 = v + dt / 2 * a1;
      const a2 = acc(x2, v2), x3 = x + dt / 2 * v2, v3 = v + dt / 2 * a2;
      const a3 = acc(x3, v3), x4 = x + dt * v3, v4 = v + dt * a3, a4 = acc(x4, v4);
      x += dt / 6 * (v + 2 * v2 + 2 * v3 + v4);
      v += dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4);
      if (i % every === 0) out.push([i * dt, x, v]);
    }
    return out;
  };
  // 같은 슬라이더 값이면 다시 계산하지 않는다
  const memo = f => { let key = null, val = null; return (...a) => { const k = a.join(','); if (k !== key) { key = k; val = f(...a); } return val; }; };

  // 1에서 멈춘 채로 놓았을 때의 정확한 답 (ω_n, ζ)
  const exact = (wn, z, t) => {
    if (z < 1) { const s = z * wn, wd = wn * Math.sqrt(1 - z * z); return Math.exp(-s * t) * (Math.cos(wd * t) + s / wd * Math.sin(wd * t)); }
    if (z === 1) return (1 + wn * t) * Math.exp(-wn * t);
    const q = Math.sqrt(z * z - 1), r1 = -wn * (z - q), r2 = -wn * (z + q);
    return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
  };
  const kind = z => z < 0.005 ? '감쇠 없음: 영원히 흔들린다' : z < 0.995 ? '부족 감쇠: 흔들리며 잦아든다' : z <= 1.005 ? '임계 감쇠: 넘어가지 않는 가장 빠른 움직임' : '과감쇠: 넘어가지 않고 천천히 다가간다';

  // 부품: 벽, 바닥, 용수철, 댐퍼, 덩어리
  const wall = (x, y1, y2) => {
    const h = [];
    for (let y = y1 + 4; y + 8 <= y2; y += 10) h.push(L(x - 10, y + 8, x, y, 'axis', 1));
    return rect(x - 10, y1, 10, y2 - y1, 'f-tint', 'stroke="none"') + h.join('') + L(x, y1, x, y2, 'axis', 1.75);
  };
  const springH = (x1, x2, y, n = 9, amp = 8, c = 'ink', w = 1.75) => {
    const lead = Math.min(12, (x2 - x1) * 0.12), a = x1 + lead, b = x2 - lead, pts = [[x1, y], [a, y]];
    for (let i = 1; i < 2 * n; i++) pts.push([a + (b - a) * i / (2 * n), y + (i % 2 ? -amp : amp)]);
    pts.push([b, y], [x2, y]);
    return path(pts, `f-none s-${c}`, w);
  };
  const zig = (P, Q, n = 7, amp = 6, c = 'c2', w = 1.75) => {
    const dx = Q[0] - P[0], dy = Q[1] - P[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, lead = Math.min(10, len * 0.15);
    const at = (s, o) => [P[0] + ux * s - uy * o, P[1] + uy * s + ux * o], pts = [P, at(lead, 0)];
    for (let i = 1; i < 2 * n; i++) pts.push(at(lead + (len - 2 * lead) * i / (2 * n), i % 2 ? -amp : amp));
    pts.push(at(len - lead, 0), Q);
    return path(pts, `f-none s-${c}`, w);
  };
  // 원호를 따라 지그재그 (비틀림 용수철). 각도는 도, 수학 방향
  const zigArc = (o, r, a0, a1, n = 6, amp = 3.5, c = 'c2', w = 1.75) => {
    const pts = [];
    for (let i = 0; i <= 2 * n; i++) {
      const a = (a0 + (a1 - a0) * i / (2 * n)) * D, rr = r + (i === 0 || i === 2 * n ? 0 : i % 2 ? amp : -amp);
      pts.push([o[0] + rr * Math.cos(a), o[1] - rr * Math.sin(a)]);
    }
    return path(pts, `f-none s-${c}`, w);
  };
  const damperH = (x1, x2, y, c = 'ink') => {
    const mid = (x1 + x2) / 2, cl = mid - 18, cr = mid + 18, h = 16, px = mid + 5;
    return L(x1, y, cl, y, c, 1.75) +
      `<path d="M${cr} ${y - h / 2}H${cl}V${y + h / 2}H${cr}" fill="none" class="s-${c}" stroke-width="1.75"/>` +
      L(px, y - h / 2 + 3, px, y + h / 2 - 3, c, 3) + L(px, y, x2, y, c, 1.75);
  };
  const block = (xc, y, w, h, label = 'm') =>
    `<rect x="${xc - w / 2}" y="${y}" width="${w}" height="${h}" rx="4" class="f-tint" stroke="none"/>` +
    `<rect x="${xc - w / 2}" y="${y}" width="${w}" height="${h}" rx="4" class="f-c1 s-c1" fill-opacity="0.22" stroke-width="1.5"/>` +
    T(xc, y + h / 2 + 5, label, { a: 'middle', c: 'b', s: 15 });

  // ---------------------------------------------------------------
  // 그림 13-1 열린 고리와 닫힌 고리
  FIG.fig13_1 = el => {
    const id = 'f131', y1 = 100, y2 = 236, yb = 306;
    const box = (x, y, w, h, hot) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="${hot ? 'f-c1 s-c1' : 'f-none s-axis'}" ${hot ? 'fill-opacity="0.1"' : ''} stroke-width="1.5"/>`;
    const icon = (x, y) => `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" rx="3" class="f-tint s-axis" stroke-width="1.25"/>` + link(x, y, x + 28, y - 18, 'c1', 8) + joint(x, y, 4.5);
    const enc = (x, y) => C(x, y, 9, 'f-tint s-axis', 1.25) + [0, 60, 120].map(a => L(x + 9 * Math.cos(a * D), y - 9 * Math.sin(a * D), x - 9 * Math.cos(a * D), y + 9 * Math.sin(a * D), 'axis', 1)).join('') + C(x, y, 2.5, 'f-ink', 0);
    el.innerHTML += svg(id, [40, 306], [
      T(16, 60, '(가) 열린 루프: 계산해서 보내기만 한다', { c: 'b' }),
      T(16, y1 + 5, '목표', { c: 'b', s: 13.5 }),
      L(52, y1, 92, y1, 'axis', 1.75, A(id, 'axis')),
      box(94, y1 - 18, 92, 36), T(140, y1 + 5, '제어기', { a: 'middle', s: 13.5 }),
      L(186, y1, 232, y1, 'axis', 1.75, A(id, 'axis')), T(209, y1 - 8, 'τ', { a: 'middle', c: 'b', s: 13 }),
      box(234, y1 - 22, 140, 44), T(246, y1 + 5, '모터 + 팔', { s: 13.5 }), icon(338, y1 + 8),
      L(374, y1, 406, y1, 'axis', 1.75, A(id, 'axis')), T(412, y1 + 5, '움직임', { s: 13.5 }),
      T(304, y1 + 44, '팔이 실제로 어디 있는지 보지 않는다', { a: 'middle', c: 'q', s: 12.5 }),
      L(16, 166, 464, 166, 'grid', 1),
      T(16, 192, '(나) 닫힌 루프: 재고, 견주고, 고친다', { c: 'b' }),
      T(16, y2 + 5, '목표 ' + sub('q', 'd'), { c: 'b', s: 13.5 }),
      L(68, y2, 98, y2, 'ink', 1.75, A(id, 'ink')),
      C(114, y2, 14, 'f-none s-ink', 1.5), L(106, y2, 122, y2, 'ink', 1.25), L(114, y2 - 8, 114, y2 + 8, 'ink', 1.25),
      T(92, y2 - 12, '+', { a: 'middle', c: 'b', s: 15 }), T(130, y2 + 34, '−', { a: 'middle', c: 'b', s: 16 }),
      L(128, y2, 172, y2, 'ink', 1.75, A(id, 'ink')), T(150, y2 - 10, '오차', { a: 'middle', s: 12.5 }),
      box(174, y2 - 24, 90, 48, true), T(219, y2 - 2, '제어기', { a: 'middle', c: 'b', s: 14 }), T(219, y2 + 16, 'τ 계산', { a: 'middle', c: 'q', s: 12.5 }),
      L(264, y2, 294, y2, 'ink', 1.75, A(id, 'ink')), T(279, y2 - 10, 'τ', { a: 'middle', c: 'b', s: 13 }),
      box(296, y2 - 26, 132, 52), T(306, y2 + 5, '모터 + 팔', { s: 13.5 }), icon(392, y2 + 10),
      L(428, y2, 452, y2, 'ink', 1.75), T(440, y2 - 10, 'q', { a: 'middle', c: 'b', s: 14 }),
      L(452, y2, 452, yb, 'ink', 1.75), L(452, yb, 360, yb, 'ink', 1.75, A(id, 'ink')),
      box(226, yb - 18, 132, 36), enc(244, yb), T(260, yb + 5, '센서 (엔코더)', { s: 13 }),
      L(226, yb, 114, yb, 'ink', 1.75), L(114, yb, 114, y2 + 16, 'ink', 1.75, A(id, 'ink')),
      T(170, yb - 8, '잰 각도 q', { a: 'middle', c: 'q', s: 12.5 }),
      T(16, 340, 'Δt마다 이 고리를 한 바퀴 돈다 (예: 1 ms)', { c: 'q', s: 12.5 }),
    ].join(''), '열린 루프는 계산한 토크를 보내기만 하고, 닫힌 루프는 각도를 재어 목표와 견준 오차로 토크를 고친다');
  };

  // ---------------------------------------------------------------
  // 그림 13-2 관절마다 용수철 / 손끝에 용수철 하나
  FIG.fig13_2 = el => {
    const id = 'f132', s = 8, q = [15, 70], qd = [55, 25];
    const fk = (B, a1, a2) => {
      const E = [B[0] + 10 * s * Math.cos(a1 * D), B[1] - 10 * s * Math.sin(a1 * D)];
      return [E, [E[0] + 8 * s * Math.cos((a1 + a2) * D), E[1] - 8 * s * Math.sin((a1 + a2) * D)]];
    };
    const base = B => `<rect x="${B[0] - 22}" y="${B[1] + 7}" width="44" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`;
    const arm = B => { const [E, H] = fk(B, ...q); return base(B) + link(B[0], B[1], E[0], E[1], 'c1', 11) + link(E[0], E[1], H[0], H[1], 'c1', 11) + joint(B[0], B[1], 7) + joint(E[0], E[1], 6) + C(H[0], H[1], 5, 'f-c1', 0); };
    const BL = [46, 244], BR = [282, 244];
    const [EL] = fk(BL, ...q), [GE, GH] = fk(BL, ...qd), [, HR] = fk(BR, ...q), [, TR] = fk(BR, ...qd);
    const ray = [EL[0] + 44 * Math.cos(40 * D), EL[1] - 44 * Math.sin(40 * D)];
    el.innerHTML += svg(id, [40, 290], [
      T(16, 62, '(가) 관절마다 용수철', { c: 'b' }), T(16, 82, '목표: 관절 각도 ' + sub('q', 'd'), { c: 'q', s: 12.5 }),
      path([BL, GE, GH], 'f-none s-axis', 2, 'stroke-dasharray="5 4"'), C(GE[0], GE[1], 4, 'f-none s-axis'), C(GH[0], GH[1], 4, 'f-none s-axis'),
      T(GH[0] + 12, GH[1] + 4, '목표 자세', { c: 'q', s: 12.5 }),
      L(EL[0], EL[1], ray[0], ray[1], 'axis', 1.25, 'stroke-dasharray="3 3"'),
      arm(BL),
      zigArc(BL, 40, 15, 55, 6, 4), zigArc(EL, 30, 85, 40, 6, 4),
      T(120, 292, '역기구학으로 ' + sub('q', 'd') + '부터 구한다', { a: 'middle', c: 'q', s: 12.5 }),
      T(120, 314, '관절 공간 제어', { a: 'middle', c: 'b', s: 13.5 }),
      L(240, 48, 240, 322, 'grid', 1),
      T(256, 62, '(나) 손끝에 용수철 하나', { c: 'b' }), T(256, 82, '목표: 손끝 위치 ' + sub('x', 'd'), { c: 'q', s: 12.5 }),
      arm(BR),
      zig(HR, [TR[0] + 8, TR[1] + 6], 6, 6),
      C(TR[0], TR[1], 11, 'f-none s-c1', 1.75), C(TR[0], TR[1], 4, 'f-c1', 0),
      T(TR[0] - 16, TR[1] + 5, '목표 ' + sub('x', 'd'), { a: 'end', c: 'b', s: 13.5 }),
      T(360, 292, '관절 각도는 저절로 정해진다', { a: 'middle', c: 'q', s: 12.5 }),
      T(360, 314, '작업 공간 제어 (15장)', { a: 'middle', c: 'b', s: 13.5 }),
    ].join(''), '관절마다 용수철을 달면 관절 공간 제어, 손끝에 용수철 하나를 걸면 작업 공간 제어다');
  };

  // ---------------------------------------------------------------
  // 그림 13-3 마찰 없는 질량-용수철: 에너지가 오간다 (슬라이더)
  FIG.fig13_3 = el => interactive(el, {
    state: { k: 8, m: 2, t: 0.5 },
    sliders: [
      { key: 'k', label: '용수철 k (N/m)', min: 1, max: 32, step: 1, unit: '' },
      { key: 'm', label: '질량 m (kg)', min: 0.5, max: 8, step: 0.5, unit: '' },
      { key: 't', label: '시간 t', min: 0, max: 10, step: 0.05, unit: ' s' },
    ],
    draw: ({ k, m, t }) => {
      const id = 'f133', w = Math.sqrt(k / m), x0 = 0.1, x = x0 * Math.cos(w * t), v = -x0 * w * Math.sin(w * t);
      const pu = (0.5 * k * x * x) / (0.5 * k * x0 * x0);
      const X0 = 262, S = 1100, xc = X0 + S * x, fy = 140, bw = 52, bh = 44, sy = fy - bh / 2;
      const F = frame({ id: 'f133g', x: 48, y: 290, w: 416, h: 80, t0: 0, t1: 10, v0: -10, v1: 10, yt: [[-10, '−10'], [0, '0'], [10, '10']], xt: [[0, '0'], [2, '2'], [4, '4'], [6, '6'], [8, '8'], [10, '10 s']], title: '위치 x (cm)' });
      const pts = [];
      for (let i = 0; i <= 500; i++) { const s = 10 * i / 500; pts.push([s, 100 * x0 * Math.cos(w * s)]); }
      const va = 150 * v, BW = 388;
      return svg(id, [44, 346], [
        wall(26, 74, fy), L(26, fy, 464, fy, 'axis', 1.5), rect(26, fy, 438, 6, 'f-tint', 'stroke="none"'),
        L(X0, 70, X0, fy + 8, 'axis', 1, dash), T(X0, 64, 'x = 0', { a: 'middle', c: 'q', s: 12.5 }),
        springH(26, xc - bw / 2, sy),
        block(xc, fy - bh, bw, bh),
        Math.abs(va) < 7 ? '' : L(xc, fy - bh - 12, xc + va, fy - bh - 12, 'c2', 2.5, A(id, 'c2')),
        Math.abs(va) < 7 ? '' : T(xc + va + (va > 0 ? 8 : -8), fy - bh - 8, 'v', { a: va > 0 ? 'start' : 'end', c: 'b', s: 13 }),
        Math.abs(S * x) < 6 ? '' : L(X0, fy + 20, xc, fy + 20, 'ink', 1.75, A(id, 'ink')),
        T(Math.abs(S * x) < 6 ? X0 : (X0 + xc) / 2, fy + 38, `x = ${m1(100 * x)} cm`, { a: 'middle', s: 12.5 }),
        T(16, 222, '에너지', { c: 'b', s: 13 }),
        rect(76, 209, BW, 18, 'f-none s-grid', 'stroke-width="1"'),
        pu < 0.002 ? '' : rect(76, 209, BW * pu, 18, 'f-c1', 'fill-opacity="0.55"'),
        pu > 0.998 ? '' : rect(76 + BW * pu, 209, BW * (1 - pu), 18, 'f-c2', 'fill-opacity="0.55"'),
        rect(76, 238, 12, 12, 'f-c1', 'fill-opacity="0.55"'), T(94, 249, `위치 에너지 U ${Math.round(100 * pu)}%`, { s: 12.5 }),
        rect(276, 238, 12, 12, 'f-c2', 'fill-opacity="0.55"'), T(294, 249, `운동 에너지 K ${100 - Math.round(100 * pu)}%`, { s: 12.5 }),
        F.svg, F.line(pts, 'f-none s-c1', 2),
        L(F.X(t), F.y, F.X(t), F.y + F.h, 'ink', 1, 'stroke-dasharray="2 3" stroke-opacity="0.6"'),
        C(F.X(t), F.Y(100 * x), 5, 'f-ink', 0),
      ].join(''), '마찰 없는 질량-용수철에서 위치 에너지와 운동 에너지가 주고받으며 합은 그대로다');
    },
    readout: ({ k, m, t }) => {
      const w = Math.sqrt(k / m), x0 = 0.1, x = x0 * Math.cos(w * t), v = -x0 * w * Math.sin(w * t);
      const Er = Math.round(500 * k * x0 * x0 * 10) / 10, Ur = Math.round(500 * k * x * x * 10) / 10, Kr = Math.max(0, Er - Ur);
      return `<div>ω<sub>n</sub> = √(k/m) = √(${k}/${m}) = <b>${f2(w)} rad/s</b> · 주기 T = 2π/ω<sub>n</sub> = <b>${f2(2 * Math.PI / w)} s</b></div>` +
        `<div>t = ${t.toFixed(2)} s: x = <b>${m1(100 * x)} cm</b>, v = <b>${m1(100 * v)} cm/s</b></div>` +
        `<div><span class="c1">U = ½kx² = ${Ur.toFixed(1)} mJ</span> + <span class="c2">K = ½mv² = ${Kr.toFixed(1)} mJ</span> = <b>${Er.toFixed(1)} mJ</b> <span class="q">(언제나 ½kx₀²)</span></div>`;
    },
  });

  // ---------------------------------------------------------------
  // 그림 13-4 질량-용수철-댐퍼 시뮬레이션 (슬라이더)
  const M4 = 2;
  const sim4 = memo((k, b, x0) => simulate(M4, b, k, x0 / 100, 10, 0.002, 5));     // 0.01 s 마다
  FIG.fig13_4 = el => interactive(el, {
    state: { k: 8, b: 4.8, x0: 10, t: 1 },
    sliders: [
      { key: 'k', label: '용수철 k (N/m)', min: 1, max: 32, step: 0.5, unit: '' },
      { key: 'b', label: '댐퍼 b (N·s/m)', min: 0, max: 30, step: 0.2, unit: '' },
      { key: 'x0', label: '처음에 당긴 거리', min: 2, max: 10, step: 1, unit: ' cm' },
      { key: 't', label: '시간 t', min: 0, max: 10, step: 0.05, unit: ' s' },
    ],
    draw: ({ k, b, x0, t }) => {
      const id = 'f134', data = sim4(k, b, x0), i = Math.min(data.length - 1, Math.round(t / 0.01)), [, x] = data[i];
      const E0 = 0.5 * k * (x0 / 100) ** 2;
      const X0 = 262, S = 1100, xc = X0 + S * x, fy = 152, bw = 52, bh = 64, xs = X0 + S * x0 / 100;
      const xt = [[0, '0'], [2, '2'], [4, '4'], [6, '6'], [8, '8'], [10, '10 s']];
      const F1 = frame({ id: 'f134a', x: 48, y: 196, w: 416, h: 80, t0: 0, t1: 10, v0: -10, v1: 10, yt: [[-10, '−10'], [0, '0'], [10, '10']], xt, title: '위치 x (cm)' });
      const F2 = frame({ id: 'f134b', x: 48, y: 332, w: 416, h: 70, t0: 0, t1: 10, v0: 0, v1: 105, yt: [[0, '0'], [50, '50'], [100, '100']], xt, title: '에너지 (처음 = 100%)' });
      const pu = data.map(([s, xx]) => [s, 100 * 0.5 * k * xx * xx / E0]);
      const pe = data.map(([s, xx, vv]) => [s, 100 * (0.5 * k * xx * xx + 0.5 * M4 * vv * vv) / E0]);
      const base = data.map(([s]) => [s, 0]);
      return svg(id, [44, 380], [
        wall(26, 66, fy), L(26, fy, 464, fy, 'axis', 1.5), rect(26, fy, 438, 6, 'f-tint', 'stroke="none"'),
        L(X0, 72, X0, fy + 8, 'axis', 1, dash), T(X0, 66, 'x = 0', { a: 'middle', c: 'q', s: 12.5 }),
        t > 0.02 && Math.abs(xs - xc) > 3 ? `<rect x="${xs - bw / 2}" y="${fy - bh}" width="${bw}" height="${bh}" rx="4" class="f-none s-axis" stroke-width="1.25" stroke-dasharray="4 3"/>` : '',
        springH(26, xc - bw / 2, fy - bh + 16, 8, 7),
        damperH(26, xc - bw / 2, fy - 16),
        block(xc, fy - bh, bw, bh),
        F1.svg, F1.line(data.map(([s, xx]) => [s, 100 * xx]), 'f-none s-c1', 2),
        F2.svg, F2.fill(pu, base, 'f-c1', 0.4), F2.fill(pe, pu, 'f-c2', 0.4), F2.line(pe, 'f-none s-ink', 1.5),
        rect(300, 312, 12, 12, 'f-c1', 'fill-opacity="0.4"'), T(318, 323, 'U 용수철', { s: 12.5 }),
        rect(392, 312, 12, 12, 'f-c2', 'fill-opacity="0.4"'), T(410, 323, 'K 운동', { s: 12.5 }),
        [F1, F2].map(F => L(F.X(t), F.y, F.X(t), F.y + F.h, 'ink', 1, 'stroke-dasharray="2 3" stroke-opacity="0.6"')).join(''),
        C(F1.X(t), F1.Y(100 * x), 5, 'f-ink', 0), C(F2.X(t), F2.Y(pe[i][1]), 5, 'f-ink', 0),
      ].join(''), '댐퍼가 있으면 에너지가 줄어들며 흔들림이 잦아든다');
    },
    readout: ({ k, b, x0, t }) => {
      const wn = Math.sqrt(k / M4), z = b / (2 * Math.sqrt(k * M4)), data = sim4(k, b, x0), i = Math.min(data.length - 1, Math.round(t / 0.01));
      const [, x, v] = data[i], left = 100 * (0.5 * k * x * x + 0.5 * M4 * v * v) / (0.5 * k * (x0 / 100) ** 2);
      const wd = z > 0.005 && z < 0.995 ? `<div>ω<sub>d</sub> = ω<sub>n</sub>√(1 − ζ²) = <b>${f2(wn * Math.sqrt(1 - z * z))} rad/s</b> <span class="q">(주기 ${f2(2 * Math.PI / (wn * Math.sqrt(1 - z * z)))} s, 감쇠가 없으면 ${f2(2 * Math.PI / wn)} s)</span></div>` : '';
      return `<div>ω<sub>n</sub> = √(k/m) = <b>${f2(wn)} rad/s</b> · ζ = b/(2√(km)) = <b>${f2(z)}</b> → ${kind(z)}</div>` + wd +
        `<div class="q">임계 감쇠가 되는 b = 2√(km) = ${f1(2 * Math.sqrt(k * M4))} N·s/m</div>` +
        `<div>t = ${t.toFixed(2)} s: x = <b>${m2(100 * x)} cm</b> · 남은 에너지 <b>${left < 0.05 ? '0' : f1(left)}%</b></div>`;
    },
  });

  // ---------------------------------------------------------------
  // 그림 13-5 감쇠비에 따른 세 가지 움직임
  FIG.fig13_5 = el => {
    const id = 'f135', wn = 2;
    const F = frame({ id: 'f135g', x: 48, y: 70, w: 416, h: 180, t0: 0, t1: 8, v0: -1, v1: 1, yt: [[-1, '−1'], [-0.5, '−0.5'], [0, '0'], [0.5, '0.5'], [1, '1']], xt: [[0, '0'], [2, '2'], [4, '4'], [6, '6'], [8, '8 s']], title: '위치 x (처음 = 1)' });
    const curve = z => { const p = []; for (let i = 0; i <= 400; i++) { const t = 8 * i / 400; p.push([t, exact(wn, z, t)]); } return p; };
    const tp = Math.PI / (wn * Math.sqrt(1 - 0.04)), yp = exact(wn, 0.2, tp);
    const leg = (x, y, c, more, txt) => L(x, y - 4, x + 22, y - 4, c, 2.5, more) + T(x + 28, y, txt, { s: 12.5 });
    el.innerHTML += svg(id, [40, 304], [
      F.svg,
      F.line(curve(0), 'f-none s-axis', 1.5, 'stroke-dasharray="4 4"'),
      F.line(curve(3), 'f-none s-ink', 2.25),
      F.line(curve(1), 'f-none s-c2', 2.5),
      F.line(curve(0.2), 'f-none s-c1', 2.5),
      C(F.X(tp), F.Y(yp), 4, 'f-c1', 0), T(F.X(tp), F.Y(yp) - 12, mn(f2(yp)), { a: 'middle', c: 'b', s: 12.5 }),
      leg(16, 310, 'c1', '', 'ζ = 0.2 부족 감쇠'), leg(170, 310, 'c2', '', 'ζ = 1 임계 감쇠'), leg(324, 310, 'ink', '', 'ζ = 3 과감쇠'),
      leg(16, 334, 'axis', 'stroke-dasharray="4 4"', 'ζ = 0 감쇠 없음'),
    ].join(''), '감쇠비가 작으면 흔들리며 잦아들고, 1이면 넘어가지 않고 가장 빨리 서고, 크면 천천히 다가간다');
  };

  // ---------------------------------------------------------------
  // 그림 13-6 그릇 속의 공
  FIG.fig13_6 = el => {
    const id = 'f136', W = 64, Dp = 70, yb = 186, r = 7;
    const bowlY = (cx, x) => yb - Dp * ((x - cx) / W) ** 2;
    const bowl = cx => {
      const p = [];
      for (let i = 0; i <= 40; i++) { const x = cx - W - 4 + (2 * W + 8) * i / 40; p.push([x, bowlY(cx, x)]); }
      const fillP = p.concat([[cx + W + 4, yb + 10], [cx - W - 4, yb + 10]]);
      return area(fillP, 'f-tint', 'stroke="none"') + path(p, 'f-none s-axis', 2.5, 'stroke-linecap="round"');
    };
    const ball = (cx, dx) => C(cx + dx, bowlY(cx, cx + dx) - r, r, 'f-c1 s-c1', 1.5);
    const ghost = (cx, dx) => { const x = cx + dx, y = bowlY(cx, x) - r; return `<circle cx="${x}" cy="${y}" r="${r}" class="f-none s-c1" stroke-width="1.25" stroke-dasharray="3 2"/>`; };
    const mini = (cx, f, c) => {
      const x0 = cx - 54, x1 = cx + 54, y0 = 222, y1 = 270, p = [];
      for (let i = 0; i <= 60; i++) { const s = i / 60; p.push([x0 + 4 + (x1 - x0 - 8) * s, y1 - (y1 - y0 - 4) * f(s)]); }
      return L(x0, y0, x0, y1, 'axis', 1.25) + L(x0, y1, x1, y1, 'axis', 1.25) + T(x0 - 4, y0 + 10, 'E', { a: 'end', c: 'q', s: 12.5 }) + T(x1, y1 + 16, 't', { a: 'end', c: 'q', s: 12.5 }) + path(p, `f-none s-${c}`, 2);
    };
    const P = [80, 240, 400];
    el.innerHTML += svg(id, [42, 302], [
      T(P[0], 62, '(가) 마찰 없음', { a: 'middle', c: 'b' }), T(P[1], 62, '(나) 마찰 있음', { a: 'middle', c: 'b' }), T(P[2], 62, '(다) 에너지를 넣음', { a: 'middle', c: 'b' }),
      L(160, 48, 160, 336, 'grid', 1), L(320, 48, 320, 336, 'grid', 1),
      // (가)
      bowl(P[0]),
      L(P[0] - 48, bowlY(P[0], P[0] - 48) - r, P[0] + 48, bowlY(P[0], P[0] + 48) - r, 'axis', 1, 'stroke-dasharray="2 3"'),
      ball(P[0], -48), ghost(P[0], 48),
      T(P[0], 104, '같은 높이를 오간다', { a: 'middle', c: 'q', s: 12.5 }),
      mini(P[0], () => 0.8, 'ink'),
      // (나)
      bowl(P[1]),
      ball(P[1], -50), ghost(P[1], 36), ghost(P[1], -22), ball(P[1], 0),
      T(P[1], 104, '조금씩 낮아진다', { a: 'middle', c: 'q', s: 12.5 }),
      mini(P[1], s => 0.85 * Math.exp(-3 * s + 0.35 * Math.sin(9 * s)) + 0.04, 'ink'),
      // (다)
      bowl(P[2]),
      ball(P[2], -26), ghost(P[2], 40), ghost(P[2], -54),
      `<circle cx="${P[2] + 58}" cy="86" r="${r}" class="f-none s-c1" stroke-width="1.25" stroke-dasharray="3 2"/>`,
      L(P[2] + 63, 77, P[2] + 71, 58, 'c1', 2, A(id, 'c1')),
      T(P[2] - 20, 104, '점점 높아진다', { a: 'middle', c: 'q', s: 12.5 }),
      mini(P[2], s => 0.12 * Math.exp(2 * s + 0.2 * Math.sin(9 * s)) + 0.02, 'ink'),
      T(P[0], 304, '안정', { a: 'middle', c: 'b', s: 14 }), T(P[0], 324, '멈추지 않는다', { a: 'middle', c: 'q', s: 12.5 }),
      T(P[1], 304, '점근 안정', { a: 'middle', c: 'b', s: 14 }), T(P[1], 324, '바닥에 선다', { a: 'middle', c: 'q', s: 12.5 }),
      T(P[2], 304, '불안정', { a: 'middle', c: 'b', s: 14 }), T(P[2], 324, '튀어 나간다', { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '마찰이 없으면 같은 높이를 오가고, 마찰이 있으면 바닥에 서고, 에너지를 넣으면 튀어 나간다');
  };

  // ---------------------------------------------------------------
  // 그림 13-7 모터로 만든 가상 용수철
  FIG.fig13_7 = el => {
    const id = 'f137', xd = 300, x = 120, y0 = 214, c = 140 / (240 * 240), U = u => y0 - c * (u - xd) ** 2, ry = 292;
    const p = [];
    for (let i = 0; i <= 80; i++) { const u = 60 + 380 * i / 80; p.push([u, U(u)]); }
    const sl = 2 * c * (x - xd), tx = 64, tan = [[x - tx, U(x) + sl * tx], [x + tx, U(x) - sl * tx]];
    el.innerHTML += svg(id, [40, 304], [
      L(40, y0, 456, y0, 'axis', 1.25, A(id, 'axis')), L(40, y0, 40, 54, 'axis', 1.25, A(id, 'axis')),
      T(48, 62, sub('U', 'goal'), { c: 'q', s: 13 }), T(456, y0 + 20, 'x', { a: 'end', c: 'q', s: 13 }),
      path(p, 'f-none s-c1', 2.5),
      T(362, 120, sub('U', 'goal') + ' = ½ ' + sub('k', 'p') + ' (x − ' + sub('x', 'd') + ')²', { a: 'middle', c: 'b', s: 13.5 }),
      L(tan[0][0], tan[0][1], tan[1][0], tan[1][1], 'c2', 2, 'stroke-dasharray="6 4"'),
      T(x + 22, U(x) - 14, '기울기 ' + sub('k', 'p') + '(x − ' + sub('x', 'd') + ')', { s: 12.5 }),
      C(x, U(x), 6, 'f-ink', 0), C(xd, y0, 5, 'f-c1', 0),
      T(xd, y0 - 14, '바닥 = 목표', { a: 'middle', c: 'q', s: 12.5 }),
      L(x, U(x) + 8, x, ry - 18, 'axis', 1, 'stroke-dasharray="2 3"'), L(xd, y0 + 8, xd, ry - 18, 'axis', 1, 'stroke-dasharray="2 3"'),
      L(40, ry, 456, ry, 'axis', 2), rect(40, ry, 416, 6, 'f-tint', 'stroke="none"'),
      `<rect x="${x - 22}" y="${ry - 28}" width="44" height="28" rx="4" class="f-c1 s-c1" fill-opacity="0.22" stroke-width="1.5"/>`, T(x, ry - 9, 'm', { a: 'middle', c: 'b', s: 14 }),
      L(x + 24, ry - 14, x + 24 + 0.5 * (xd - x), ry - 14, 'c2', 3, A(id, 'c2')),
      T(x + 30, ry - 38, 'f = −' + sub('k', 'p') + '(x − ' + sub('x', 'd') + ')', { c: 'b', s: 13 }),
      `<path d="M${xd} ${ry}V${ry - 30}L${xd + 18} ${ry - 24}L${xd} ${ry - 18}" class="f-c1 s-c1" fill-opacity="0.5" stroke-width="1.5"/>`,
      T(x, ry + 26, '지금 x', { a: 'middle', c: 'q', s: 12.5 }), T(xd, ry + 26, '목표 ' + sub('x', 'd'), { a: 'middle', c: 'b', s: 13 }),
    ].join(''), '목표에 바닥을 둔 위치 에너지를 정하고 그 기울기만큼 모터가 링크를 민다');
  };

  // ---------------------------------------------------------------
  // 그림 13-8 종이 팔 팔꿈치의 PD 제어 (슬라이더)
  const I8 = 3.2e-5;                                     // M₂₂ = 320 g·cm²
  const sim8 = memo((thd, kp, kv) => simulate(I8, kv * 1e-3, kp * 1e-3, -thd * D, 2, 0.0005, 4));   // 오차 e = θ − θ_d, 0.002 s 마다
  FIG.fig13_8 = el => interactive(el, {
    state: { thd: 60, kp: 3.2, kv: 0.32, t: 0.1 },
    sliders: [
      { key: 'thd', label: '목표 각', min: -80, max: 80, step: 5, unit: '°' },
      { key: 'kp', label: '용수철 kₚ (mN·m/rad)', min: 0.4, max: 20, step: 0.2, unit: '' },
      { key: 'kv', label: '댐퍼 kᵥ (mN·m·s/rad)', min: 0, max: 2, step: 0.02, unit: '' },
      { key: 't', label: '시간 t', min: 0, max: 2, step: 0.01, unit: ' s' },
    ],
    draw: ({ thd, kp, kv, t }) => {
      const id = 'f138', data = sim8(thd, kp, kv), i = Math.min(data.length - 1, Math.round(t / 0.002));
      const th = data.map(([s, e]) => [s, e / D + thd]), a = th[i][1];
      const J = [128, 172], R = 88, P = deg => [J[0] + R * Math.cos(deg * D), J[1] - R * Math.sin(deg * D)];
      const tip = P(a), goal = P(thd);
      const big = Math.max(45, ...th.map(([, v]) => Math.abs(v)), Math.abs(thd)), ym = Math.min(180, 45 * Math.ceil(1.08 * big / 45));
      const F = frame({ id: 'f138g', x: 286, y: 74, w: 178, h: 176, t0: 0, t1: 2, v0: -ym, v1: ym, yt: [[-ym, mn(-ym)], [0, '0'], [ym, String(ym)]], xt: [[0, '0'], [1, '1'], [2, '2 s']], title: '각도 θ (°)' });
      const lab = [J[0] + (R + 16) * Math.cos(thd * D), J[1] - (R + 16) * Math.sin(thd * D)], gc = Math.cos(thd * D);
      return svg(id, [44, 254], [
        `<circle cx="${J[0]}" cy="${J[1]}" r="${R}" fill="none" class="s-grid" stroke-dasharray="3 4"/>`,
        link(J[0] - 92, J[1], J[0], J[1], 'axis', 12), T(J[0] - 92, J[1] + 26, '팔뚝 (잡아 둠)', { c: 'q', s: 12.5 }),
        L(J[0], J[1], J[0] + R + 14, J[1], 'axis', 1, dash), T(J[0] + R + 2, J[1] + 18, '0°', { a: 'middle', c: 'q', s: 12.5 }),
        L(J[0], J[1], goal[0], goal[1], 'c1', 2, 'stroke-dasharray="6 4"'), C(goal[0], goal[1], 5, 'f-none s-c1', 1.75),
        T(lab[0], lab[1] + 5, '목표', { a: gc > 0.4 ? 'start' : gc < -0.4 ? 'end' : 'middle', c: 'b', s: 12.5 }),
        Math.abs(a - thd) < 2 ? '' : zigArc(J, 44, a, thd, Math.max(2, Math.round(Math.abs(a - thd) / 12)), 4),
        link(J[0], J[1], tip[0], tip[1], 'ink', 12), joint(J[0], J[1], 8), C(tip[0], tip[1], 4.5, 'f-ink', 0),
        F.svg,
        L(F.x, F.Y(thd), F.x + F.w, F.Y(thd), 'c1', 1.25, 'stroke-dasharray="5 4"'),
        F.line(th, 'f-none s-ink', 2),
        L(F.X(t), F.y, F.X(t), F.y + F.h, 'ink', 1, 'stroke-dasharray="2 3" stroke-opacity="0.6"'),
        C(F.X(t), F.Y(a), 5, 'f-ink', 0),
      ].join(''), 'PD 제어를 하면 팔꿈치가 목표 각도 쪽 용수철과 댐퍼에 매달린 것처럼 움직인다');
    },
    readout: ({ thd, kp, kv, t }) => {
      const w = Math.sqrt(kp * 1e-3 / I8), z = kv * 1e-3 / (2 * Math.sqrt(kp * 1e-3 * I8));
      const data = sim8(thd, kp, kv), i = Math.min(data.length - 1, Math.round(t / 0.002)), [, e, v] = data[i];
      const tau = -kp * e - kv * v;                                  // mN·m
      const over = thd === 0 ? 0 : Math.max(...data.map(([, ee]) => Math.sign(thd) * ee)) / D;
      const ovTxt = thd === 0 ? '<div class="q">목표가 0°라 움직이지 않는다.</div>'
        : over > 0.05 ? `<div>목표를 가장 많이 지나친 각: <b>${f1(over)}°</b> <span class="q">(움직인 거리 ${Math.abs(thd)}°의 ${Math.round(100 * over / Math.abs(thd))}%)</span></div>`
          : '<div>목표를 지나치지 않는다.</div>';
      return `<div>ω = √(k<sub>p</sub>/I) = <b>${f1(w)} rad/s</b> · ζ = k<sub>v</sub>/(2√(k<sub>p</sub>I)) = <b>${f2(z)}</b> → ${kind(z)}</div>` + ovTxt +
        `<div>t = ${t.toFixed(2)} s: θ = <b>${m1(e / D + thd)}°</b> · 모터 토크 τ = −k<sub>p</sub>(θ − θ<sub>d</sub>) − k<sub>v</sub>θ̇ = <b>${m2(tau)} mN·m</b></div>`;
    },
  });
})();
