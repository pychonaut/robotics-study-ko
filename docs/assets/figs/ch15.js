// 15장 그림: PD + 중력 보상, 계산 토크 제어, 작업 공간 제어와 손끝의 질량 Λ
(function () {
  const { D, f1, f2, svg, T, L, A, C, joint, link, arc, annulus, interactive, sub, matrix2 } = FigKit;
  const FIG = window.FIG;

  // 종이 팔 (g, cm, s): 12장과 같다. 링크 1 = 10 cm·20 g, 링크 2 = 8 cm·15 g, 질량 중심은 가운데
  const m1 = 20, m2 = 15, l1 = 10, l2 = 8, lc1 = 5, lc2 = 4, I1 = m1 * l1 * l1 / 12, I2 = m2 * l2 * l2 / 12;
  const TO = 1e-4;                                        // g·cm²/s² → mN·m
  // 질량 행렬 (θ₂는 라디안, mp = 손끝의 점 질량 g)
  const Mof = (t2, mp = 0) => {
    const c = Math.cos(t2);
    const a = m1 * lc1 * lc1 + I1 + m2 * (l1 * l1 + lc2 * lc2 + 2 * l1 * lc2 * c) + I2 + mp * (l1 * l1 + l2 * l2 + 2 * l1 * l2 * c);
    const b = m2 * (lc2 * lc2 + l1 * lc2 * c) + I2 + mp * (l2 * l2 + l1 * l2 * c);
    return [[a, b], [b, m2 * lc2 * lc2 + I2 + mp * l2 * l2]];
  };
  const Vof = (q, w, mp = 0) => {
    const h = -(m2 * l1 * lc2 + mp * l1 * l2) * Math.sin(q[1]);
    return [h * (w[1] * w[1] + 2 * w[0] * w[1]), -h * w[0] * w[0]];
  };
  const fk = q => [l1 * Math.cos(q[0]) + l2 * Math.cos(q[0] + q[1]), l1 * Math.sin(q[0]) + l2 * Math.sin(q[0] + q[1])];
  const elb = q => [l1 * Math.cos(q[0]), l1 * Math.sin(q[0])];
  const jac = q => {
    const s1 = Math.sin(q[0]), c1 = Math.cos(q[0]), s12 = Math.sin(q[0] + q[1]), c12 = Math.cos(q[0] + q[1]);
    return [[-l1 * s1 - l2 * s12, -l2 * s12], [l1 * c1 + l2 * c12, l2 * c12]];
  };
  const jdqd = (q, w) => {                                // q̈ = 0일 때 손끝 가속도 J̇q̇
    const a = w[0], b = w[0] + w[1];
    return [-l1 * Math.cos(q[0]) * a * a - l2 * Math.cos(q[0] + q[1]) * b * b, -l1 * Math.sin(q[0]) * a * a - l2 * Math.sin(q[0] + q[1]) * b * b];
  };
  const mv = (M, v) => [M[0][0] * v[0] + M[0][1] * v[1], M[1][0] * v[0] + M[1][1] * v[1]];
  const mtv = (M, v) => [M[0][0] * v[0] + M[1][0] * v[1], M[0][1] * v[0] + M[1][1] * v[1]];   // Mᵀv
  const mm = (P, Q) => [[P[0][0] * Q[0][0] + P[0][1] * Q[1][0], P[0][0] * Q[0][1] + P[0][1] * Q[1][1]],
    [P[1][0] * Q[0][0] + P[1][1] * Q[1][0], P[1][0] * Q[0][1] + P[1][1] * Q[1][1]]];
  const tr = P => [[P[0][0], P[1][0]], [P[0][1], P[1][1]]];
  const inv = P => { const d = P[0][0] * P[1][1] - P[0][1] * P[1][0]; return [[P[1][1] / d, -P[0][1] / d], [-P[1][0] / d, P[0][0] / d]]; };
  // J의 역. 특이점 가까이(sin θ₂가 작을 때)는 감쇠 최소제곱(8.6절)으로 바꿔 숫자가 터지지 않게 한다
  const jinv = q => {
    const J = jac(q), s = Math.abs(Math.sin(q[1]));
    if (s > 0.1) return inv(J);
    const lam2 = Math.pow(4 * (0.1 - s), 2);              // cm²: 특이점에 가까울수록 크게
    const JJ = mm(J, tr(J));
    return mm(tr(J), inv([[JJ[0][0] + lam2, JJ[0][1]], [JJ[1][0], JJ[1][1] + lam2]]));
  };
  const lamOf = q => { const Ji = inv(jac(q)); return mm(tr(Ji), mm(Mof(q[1]), Ji)); };   // Λ = J⁻ᵀMJ⁻¹ (g), 그림 15-5는 θ₂ ≥ 3°
  // 대칭 2×2의 고윳값 (큰 것, 작은 것)과 큰 쪽 방향 각도(라디안)
  const eig2 = S => {
    const m = (S[0][0] + S[1][1]) / 2, d = Math.hypot((S[0][0] - S[1][1]) / 2, S[0][1]);
    return [m + d, m - d, 0.5 * Math.atan2(2 * S[0][1], S[0][0] - S[1][1])];
  };
  const ik = (x, y) => {                                  // 팔꿈치 θ₂ > 0 쪽 답
    const c = Math.max(-1, Math.min(1, (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2))), t2 = Math.acos(c);
    return [Math.atan2(y, x) - Math.atan2(l2 * Math.sin(t2), l1 + l2 * Math.cos(t2)), t2];
  };
  const ok = v => v.every(Number.isFinite);
  const clampV = (v, mx) => v.map(a => Math.max(-mx, Math.min(mx, a)));
  // 상태 s = [θ₁, θ₂, θ̇₁, θ̇₂], 룽게-쿠타 4단 한 걸음
  const rk4 = (f, t, s, h) => {
    const add = (a, b, k) => a.map((v, i) => v + k * b[i]);
    const k1 = f(t, s), k2 = f(t + h / 2, add(s, k1, h / 2)), k3 = f(t + h / 2, add(s, k2, h / 2)), k4 = f(t + h, add(s, k3, h));
    return s.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  const poly = (pts, cls, w, more = '') => `<polyline points="${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" fill="none" class="${cls}" stroke-width="${w}" stroke-linejoin="round" ${more}/>`;
  // 둥근 화살표: 가운데 각 mid, 펼친 각 ext, 부호대로 방향
  const turn = (id, x, y, r, mid, ext, sign, c, w = 2.5) => {
    if (Math.abs(sign) < 1e-9 || ext < 1e-3) return '';
    const a0 = mid - ext / 2, a1 = mid + ext / 2;
    return sign > 0 ? arc(x, y, r, a0, a1, c, w, A(id, c)) : arc(x, y, r, a1, a0, c, w, A(id, c));
  };
  // 가운데가 0인 막대
  const dbar = (x0, y, half, v, vmax, cls, hgt = 12) => {
    const w = half * Math.max(-1, Math.min(1, v / vmax));
    return `<rect x="${x0 - half}" y="${y}" width="${2 * half}" height="${hgt}" rx="3" fill="none" class="s-grid" stroke-width="1"/>` +
      (Math.abs(w) > 0.3 ? `<rect x="${w >= 0 ? x0 : x0 + w}" y="${y}" width="${Math.abs(w)}" height="${hgt}" rx="3" class="${cls}" fill-opacity="0.55"/>` : '') +
      L(x0, y - 3, x0, y + hgt + 3, 'axis', 1.25);
  };
  const base = (x, y) => `<rect x="${x - 16}" y="${y + 9}" width="32" height="11" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`;
  // 화면 위의 팔: 어깨 (bx, by), 1 cm = s px
  const armPts = (bx, by, s, q) => { const e = elb(q), h = fk(q); return { S: [bx, by], E: [bx + s * e[0], by - s * e[1]], H: [bx + s * h[0], by - s * h[1]] }; };
  const drawArm = (P, c = 'c1', fat = 10) => link(P.S[0], P.S[1], P.E[0], P.E[1], c, fat) + link(P.E[0], P.E[1], P.H[0], P.H[1], c, fat - 1) +
    joint(P.S[0], P.S[1], 7) + joint(P.E[0], P.E[1], 6);
  const ghostArm = (P, c = 'axis', more = '') => L(P.S[0], P.S[1], P.E[0], P.E[1], c, 2, more) + L(P.E[0], P.E[1], P.H[0], P.H[1], c, 2, more);
  // 글자가 든 네모와 더하기 원 (블록 그림)
  const box = (x, y, w, h, lines, o = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="${o.cls || 'f-none s-axis'}" ${o.op ? `fill-opacity="${o.op}"` : ''} stroke-width="1.25"/>` +
    lines.map((t, i) => T(x + w / 2, y + h / 2 + 5 + (i - (lines.length - 1) / 2) * 18, t, { a: 'middle', s: 13, c: i === 0 && lines.length > 1 ? 'b' : '' })).join('');
  const sumC = (x, y) => C(x, y, 9, 'f-none s-ink', 1.25) + L(x - 5, y, x + 5, y, 'ink', 1.25) + L(x, y - 5, x, y + 5, 'ink', 1.25);
  const path = (id, pts, c = 'ink', w = 1.5) => `<path d="M${pts.map(p => p.join(' ')).join('L')}" fill="none" class="s-${c}" stroke-width="${w}" ${A(id, c)}/>`;
  const hat = v => v + '̂';

  // 그림 15-1 PD + 중력 보상: 에너지 그릇 (슬라이더)
  const GA = (m1 * lc1 + m2 * l1 + m2 * lc2) * 980 * TO;   // 팔을 편 채 수평일 때 중력 토크 30.38 mN·m
  const bowl = (td, kp, gc) => {
    const a = (1 - gc / 100) * GA, t0 = td * D;
    const U = t => a * Math.sin(t) + 0.5 * kp * (t - t0) * (t - t0);
    const dU = t => a * Math.cos(t) + kp * (t - t0), d2U = t => -a * Math.sin(t) + kp;
    const mins = [];
    for (let i = 1; i < 720; i++) {                          // 0.5° 간격으로 훑어 바닥을 찾고 뉴턴법으로 다듬는다
      const tp = (-180 + (i - 1) * 0.5) * D, tc = (-180 + i * 0.5) * D, tn = (-180 + (i + 1) * 0.5) * D;
      if (U(tc) < U(tp) && U(tc) <= U(tn)) {
        let t = tc;
        for (let k = 0; k < 8; k++) { const dd = d2U(t); if (dd > 1e-6) t -= dU(t) / dd; }
        mins.push(Math.abs(t - tc) < 1.5 * D ? t : tc);
      }
    }
    return { U, mins, a };
  };
  FIG.fig15_1 = el => interactive(el, {
    state: { td: 30, kp: 100, gc: 0 },
    sliders: [{ key: 'td', label: '목표 각도', min: -90, max: 90, step: 5, unit: '°' },
      { key: 'kp', label: 'Kₚ (mN·m/rad)', min: 20, max: 300, step: 10, unit: '' },
      { key: 'gc', label: '중력 보상', min: 0, max: 100, step: 50, unit: '%' }],
    draw: ({ td, kp, gc }) => {
      const id = 'f151', { U, mins } = bowl(td, kp, gc);
      const X = t => 64 + (t + 180) * 392 / 360, Y = u => 336 - (u + 40) * 160 / 120;
      const curve = fn => { const p = []; for (let t = -180; t <= 180; t += 2) p.push([X(t), Y(fn(t * D))]); return p; };
      const px = 96, py = 112, R = 58, dir = t => [px + R * Math.cos(t), py - R * Math.sin(t)];
      const tgt = dir(td * D);
      const b = [
        `<clipPath id="${id}-clip"><rect x="64" y="176" width="392" height="160"/></clipPath>`,
        // 왼쪽 위: 벽에 세운 팔 (팔꿈치를 편 채 고정)
        `<rect x="${px - 13}" y="${py - 13}" width="26" height="26" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
        L(px, py, px + R + 8, py, 'grid', 1),
        L(px, py, tgt[0], tgt[1], 'c2', 1.75, 'stroke-dasharray="5 4"'),
        ...mins.map(t => { const h = dir(t); return link(px, py, h[0], h[1], 'c1', 9) + C(h[0], h[1], 4, 'f-ink', 0); }),
        joint(px, py, 7),
        L(176, 64, 176, 100, 'ink', 1.75, A(id, 'ink')), T(184, 88, 'g', { c: 'b', s: 14 }),
        // 범례
        L(222, 70, 252, 70, 'c1', 3), T(260, 75, '합: 팔이 느끼는 에너지', { s: 12.5 }),
        L(222, 92, 252, 92, 'axis', 1.75, 'stroke-dasharray="5 4"'), T(260, 97, '중력의 위치 에너지 × (1 − 보상)', { s: 12.5 }),
        L(222, 114, 252, 114, 'ink', 1.25, 'stroke-dasharray="1.5 3"'), T(260, 119, '용수철 ½' + sub('K', 'p') + '(θ − ' + sub('θ', 'd') + ')²', { s: 12.5 }),
        L(222, 136, 252, 136, 'c2', 1.75, 'stroke-dasharray="5 4"'), T(260, 141, '목표 ' + sub('θ', 'd'), { s: 12.5 }),
        C(237, 157, 5, 'f-ink', 0), T(260, 162, '멈추는 곳 (그릇 바닥)', { s: 12.5 }),
        // 그래프
        L(64, Y(0), 456, Y(0), 'grid', 1),
        ...[-180, -90, 0, 90, 180].map(t => L(X(t), 176, X(t), 336, 'grid', 1) + T(X(t), 354, t + '°', { a: 'middle', c: 'q', s: 12 })),
        L(64, 336, 456, 336, 'axis', 1.25), L(64, 336, 64, 180, 'axis', 1.25, A(id, 'axis')),
        T(70, 192, '에너지', { c: 'q', s: 12 }), T(456, 372, '팔 각도 θ (수평에서)', { a: 'end', c: 'q', s: 12 }),
        `<g clip-path="url(#${id}-clip)">`,
        gc < 100 ? poly(curve(t => (1 - gc / 100) * GA * Math.sin(t)), 's-axis', 1.75, 'stroke-dasharray="5 4"') : '',
        poly(curve(t => 0.5 * kp * (t - td * D) * (t - td * D)), 's-ink', 1.25, 'stroke-dasharray="1.5 3"'),
        poly(curve(U), 's-c1', 3),
        '</g>',
        L(X(td), 176, X(td), 336, 'c2', 1.5, 'stroke-dasharray="5 4"'),
        ...mins.map(t => C(X(t / D), Math.max(182, Y(U(t)) - 6), 6, 'f-ink', 0)),
      ];
      return svg(id, [48, 332], b.join(''), '비례 항은 목표에 바닥이 있는 용수철 에너지를 만들고, 중력 보상은 중력 에너지를 지워 바닥을 목표로 옮긴다');
    },
    readout: ({ td, kp, gc }) => {
      const { mins, a } = bowl(td, kp, gc);
      if (!mins.length) return '<div>그림 범위 안에 바닥이 없다</div>';
      if (mins.length > 1) return `<div>바닥이 <b>${mins.length}곳</b>: ${mins.map(t => f1(t / D) + '°').join(', ')} <span class="q">(처음 자세에 따라 한쪽으로 쓰러진다)</span></div>` +
        `<div class="q">K<sub>p</sub>가 중력 토크의 최댓값 ${f1(GA * (1 - gc / 100))} mN·m보다 작으면 그릇이 갈라질 수 있다</div>`;
      const t = mins[0], off = t / D - td;
      return `<div>멈추는 각 <b>θ* = ${f1(t / D)}°</b> · 목표와의 차이 <b>${f1(Math.abs(off) < 0.05 ? 0 : off)}°</b></div>` +
        `<div class="q">그 자리에서 용수철 토크 K<sub>p</sub>(θ<sub>d</sub> − θ*) = ${f2(kp * (td * D - t))} mN·m가 남은 중력 토크 ${f2(a * Math.cos(t))} mN·m를 받친다</div>`;
    },
  });

  // 그림 15-2 관절 공간의 비선형 동적 분리 (블록 그림)
  FIG.fig15_2 = el => {
    const id = 'f152', yc = 110, model = { cls: 'f-c1 s-c1', op: 0.1 };
    el.innerHTML += svg(id, [44, 232], [
      `<rect x="222" y="68" width="252" height="144" rx="10" fill="none" class="s-c1" stroke-width="1.25" stroke-dasharray="5 4"/>`,
      T(230, 62, '밖에서 보면 q̈ = τ′ (단위 질량)', { c: 'f-c1 b', s: 13 }),
      box(10, yc - 28, 84, 56, ['목표', sub('q', 'd') + ', ' + sub('q̇', 'd') + ', ' + sub('q̈', 'd')]),
      path(id, [[94, yc], [108, yc]]),
      box(110, yc - 28, 104, 56, ['단위 질량 제어', 'τ′']),
      path(id, [[214, yc], [230, yc]]),
      box(232, yc - 22, 58, 44, [hat('M') + '(q) ×'], model),
      path(id, [[290, yc], [310, yc]]),
      sumC(320, yc),
      path(id, [[329, yc], [358, yc]]), T(343, yc - 8, 'τ', { a: 'middle', c: 'b', s: 13 }),
      box(360, yc - 28, 108, 56, ['팔', 'M q̈ + V + G = τ']),
      box(286, 160, 68, 36, [hat('V') + ' + ' + hat('G')], model),
      path(id, [[320, 160], [320, yc + 11]]), T(326, 150, '+', { s: 13 }),
      `<path d="M414 138V240H162V${yc + 30}" fill="none" class="s-ink" stroke-width="1.5" ${A(id, 'ink')}/>`,
      path(id, [[320, 240], [320, 198]]),
      C(320, 240, 2.5, 'f-ink', 0),
      T(470, 260, 'q, q̇ (엔코더로 잰다)', { a: 'end', c: 'q', s: 12.5 }),
      T(170, 260, '되먹임', { c: 'q', s: 12.5 }),
    ].join(''), '단위 질량 제어 tau prime에 질량 행렬 추정을 곱하고 원심력, 코리올리 힘, 중력 추정을 더해 토크를 만든다');
  };

  // 그림 15-3 관절마다 따로 vs 계산 토크 (슬라이더)
  const QA = [-60 * D, 120 * D], QB = [60 * D, 30 * D], TM = 1, TEND = 1.5, H3 = 0.002, MBAR = [Mof(90 * D)[0][0], Mof(90 * D)[1][1]];
  const traj3 = t => {
    const s = Math.max(0, Math.min(1, t / TM)), p = 10 * s ** 3 - 15 * s ** 4 + 6 * s ** 5;
    const dp = t > TM ? 0 : (30 * s * s - 60 * s ** 3 + 30 * s ** 4) / TM, ddp = t > TM ? 0 : (60 * s - 180 * s * s + 120 * s ** 3) / (TM * TM);
    return [0, 1].map(i => { const d = QB[i] - QA[i]; return [QA[i] + p * d, dp * d, ddp * d]; });
  };
  const cache3 = {};
  const sim3 = (wn, mp) => {
    const key = wn + ',' + mp;
    if (cache3[key]) return cache3[key];
    const kp = wn * wn, kv = 2 * wn, out = {};
    ['ind', 'ct'].forEach(mode => {
      const f = (t, s) => {
        const q = [s[0], s[1]], w = [s[2], s[3]], r = traj3(t);
        const tp = [0, 1].map(i => r[i][2] - kv * (w[i] - r[i][1]) - kp * (q[i] - r[i][0]));   // 단위 질량 제어 τ′
        let tau;
        if (mode === 'ind') tau = [MBAR[0] * tp[0], MBAR[1] * tp[1]];                       // 관절마다 상수 관성으로
        else { const Vh = Vof(q, w); tau = mv(Mof(q[1]), tp).map((v, i) => v + Vh[i]); }    // 모델(물건은 모른다)
        const V = Vof(q, w, mp), a = clampV(mv(inv(Mof(q[1], mp)), [tau[0] - V[0], tau[1] - V[1]]), 1e4);
        return [w[0], w[1], a[0], a[1]];
      };
      let s = [QA[0], QA[1], 0, 0], t = 0, emax = 0, bad = false;
      const err = [[0, 0]], hand = [fk(QA)];
      const n = Math.round(TEND / H3);
      for (let i = 1; i <= n; i++) {
        s = rk4(f, t, s, H3); t = i * H3;
        if (!ok(s)) { bad = true; break; }
        const r = traj3(t), e = Math.hypot(s[0] - r[0][0], s[1] - r[1][0]) / D;
        emax = Math.max(emax, e);
        if (i % 5 === 0) { err.push([t, e]); hand.push(fk([s[0], s[1]])); }
      }
      out[mode] = { err, hand, emax, bad };
    });
    out.des = [];
    for (let t = 0; t <= TEND + 1e-9; t += 0.02) { const r = traj3(t); out.des.push(fk([r[0][0], r[1][0]])); }
    return (cache3[key] = out);
  };
  FIG.fig15_3 = el => interactive(el, {
    state: { wn: 10, mp: 0 },
    sliders: [{ key: 'wn', label: '이득 ωₙ (rad/s)', min: 4, max: 30, step: 1, unit: '' },
      { key: 'mp', label: '모델이 모르는 손의 물건', min: 0, max: 10, step: 1, unit: ' g' }],
    draw: ({ wn, mp }) => {
      const id = 'f153', r = sim3(wn, mp), bx = 66, by = 232, s = 6.5, P = h => [bx + s * h[0], by - s * h[1]];
      const top = Math.max(r.ind.emax, r.ct.emax), nice = [1, 2, 5, 10, 20, 50, 100, 200].find(v => v >= top * 1.05) || 200;
      const gx = t => 252 + t / TEND * 208, gy = e => 268 - Math.min(e, nice) / nice * 180;
      const A0 = armPts(bx, by, s, QA), A1 = armPts(bx, by, s, QB);
      return svg(id, [40, 296], [
        base(bx, by),
        ghostArm(A0, 'axis'), ghostArm(A1, 'axis', 'stroke-dasharray="4 3"'), joint(bx, by, 6),
        poly(r.des.map(P), 's-axis', 1.5, 'stroke-dasharray="3 3"'),
        poly(r.ind.hand.map(P), 's-c2', 2.25), poly(r.ct.hand.map(P), 's-c1', 2.25),
        C(...A0.H, 4, 'f-ink', 0), T(A0.H[0] + 10, A0.H[1] + 5, '출발', { s: 12.5, c: 'q' }),
        C(...A1.H, 4, 'f-ink', 0), T(A1.H[0] - 10, A1.H[1] + 5, '도착 (1초)', { a: 'end', s: 12.5, c: 'q' }),
        T(16, 62, '손끝의 길 (책상 위)', { c: 'b', s: 13 }),
        // 그래프
        T(252, 62, '관절 각도 오차 (°)', { c: 'b', s: 13 }),
        L(252, 268, 460, 268, 'axis', 1.25), L(252, 268, 252, 84, 'axis', 1.25),
        L(252, gy(nice), 460, gy(nice), 'grid', 1), L(252, gy(nice / 2), 460, gy(nice / 2), 'grid', 1),
        T(246, gy(nice) + 4, String(nice), { a: 'end', c: 'q', s: 12 }), T(246, gy(nice / 2) + 4, String(nice / 2), { a: 'end', c: 'q', s: 12 }), T(246, 272, '0', { a: 'end', c: 'q', s: 12 }),
        L(gx(1), 84, gx(1), 268, 'axis', 1, 'stroke-dasharray="3 3"'),
        T(gx(0), 286, '0', { a: 'middle', c: 'q', s: 12 }), T(gx(1), 286, '1 s', { a: 'middle', c: 'q', s: 12 }), T(gx(1.5), 286, '1.5 s', { a: 'middle', c: 'q', s: 12 }),
        poly(r.ind.err.map(([t, e]) => [gx(t), gy(e)]), 's-c2', 2.25), poly(r.ct.err.map(([t, e]) => [gx(t), gy(e)]), 's-c1', 2.25),
        L(274, 304, 298, 304, 'c2', 3), T(304, 309, '독립 관절 제어', { s: 12.5 }),
        L(274, 324, 298, 324, 'c1', 3), T(304, 329, '계산 토크 (모델로 얽힘을 지움)', { s: 12.5 }),
        L(16, 304, 40, 304, 'axis', 1.5, 'stroke-dasharray="3 3"'), T(46, 309, '바라는 길', { s: 12.5 }),
      ].join(''), '독립 관절 제어는 얽힘 때문에 길을 벗어나고, 계산 토크 제어는 모델이 맞으면 오차가 거의 없다');
    },
    readout: ({ wn, mp }) => {
      const r = sim3(wn, mp);
      return `<div>가장 큰 오차: <span class="c2">독립 관절 제어 <b>${f1(r.ind.emax)}°</b></span> · <span class="c1">계산 토크 <b>${f1(r.ct.emax)}°</b></span></div>` +
        `<div class="q">k<sub>p</sub>′ = ω<sub>n</sub>² = ${wn * wn}, k<sub>v</sub>′ = 2ω<sub>n</sub> = ${2 * wn} (임계 감쇠) · 독립 관절 제어는 관성을 상수 (${Math.round(MBAR[0])}, ${Math.round(MBAR[1])}) g·cm²로 본다</div>`;
    },
  });

  // 그림 15-4 손끝을 끌어당기는 자석: F와 τ = JᵀF (슬라이더)
  const Q4 = [30 * D, 60 * D], KP4 = 2;                   // KP4: mN/cm
  const mag = (tx, ty) => {
    const h = fk(Q4), F = [KP4 * (tx - h[0]), KP4 * (ty - h[1])];               // mN
    const tau = mtv(jac(Q4), F).map(v => v / 100);                               // mN·cm → mN·m
    const acc = mv(inv(lamOf(Q4)), F.map(v => v * 100));                         // cm/s² (1 mN = 100 g·cm/s²)
    return { h, F, tau, acc };
  };
  FIG.fig15_4 = el => interactive(el, {
    state: { tx: -4, ty: 6 },
    sliders: [{ key: 'tx', label: '목표 x', min: -16, max: 18, step: 0.5, unit: ' cm' }, { key: 'ty', label: '목표 y', min: -6, max: 18, step: 0.5, unit: ' cm' }],
    draw: ({ tx, ty }) => {
      const id = 'f154', bx = 170, by = 282, s = 8.5, P = armPts(bx, by, s, Q4), { F, tau, acc } = mag(tx, ty);
      const G = [bx + s * tx, by - s * ty], Fm = Math.hypot(...F), am = Math.hypot(...acc);
      const fl = Math.min(110, 1.6 * Fm), al = Math.min(110, 0.1 * am);
      const Ft = Fm > 0.01 ? [P.H[0] + fl * F[0] / Fm, P.H[1] - fl * F[1] / Fm] : P.H;
      const At = am > 0.01 ? [P.H[0] + al * acc[0] / am, P.H[1] - al * acc[1] / am] : P.H;
      const da = [Math.cos(Q4[0] + Math.PI) + Math.cos(Q4[0] + Q4[1]), Math.sin(Q4[0] + Math.PI) + Math.sin(Q4[0] + Q4[1])];
      const mid2 = Math.atan2(da[1], da[0]) + Math.PI, ext = v => Math.min(300, 20 + 26 * Math.abs(v)) * D;
      return svg(id, [44, 300], [
        annulus(bx, by, 18 * s, 2 * s),
        L(24, by, 330, by, 'grid', 1), base(bx, by),
        L(P.H[0], P.H[1], G[0], G[1], 'axis', 1.25, 'stroke-dasharray="2 4"'),
        drawArm(P, 'axis', 10),
        Math.abs(tau[0]) > 0.02 ? turn(id, bx, by, 30, -30 * D, ext(tau[0]), tau[0], 'c1') : '',
        Math.abs(tau[1]) > 0.02 ? turn(id, P.E[0], P.E[1], 22, mid2, ext(tau[1]), tau[1], 'c2') : '',
        T(bx + 46 * Math.cos(30 * D), by + 46 * Math.sin(30 * D) + 5, 'τ₁', { a: 'middle', c: 'f-c1 b', s: 14 }),
        T(P.E[0] + 40 * Math.cos(mid2), P.E[1] - 40 * Math.sin(mid2) + 5, 'τ₂', { a: 'middle', c: 'f-c2 b', s: 14 }),
        al > 2 ? L(P.H[0], P.H[1], At[0], At[1], 'c2', 1.75, 'stroke-dasharray="4 3" ' + A(id, 'c2')) : '',
        fl > 2 ? L(P.H[0], P.H[1], Ft[0], Ft[1], 'ink', 2.75, A(id, 'ink')) : '',
        C(P.H[0], P.H[1], 5, 'f-ink', 0),
        C(G[0], G[1], 11, 'f-none s-ink', 1.5), C(G[0], G[1], 3.5, 'f-ink', 0),
        T(G[0], G[1] - 18, '목표', { a: 'middle', c: 'b', s: 13 }),
        // 오른쪽: 범례와 토크 막대
        L(344, 62, 370, 62, 'ink', 2.75), T(376, 67, '손끝에 거는 힘 F', { s: 12.5 }),
        L(344, 84, 370, 84, 'c2', 1.75, 'stroke-dasharray="4 3"'), T(376, 89, '처음 가속 ẍ', { s: 12.5 }),
        T(344, 124, '관절 토크 (mN·m)', { c: 'q', s: 12.5 }),
        T(356, 152, 'τ₁', { a: 'end', c: 'f-c1 b', s: 13 }), dbar(414, 142, 50, tau[0], 8, 'f-c1'),
        T(356, 180, 'τ₂', { a: 'end', c: 'f-c2 b', s: 13 }), dbar(414, 170, 50, tau[1], 8, 'f-c2'),
        T(364, 206, '−8', { a: 'middle', c: 'q', s: 12 }), T(414, 206, '0', { a: 'middle', c: 'q', s: 12 }), T(464, 206, '+8', { a: 'middle', c: 'q', s: 12 }),
      ].join(''), '목표가 손끝을 끌어당기는 힘 F를 정하고, 자코비안 전치가 그 힘을 두 관절의 토크로 바꾼다');
    },
    readout: ({ tx, ty }) => {
      const { h, F, tau, acc } = mag(tx, ty), J = jac(Q4);
      const ang = v => Math.atan2(v[1], v[0]) / D;
      let gap = Math.abs(ang(F) - ang(acc)); if (gap > 180) gap = 360 - gap;
      const Fm = Math.hypot(...F);
      return `<div><b>F</b> = ${KP4} mN/cm × (목표 − 손끝 (${f1(h[0])}, ${f1(h[1])})) = <b>(${f1(F[0])}, ${f1(F[1])}) mN</b></div>` +
        `<div class="matrow"><b>Jᵀ</b> = ${matrix2(f2(J[0][0]), f2(J[1][0]), f2(J[0][1]), f2(J[1][1]), ['', ''])}<span>→ <span class="c1">τ₁ = <b>${f2(tau[0])}</b></span>, <span class="c2">τ₂ = <b>${f2(tau[1])}</b></span> mN·m</span></div>` +
        (Fm > 0.05 ? `<div class="q">멈춘 팔의 처음 가속 ẍ = Λ⁻¹F 는 F와 ${Math.round(gap)}° 어긋난다 (15.6절)</div>` : '<div class="q">손끝이 목표에 있어 힘이 0이다</div>');
    },
  });

  // 그림 15-5 손끝이 느끼는 질량: Λ 타원 (슬라이더)
  FIG.fig15_5 = el => interactive(el, {
    state: { t2: 90, ph: 45 },
    sliders: [{ key: 't2', label: '팔꿈치 θ₂', min: 3, max: 177, step: 1, unit: '°' }, { key: 'ph', label: '미는 방향', min: -180, max: 180, step: 5, unit: '°' }],
    draw: ({ t2, ph }) => {
      const id = 'f155', q = [0, t2 * D], Lm = lamOf(q), [big, small, ang] = eig2(Lm);
      const bx = 54, by = 204, s = 10, P = armPts(bx, by, s, q), k = 9.5;
      const u = [Math.cos(ph * D), Math.sin(ph * D)], a = mv(inv(Lm), u), am = Math.hypot(...a), al = Math.min(100, 300 * am);
      const At = am > 1e-9 ? [P.H[0] + al * a[0] / am, P.H[1] - al * a[1] / am] : P.H, Ft = [P.H[0] + 50 * u[0], P.H[1] - 50 * u[1]];
      const ru = Math.sqrt(1 / (u[0] * a[0] + u[1] * a[1])) * k;                 // 미는 방향의 반지름 = √(느끼는 질량)
      // 오른쪽 작은 그래프: θ₂에 따른 가장 무거운·가벼운 방향의 질량
      const gx = t => 316 + t / 180 * 148, gy = m => 236 - Math.min(m, 100) / 100 * 150;
      const cv = idx => { const p = []; for (let t = 3; t <= 177; t += 2) p.push([gx(t), gy(eig2(lamOf([0, t * D]))[idx])]); return p; };
      return svg(id, [48, 254], [
        `<clipPath id="${id}-clip"><rect x="8" y="48" width="292" height="214"/></clipPath>`,
        L(24, by, 300, by, 'grid', 1), base(bx, by), drawArm(P, 'axis', 10),
        `<g clip-path="url(#${id}-clip)">`,
        `<ellipse cx="${P.H[0]}" cy="${P.H[1]}" rx="${k * Math.sqrt(big)}" ry="${k * Math.sqrt(Math.max(small, 0))}" transform="rotate(${-ang / D} ${P.H[0]} ${P.H[1]})" class="f-c1 s-c1" fill-opacity="0.13" stroke-width="1.75"/>`,
        L(P.H[0], P.H[1], P.H[0] + ru * u[0], P.H[1] - ru * u[1], 'c1', 1, 'stroke-dasharray="2 3"'),
        '</g>',
        L(P.H[0], P.H[1], Ft[0], Ft[1], 'ink', 2.75, A(id, 'ink')),
        al > 2 ? L(P.H[0], P.H[1], At[0], At[1], 'c2', 2.25, A(id, 'c2')) : '',
        C(P.H[0], P.H[1], 4.5, 'f-ink', 0),
        T(Ft[0] + 12 * u[0], Ft[1] - 12 * u[1] + 5, 'F', { a: 'middle', c: 'b', s: 14 }),
        k * Math.sqrt(big) > 150 ? T(16, 64, '타원이 그림 밖까지 길다', { c: 'f-c1', s: 12.5 }) : '',
        // 범례
        L(16, 290, 40, 290, 'ink', 2.75), T(46, 295, '미는 힘 F', { s: 12.5 }),
        L(130, 290, 154, 290, 'c2', 2.25), T(160, 295, '생기는 가속도 ẍ', { s: 12.5 }),
        // 그래프
        T(316, 62, '방향별 질량 (g)', { c: 'b', s: 12.5 }),
        L(316, 236, 464, 236, 'axis', 1.25), L(316, 236, 316, 82, 'axis', 1.25),
        L(316, gy(50), 464, gy(50), 'grid', 1), L(316, gy(100), 464, gy(100), 'grid', 1),
        T(310, gy(100) + 4, '100', { a: 'end', c: 'q', s: 12 }), T(310, gy(50) + 4, '50', { a: 'end', c: 'q', s: 12 }), T(310, 240, '0', { a: 'end', c: 'q', s: 12 }),
        T(gx(0), 254, '0°', { a: 'middle', c: 'q', s: 12 }), T(gx(90), 254, '90°', { a: 'middle', c: 'q', s: 12 }), T(gx(180), 254, '180°', { a: 'middle', c: 'q', s: 12 }),
        T(gx(135), 272, 'θ₂', { a: 'middle', c: 'q', s: 12.5 }),
        `<clipPath id="${id}-gclip"><rect x="316" y="84" width="150" height="153"/></clipPath>`,
        `<g clip-path="url(#${id}-gclip)">`, poly(cv(0), 's-ink', 2), poly(cv(1), 's-axis', 2, 'stroke-dasharray="4 3"'), '</g>',
        L(gx(t2), 84, gx(t2), 236, 'c1', 1, 'stroke-dasharray="2 3"'),
        C(gx(t2), gy(big), 4, 'f-ink', 0), C(gx(t2), gy(small), 4, 'f-axis', 0),
        L(352, 100, 372, 100, 'ink', 2), T(378, 105, '무거운 쪽', { s: 12 }),
        L(352, 118, 372, 118, 'axis', 2, 'stroke-dasharray="4 3"'), T(378, 123, '가벼운 쪽', { c: 'q', s: 12 }),
      ].join(''), '손끝의 질량 타원: 반지름은 그 방향으로 밀 때 느끼는 질량의 제곱근이고, 팔을 펴거나 접을수록 팔 방향으로 길어진다');
    },
    readout: ({ t2, ph }) => {
      const q = [0, t2 * D], Lm = lamOf(q), [big, small] = eig2(Lm), u = [Math.cos(ph * D), Math.sin(ph * D)], a = mv(inv(Lm), u);
      const mu = 1 / (u[0] * a[0] + u[1] * a[1]);
      let gap = Math.abs(ph - Math.atan2(a[1], a[0]) / D); if (gap > 180) gap = 360 - gap;
      return `<div class="matrow"><b>Λ</b> = ${matrix2(f1(Lm[0][0]), f1(Lm[0][1]), f1(Lm[1][0]), f1(Lm[1][1]), ['', ''])}<span class="q">g · θ₁ = 0°로 둔 팔</span></div>` +
        `<div>${ph}° 방향의 실효 질량 <b>${f1(mu)} g</b> · 가속은 미는 방향과 <b>${Math.round(gap)}°</b> 어긋난다</div>` +
        `<div class="q">가장 무거운 방향 ${f1(big)} g, 가장 가벼운 방향 ${f1(small)} g</div>`;
    },
  });

  // 그림 15-6 강의 예제: 회전 + 직동 팔의 Λ
  FIG.fig15_6 = el => {
    const id = 'f156', ox = 70, oy = 246, a = 30 * D, u = [Math.cos(a), -Math.sin(a)], n = [-Math.sin(a), -Math.cos(a)];   // n: 화면에서 팔에 수직(왼쪽 위)
    const at = (k, side = 0) => [ox + k * u[0] + side * n[0], oy + k * u[1] + side * n[1]];
    const Mp = at(196), kk = 34, ra = kk * Math.sqrt(2), rb = kk * Math.sqrt(3.6);
    el.innerHTML += svg(id, [40, 262], [
      L(ox, oy, ox + 120, oy, 'axis', 1, 'stroke-dasharray="4 4"'),
      `<rect x="${ox - 22}" y="${oy + 8}" width="44" height="13" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      arc(ox, oy, 54, 0, a, 'axis', 1.25), T(ox + 66, oy - 8, 'θ₁', { c: 'b', s: 13 }),
      L(...at(0), ...at(128), 'axis', 22, 'stroke-linecap="round" stroke-opacity="0.45"'),
      link(...at(36), ...at(250), 'axis', 9),
      joint(ox, oy, 8),
      C(...at(62), 5, 'f-ink', 0), T(...at(62, 22), sub('m', '1'), { a: 'middle', c: 'b', s: 13 }),
      `<ellipse cx="${Mp[0]}" cy="${Mp[1]}" rx="${ra}" ry="${rb}" transform="rotate(${-a / D} ${Mp[0]} ${Mp[1]})" class="f-c1 s-c1" fill-opacity="0.13" stroke-width="1.75"/>`,
      L(...Mp, ...at(196 + ra), 'c1', 2.25, A(id, 'c1')), L(...Mp, ...at(196, rb), 'c1', 2.25, A(id, 'c1')),
      C(...Mp, 6, 'f-c1', 0),
      T(at(196 + ra + 14)[0], at(196 + ra + 14)[1] + 5, sub('x', '1'), { c: 'f-c1 b', s: 13 }),
      T(at(196, rb + 14)[0], at(196, rb + 14)[1] + 2, sub('y', '1'), { a: 'middle', c: 'f-c1 b', s: 13 }),
      T(Mp[0] + 10, Mp[1] + 26, sub('m', '2'), { c: 'b', s: 13 }),
      // 축 이름표
      T(330, 196, sub('x', '1') + ' 방향: ' + sub('m', '2'), { c: 'b', s: 13 }), T(330, 214, '링크 2만 미끄러진다', { c: 'q', s: 12.5 }),
      T(16, 66, sub('y', '1') + ' 방향: ' + sub('m', '2') + ' + ' + sub('m', '2') + '′', { c: 'b', s: 13 }), T(16, 84, '팔 전체를 돌려야 한다', { c: 'q', s: 12.5 }),
      // 받침 좌표계
      L(ox, oy, ox, oy - 60, 'axis', 1.25, A(id, 'axis')), T(ox - 8, oy - 50, sub('y', '0'), { a: 'end', c: 'q', s: 12.5 }),
      T(ox + 126, oy + 5, sub('x', '0'), { c: 'q', s: 12.5 }),
      T(464, 282, '타원의 반지름 = √(그 방향의 실효 질량)', { a: 'end', c: 'q', s: 12 }),
    ].join(''), '회전 직동 팔의 손끝 질량은 링크 방향으로 m2, 수직 방향으로 m2 + m2 프라임이다');
  };

  // 그림 15-7 작업 공간 제어: Λ 모델의 있고 없음 (슬라이더)
  const Q7 = [-10 * D, 100 * D], WN7 = 4, MB7 = 12.5, H7 = 0.002, T7 = 3;
  const target7 = (tx, ty) => {
    const r = Math.hypot(tx, ty), rr = Math.max(5, Math.min(16.5, r));
    return r < 1e-6 ? [5, 0] : [tx * rr / r, ty * rr / r];
  };
  const cache7 = {};
  const sim7 = (tx, ty) => {
    const key = tx + ',' + ty;
    if (cache7[key]) return cache7[key];
    const xd = target7(tx, ty), qg = ik(...xd), kp = WN7 * WN7, kv = 2 * WN7, out = { xd };
    ['lam', 'pd', 'joint'].forEach(mode => {
      let tmax = 0;
      const ctrl = (q, w) => {
        if (mode === 'joint') {                                                    // 관절 공간 계산 토크 (목표 각도는 역기구학)
          const tp = [0, 1].map(i => -kp * (q[i] - qg[i]) - kv * w[i]), Vh = Vof(q, w);
          return mv(Mof(q[1]), tp).map((v, i) => v + Vh[i]);
        }
        const x = fk(q), xv = mv(jac(q), w), Fp = [0, 1].map(i => -kp * (x[i] - xd[i]) - kv * xv[i]);   // 단위 질량 제어 F′
        if (mode === 'pd') return mtv(jac(q), Fp.map(v => MB7 * v));               // Λ 없이: 질량을 12.5 g로 어림
        const Ji = jinv(q), Lm = mm(tr(Ji), mm(Mof(q[1]), Ji));
        const mu = mtv(Ji, Vof(q, w)).map((v, i) => v - mv(Lm, jdqd(q, w))[i]);   // μ = J⁻ᵀV − ΛJ̇q̇
        const F = mv(Lm, Fp).map((v, i) => v + mu[i]);
        return mtv(jac(q), F);                                                     // τ = JᵀF
      };
      const f = (t, s) => {
        const q = [s[0], s[1]], w = [s[2], s[3]], tau = ctrl(q, w), V = Vof(q, w);
        const a = clampV(mv(inv(Mof(q[1])), [tau[0] - V[0], tau[1] - V[1]]), 2e4);
        return [w[0], w[1], a[0], a[1]];
      };
      let s = [Q7[0], Q7[1], 0, 0], bad = false;
      const hand = [fk(Q7)], dots = [];
      const n = Math.round(T7 / H7);
      for (let i = 1; i <= n; i++) {
        s = rk4(f, 0, s, H7);
        if (!ok(s)) { bad = true; break; }
        const q = [s[0], s[1]];
        tmax = Math.max(tmax, ...ctrl(q, [s[2], s[3]]).map(Math.abs));
        if (i % 5 === 0) hand.push(fk(q));
        if (i % 125 === 0) dots.push(fk(q));
      }
      const x0 = fk(Q7), d = [xd[0] - x0[0], xd[1] - x0[1]], dn = Math.hypot(...d) || 1, nn = [-d[1] / dn, d[0] / dn];
      const dev = Math.max(...hand.map(p => Math.abs((p[0] - x0[0]) * nn[0] + (p[1] - x0[1]) * nn[1])));
      out[mode] = { hand, dots, dev, bad, tmax: tmax * TO, q: [s[0], s[1]] };
    });
    return (cache7[key] = out);
  };
  FIG.fig15_7 = el => interactive(el, {
    state: { tx: -6, ty: 12 },
    sliders: [{ key: 'tx', label: '목표 x', min: -14, max: 16, step: 0.5, unit: ' cm' }, { key: 'ty', label: '목표 y', min: 2, max: 16, step: 0.5, unit: ' cm' }],
    draw: ({ tx, ty }) => {
      const id = 'f157', r = sim7(tx, ty), bx = 220, by = 268, s = 10.5, P = h => [bx + s * h[0], by - s * h[1]], G = P(r.xd);
      const A0 = armPts(bx, by, s, Q7), A1 = armPts(bx, by, s, r.lam.q);
      const dots = (m, cls) => r[m].dots.map(p => C(...P(p), 2.6, cls, 0)).join('');
      const x0 = fk(Q7), dd = [r.xd[0] - x0[0], r.xd[1] - x0[1]], dn = Math.hypot(...dd) || 1, off = [-26 * dd[0] / dn, 26 * dd[1] / dn];   // 가는 쪽의 반대편에 이름표
      return svg(id, [44, 300], [
        annulus(bx, by, 18 * s, 2 * s),
        L(24, by, 460, by, 'grid', 1), base(bx, by),
        ghostArm(A0, 'axis'), drawArm(A1, 'c1', 9),
        poly(r.joint.hand.map(P), 's-axis', 2, 'stroke-dasharray="5 4"'),
        poly(r.pd.hand.map(P), 's-c2', 2.5), poly(r.lam.hand.map(P), 's-c1', 2.5),
        dots('pd', 'f-c2'), dots('lam', 'f-c1'), dots('joint', 'f-axis'),
        C(...A0.H, 4.5, 'f-ink', 0), T(A0.H[0] + off[0], A0.H[1] + off[1] + 5, '출발', { a: 'middle', c: 'q', s: 12.5 }),
        C(G[0], G[1], 11, 'f-none s-ink', 1.5), C(G[0], G[1], 3, 'f-ink', 0),
        T(G[0], G[1] - 17, '목표', { a: 'middle', c: 'b', s: 13 }),
        L(16, 316, 40, 316, 'c1', 3), T(46, 321, 'F = ΛF′ + μ', { s: 12.5 }),
        L(164, 316, 188, 316, 'c2', 3), T(194, 321, 'Λ 없이 (12.5 g로 어림)', { s: 12.5 }),
        L(16, 338, 40, 338, 'axis', 2, 'stroke-dasharray="5 4"'), T(46, 343, '관절 공간 계산 토크', { s: 12.5 }),
        T(464, 343, '점 간격 0.25초', { a: 'end', c: 'q', s: 12 }),
      ].join(''), '손끝의 질량 모델을 쓰면 손끝이 곧은 길로 가고, 쓰지 않거나 관절 공간에서 제어하면 휜 길로 간다');
    },
    readout: ({ tx, ty }) => {
      const r = sim7(tx, ty), moved = Math.abs(r.xd[0] - tx) > 0.01 || Math.abs(r.xd[1] - ty) > 0.01;
      const bad = ['lam', 'pd', 'joint'].some(m => r[m].bad);
      return `<div>곧은 선에서 벗어난 가장 큰 거리: <span class="c1">Λ 모델 <b>${f2(r.lam.dev)}</b></span> · <span class="c2">Λ 없이 <b>${f2(r.pd.dev)}</b></span> · 관절 공간 <b>${f2(r.joint.dev)}</b> cm</div>` +
        `<div class="q">가장 큰 관절 토크 ${f2(r.lam.tmax)} · ${f2(r.pd.tmax)} · ${f2(r.joint.tmax)} mN·m · k<sub>p</sub>′ = 16, k<sub>v</sub>′ = 8 (ω<sub>n</sub> = 4 rad/s)</div>` +
        (moved ? `<div class="q">목표를 닿는 곳(어깨에서 5~16.5 cm) 안으로 옮겨 (${f1(r.xd[0])}, ${f1(r.xd[1])}) cm로 했다</div>` : '') +
        (bad ? '<div class="q">특이점 가까이에서 계산이 멈췄다</div>' : '');
    },
  });

  // 그림 15-8 작업 공간 제어의 블록 그림
  FIG.fig15_8 = el => {
    const id = 'f158', yc = 110, model = { cls: 'f-c1 s-c1', op: 0.1 };
    el.innerHTML += svg(id, [44, 236], [
      `<rect x="184" y="68" width="292" height="144" rx="10" fill="none" class="s-c1" stroke-width="1.25" stroke-dasharray="5 4"/>`,
      T(192, 62, '밖에서 보면 ẍ = F′ (단위 질량)', { c: 'f-c1 b', s: 13 }),
      box(8, yc - 28, 76, 56, ['목표', sub('x', 'd') + ', ' + sub('ẋ', 'd') + ', ' + sub('ẍ', 'd')]),
      path(id, [[84, yc], [96, yc]]),
      box(98, yc - 28, 78, 56, ['단위 질량', '제어 F′']),
      path(id, [[176, yc], [190, yc]]),
      box(192, yc - 22, 56, 44, [hat('Λ') + '(x) ×'], model),
      path(id, [[248, yc], [262, yc]]),
      sumC(271, yc),
      path(id, [[280, yc], [298, yc]]), T(289, yc - 8, 'F', { a: 'middle', c: 'b', s: 13 }),
      box(300, yc - 22, 40, 44, ['Jᵀ'], model),
      path(id, [[340, yc], [362, yc]]), T(351, yc - 8, 'τ', { a: 'middle', c: 'b', s: 13 }),
      box(364, yc - 28, 104, 56, ['팔', '모터가 τ를 낸다']),
      box(236, 160, 70, 36, [hat('μ') + ' + ' + hat('p')], model),
      path(id, [[271, 160], [271, yc + 11]]),
      `<path d="M416 138V244H178" fill="none" class="s-ink" stroke-width="1.5" ${A(id, 'ink')}/>`,
      path(id, [[271, 244], [271, 198]]), C(271, 244, 2.5, 'f-ink', 0),
      box(96, 222, 82, 44, ['순기구학', 'x, ẋ = J q̇']),
      path(id, [[137, 222], [137, yc + 30]]), T(144, 196, 'x, ẋ', { s: 12.5 }),
      T(470, 264, 'q, q̇ (엔코더)', { a: 'end', c: 'q', s: 12.5 }),
    ].join(''), '작업 공간 제어: 단위 질량 제어 F 프라임에 손끝 질량 추정을 곱하고 mu와 p 추정을 더한 힘을 자코비안 전치로 토크로 바꾼다');
  };
})();
