// 14장 그림: PD 이득과 감쇠, 제어 분할, 궤적 따라가기, 외란과 PID, 기어비와 유효 관성
(function () {
  const { D, f1, f2, svg, T, L, A, AA, C, joint, link, arc, interactive, sub } = FigKit;
  const FIG = window.FIG;

  const dash = 'stroke-dasharray="4 4"';
  const mn = s => String(s).replace('-', '−');                        // 빼기 부호
  const m1 = v => mn(f1(v)), m2 = v => mn(f2(v));
  const poly = (pts, cls, w = 1.5, more = '') =>
    `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}" fill="none" class="${cls}" stroke-width="${w}" stroke-linejoin="round" ${more}/>`;
  const box = (x, y, w, h, cls = 'f-none s-axis', more = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="${cls}" stroke-width="1.25" ${more}/>`;
  const key = (x, y, c, txt, more = '') => L(x, y, x + 24, y, c, 2.5, more) + T(x + 32, y + 5, txt, { s: 12.5 });
  // 글자 위 모자(ˆ): 결합 문자는 글꼴에 따라 비켜 그려져서 직접 그린다
  const hat = (x, y) => `<path d="M${x - 4} ${y + 3}L${x} ${y - 1}L${x + 4} ${y + 3}" fill="none" class="s-ink" stroke-width="1.4"/>`;
  const sq = (x, y, c, txt) => `<rect x="${x}" y="${y - 10}" width="12" height="12" class="f-${c}" fill-opacity="0.6"/>` + T(x + 18, y + 1, txt, { s: 12.5 });

  // 그래프 틀: 가로 t, 세로 v. 눈금과 0선을 그리고, 곡선은 틀 밖으로 나가면 잘린다.
  const frame = o => {
    const X = t => o.x + (t - o.t0) / (o.t1 - o.t0) * o.w, Y = v => o.y + o.h - (v - o.v0) / (o.v1 - o.v0) * o.h;
    const b = [];
    (o.yt || []).forEach(v => b.push(L(o.x, Y(v), o.x + o.w, Y(v), 'grid', 1), T(o.x - 6, Y(v) + 4.5, mn(v), { a: 'end', c: 'q', s: 12.5 })));
    b.push(L(o.x, o.y, o.x, o.y + o.h, 'axis', 1.25));
    const z = o.v0 <= 0 && o.v1 >= 0 ? Y(0) : o.y + o.h;
    b.push(L(o.x, z, o.x + o.w, z, 'axis', 1.25));
    (o.xt || []).forEach(([t, txt]) => b.push(L(X(t), o.y + o.h, X(t), o.y + o.h + 4, 'axis', 1), T(X(t), o.y + o.h + 18, txt, { a: 'middle', c: 'q', s: 12.5 })));
    const clip = `<clipPath id="${o.id}"><rect x="${o.x}" y="${o.y - 2}" width="${o.w}" height="${o.h + 4}"/></clipPath>`;
    const lim = v => Math.max(o.v0 - 50, Math.min(o.v1 + 50, v));         // 터진 값은 틀 근처에서 자른다
    const line = (pts, cls, w = 2, more = '') => poly(pts.map(([t, v]) => [X(t), Y(lim(v))]), cls, w, `clip-path="url(#${o.id})" ${more}`);
    return { X, Y, svg: clip + b.join(''), line };
  };

  // 고정 간격 룽게-쿠타 4단. f(t, s)는 ds/dt. 값이 터지면 그 자리에서 멈춘다.
  const rk4 = (f, s0, Tend, dt) => {
    let s = s0.slice(), t = 0;
    const out = [[0, s.slice()]], n = Math.round(Tend / dt);
    for (let i = 1; i <= n; i++) {
      // 첫 단계는 칸의 바로 오른쪽, 끝 단계는 바로 왼쪽에서 잰다: 칸 경계에서 바뀌는 힘(외란 시작, 궤적 끝)을 정확히 넣는다.
      const k1 = f(t + 1e-9, s), k2 = f(t + dt / 2, s.map((v, j) => v + dt / 2 * k1[j]));
      const k3 = f(t + dt / 2, s.map((v, j) => v + dt / 2 * k2[j])), k4 = f(t + dt - 1e-9, s.map((v, j) => v + dt * k3[j]));
      s = s.map((v, j) => v + dt / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
      t = i * dt;
      if (!s.every(v => isFinite(v) && Math.abs(v) < 1e6)) break;
      out.push([t, s.slice()]);
    }
    return out;
  };
  const thin = (run, k) => run.filter((_, i) => i % k === 0 || i === run.length - 1);
  // 계단 응답의 넘침(%)과 2% 안에 드는 시각
  const stepInfo = (run, goal) => {
    let peak = -Infinity, tp = 0, ts = 0, out = false;
    run.forEach(([t, s]) => {
      peak = Math.max(peak, s[0]);
      if (Math.abs(s[0] - goal) > 0.02 * goal) ts = t;
    });
    tp = run.find(([, s]) => s[0] >= peak - 0.001 * goal)[0];             // 같은 높이의 봉우리가 여럿이면 첫 봉우리
    out = Math.abs(run[run.length - 1][1][0] - goal) > 0.02 * goal;
    return { over: Math.max(0, (peak - goal) / goal * 100), peak, tp, ts, out };
  };

  // 받침 위 블록: m = 2 kg, 목표 10 cm
  const M0 = 2, XD = 10;

  // 그림 14-1 PD = 가상의 용수철과 댐퍼
  FIG.fig14_1 = el => {
    const id = 'f141', gy = 206, bx = 300, bw = 72, xd = 180, ys = 166, yd = 190, cx = bx + bw / 2;
    const zig = [[xd, ys], [xd + 12, ys]];
    for (let i = 0; i < 9; i++) zig.push([xd + 18 + i * 10, ys + (i % 2 ? 8 : -8)]);
    zig.push([bx - 12, ys], [bx, ys]);
    el.innerHTML += svg(id, [52, 228], [
      `<rect x="16" y="${gy}" width="448" height="9" class="f-tint s-axis" stroke-width="1"/>`,
      `<rect x="16" y="120" width="12" height="${gy - 120}" class="f-tint s-axis" stroke-width="1"/>`,
      // 목표 자리 (가상의 기둥)
      L(xd, 96, xd, gy, 'ink', 1.25, dash), `<path d="M${xd - 7} ${gy + 14}L${xd + 7} ${gy + 14}L${xd} ${gy + 2}Z" class="f-ink"/>`,
      T(xd, 84, '목표 ' + sub('x', 'd'), { a: 'middle', c: 'b', s: 13.5 }),
      // 용수철
      poly(zig, 's-c1', 2), C(xd, ys, 3.5, 'f-c1', 0),
      T(240, 140, '가상 용수철 ' + sub('k', 'p'), { a: 'middle', c: 'b', s: 13 }),
      // 댐퍼: 벽에 붙은 통 + 블록에 붙은 피스톤
      L(28, yd, 96, yd, 'c2', 2), `<path d="M150 ${yd - 10}H96V${yd + 10}H150" fill="none" class="s-c2" stroke-width="2"/>`,
      L(132, yd - 7, 132, yd + 7, 'c2', 3), L(132, yd, bx, yd, 'c2', 2),
      T(124, gy + 34, '가상 댐퍼 ' + sub('k', 'v') + ' (받침에 붙었다)', { a: 'middle', c: 'b', s: 13 }),
      // 블록
      `<rect x="${bx}" y="148" width="${bw}" height="${gy - 148}" rx="4" class="f-c1 s-c1" fill-opacity="0.18" stroke-width="1.5"/>`,
      T(cx, 184, 'm', { a: 'middle', c: 'b', s: 16 }),
      L(cx, 104, cx, 146, 'axis', 1, 'stroke-dasharray="2 3"'),
      L(xd + 2, 110, cx - 2, 110, 'ink', 1.25, AA(id, 'ink')), T((xd + cx) / 2, 102, 'x − ' + sub('x', 'd'), { a: 'middle', s: 13 }),
      L(bx + bw + 6, 160, bx + bw + 46, 160, 'ink', 2, A(id, 'ink')), T(bx + bw + 26, 150, 'ẋ', { a: 'middle', c: 'b', s: 15 }),
      T(cx, gy + 34, '위치 x', { a: 'middle', c: 'q', s: 12.5 }),
      T(240, 270, '모터가 두 힘을 낸다: F = −' + sub('k', 'p') + '(x − ' + sub('x', 'd') + ') − ' + sub('k', 'v') + 'ẋ', { a: 'middle', s: 13.5 }),
    ].join(''), '모터 힘을 목표에 붙인 가상의 용수철과 받침에 붙인 가상의 댐퍼로 만든다');
  };

  // 그림 14-2 계단 응답 (슬라이더)
  FIG.fig14_2 = el => interactive(el, {
    state: { kp: 200, kv: 16 },
    sliders: [
      { key: 'kp', label: '위치 이득 kₚ (N/m)', min: 10, max: 800, step: 10, unit: '' },
      { key: 'kv', label: '속도 이득 kᵥ (N·s/m)', min: 0, max: 120, step: 1, unit: '' },
    ],
    draw: ({ kp, kv }) => {
      const id = 'f142', g = frame({ id: 'f142c', x: 56, y: 56, w: 368, h: 230, t0: 0, t1: 2, v0: 0, v1: 21, yt: [0, 5, 10, 15, 20], xt: [[0, '0'], [0.5, '0.5'], [1, '1'], [1.5, '1.5'], [2, '2 s']] });
      const sim = k => rk4((t, s) => [s[1], (-kp * (s[0] - XD) - k * s[1]) / M0], [0, 0], 2, 0.002);
      const run = sim(kv), crit = sim(2 * Math.sqrt(M0 * kp)), info = stepInfo(run, XD);
      const b = [g.svg,
        L(g.X(0), g.Y(XD), g.X(2), g.Y(XD), 'ink', 1, dash), T(g.X(2) + 6, g.Y(XD) + 4.5, '목표', { c: 'q', s: 12.5 }),
        g.line(thin(crit, 4).map(([t, s]) => [t, s[0]]), 's-axis', 2, 'stroke-dasharray="6 4"'),
        g.line(thin(run, 2).map(([t, s]) => [t, s[0]]), 's-c1', 2.5),
        T(48, 44, 'x (cm)', { a: 'end', c: 'q', s: 12.5 }),
      ];
      if (info.over > 0.5 && info.peak < 21) {
        const px = g.X(info.tp), py = g.Y(info.peak);
        b.push(C(px, py, 4.5, 'f-c2', 0), T(px > 350 ? px - 8 : px + 8, py - 8, `넘침 ${Math.round(info.over)}%`, { a: px > 350 ? 'end' : 'start', c: 'b', s: 13 }));
      }
      if (!info.out && info.ts > 0.01) b.push(L(g.X(info.ts), g.Y(0), g.X(info.ts), g.Y(XD) + 10, 'c2', 1.25, 'stroke-dasharray="2 3"'), T(g.X(info.ts) + 4, g.Y(0) - 8, '2% 안', { c: 'q', s: 12.5 }));
      b.push(key(64, 324, 'c1', '지금 이득'), key(200, 324, 'axis', '같은 k<tspan baseline-shift="sub" font-size="10">p</tspan>에서 ζ = 1', 'stroke-dasharray="6 4"'));
      return svg(id, [28, 310], b.join(''), '위치 이득과 속도 이득에 따라 계단 응답이 빨라지거나 출렁인다');
    },
    readout: ({ kp, kv }) => {
      const w = Math.sqrt(kp / M0), z = kv / (2 * Math.sqrt(M0 * kp)), kc = 2 * Math.sqrt(M0 * kp);
      const run = rk4((t, s) => [s[1], (-kp * (s[0] - XD) - kv * s[1]) / M0], [0, 0], 2, 0.002), info = stepInfo(run, XD);
      const kind = z < 0.995 ? '덜 감쇠: 출렁인다' : z <= 1.005 ? '임계 감쇠' : '더 감쇠: 느리게 다가간다';
      return `<div>m = 2 kg · <b>ω<sub>n</sub></b> = √(k<sub>p</sub>/m) = <b>${f2(w)} rad/s</b> (${f2(w / 2 / Math.PI)} Hz) · <b>ζ</b> = k<sub>v</sub> / (2√(m k<sub>p</sub>)) = <b>${f2(z)}</b> <span class="q">(${kind})</span></div>` +
        `<div>넘침 <b>${info.over < 0.05 ? '없음' : f1(info.over) + '%'}</b> · 2% 안에 드는 시각 <b>${info.out ? '2초 안에 못 든다' : f2(info.ts) + ' s'}</b></div>` +
        `<div class="q">이 k<sub>p</sub>에서 임계 감쇠(ζ = 1)가 되는 k<sub>v</sub> = 2√(m k<sub>p</sub>) = ${f1(kc)} N·s/m</div>`;
    },
  });

  // 그림 14-3 제어 분할의 흐름
  FIG.fig14_3 = el => {
    const id = 'f143', r1 = 108, by = 186, fy = 262;
    el.innerHTML += svg(id, [40, 248], [
      box(140, 66, 332, 152, 'f-none s-c1', 'stroke-dasharray="5 4"'),
      T(304, 58, '점선 안은 단위 질량처럼 움직인다: ẍ = F′', { a: 'middle', c: 'b', s: 13 }),
      // 단위 질량 제어기
      T(36, 50, sub('x', 'd'), { a: 'middle', s: 13 }), T(64, 50, sub('ẋ', 'd'), { a: 'middle', s: 13 }), T(92, 50, sub('ẍ', 'd'), { a: 'middle', s: 13 }), L(64, 58, 64, r1 - 26, 'ink', 1.5, A(id, 'ink')),
      box(16, r1 - 24, 96, 48, 'f-tint s-axis'), T(64, r1 - 3, 'F′', { a: 'middle', c: 'b', s: 15 }), T(64, r1 + 16, '단위 질량용', { a: 'middle', s: 12.5 }),
      L(112, r1, 150, r1, 'ink', 1.5, A(id, 'ink')), T(126, r1 - 8, 'F′', { a: 'middle', c: 'q', s: 12.5 }),
      // α
      box(152, r1 - 20, 56, 40, 'f-c1 s-c1', 'fill-opacity="0.15"'), T(170, r1 + 5, '×', { a: 'middle', c: 'b', s: 14 }), T(188, r1 + 5, 'm', { a: 'middle', c: 'b', s: 14 }), hat(188, r1 - 9),
      T(180, r1 - 28, 'α', { a: 'middle', c: 'b', s: 14 }),
      L(208, r1, 228, r1, 'ink', 1.5, A(id, 'ink')),
      C(240, r1, 11, 'f-none s-ink', 1.5), T(240, r1 + 5, '+', { a: 'middle', c: 'b', s: 15 }),
      L(251, r1, 284, r1, 'ink', 1.5, A(id, 'ink')), T(268, r1 - 8, 'F', { a: 'middle', c: 'q', s: 12.5 }),
      // 시스템
      box(286, r1 - 26, 176, 52, 'f-tint s-ink'), T(374, r1 - 6, '실제 시스템', { a: 'middle', c: 'b', s: 13.5 }), T(374, r1 + 14, 'm ẍ + b(x, ẋ) = F', { a: 'middle', s: 13 }),
      // β
      box(196, by - 20, 88, 40, 'f-c2 s-c2', 'fill-opacity="0.15"'), T(220, by + 5, 'b', { a: 'middle', c: 'b', s: 14 }), hat(220, by - 10), T(225, by + 5, '(x, ẋ)', { c: 'b', s: 14 }),
      T(292, by + 5, 'β', { c: 'b', s: 14 }),
      L(240, by - 20, 240, r1 + 13, 'ink', 1.5, A(id, 'ink')),
      // 되먹임
      `<path d="M462 ${r1}H476V${fy}H64V${r1 + 26}" fill="none" class="s-axis" stroke-width="1.5" ${A(id, 'axis')}/>`,
      L(240, fy, 240, by + 22, 'axis', 1.5, A(id, 'axis')),
      T(472, fy + 18, '측정한 x, ẋ', { a: 'end', c: 'q', s: 12.5 }), T(76, fy - 8, '오차를 만든다', { c: 'q', s: 12.5 }),
      T(316, by - 2, '모델로 계산한', { c: 'q', s: 12.5 }), T(316, by + 16, '비선형 몫', { c: 'q', s: 12.5 }),
    ].join(''), '단위 질량용 제어 F′에 추정 질량을 곱하고 모델로 계산한 비선형 항을 더하면 점선 안이 단위 질량 시스템처럼 된다');
  };

  // 그림 14-4 질량이 바뀌어도 같은 응답 (슬라이더)
  FIG.fig14_4 = el => interactive(el, {
    state: { m: 6, r: 1 },
    sliders: [
      { key: 'm', label: '실제 질량 m', min: 0.5, max: 8, step: 0.5, unit: ' kg' },
      { key: 'r', label: '추정 질량 ÷ 실제 질량', min: 0.5, max: 1.5, step: 0.05, unit: '' },
    ],
    draw: ({ m, r }) => {
      const id = 'f144', g = frame({ id: 'f144c', x: 56, y: 56, w: 404, h: 220, t0: 0, t1: 1.2, v0: 0, v1: 15, yt: [0, 5, 10, 15], xt: [[0, '0'], [0.4, '0.4'], [0.8, '0.8'], [1.2, '1.2 s']] });
      const sim = (kp, kv, mm) => rk4((t, s) => [s[1], (-kp * (s[0] - XD) - kv * s[1]) / mm], [0, 0], 1.2, 0.002);
      const mh = r * m, fix = sim(200, 40, m), par = sim(100 * mh, 20 * mh, m), ref = sim(200, 40, 2);
      const P = run => thin(run, 2).map(([t, s]) => [t, s[0]]);
      return svg(id, [28, 346], [
        g.svg, T(48, 44, 'x (cm)', { a: 'end', c: 'q', s: 12.5 }),
        L(g.X(0), g.Y(XD), g.X(1.2), g.Y(XD), 'ink', 1, dash),
        g.line(P(ref), 's-axis', 2, 'stroke-dasharray="6 4"'),
        g.line(P(fix), 's-c2', 2.5),
        g.line(P(par), 's-c1', 2.5),
        key(56, 316, 'c2', '고정 이득 k<tspan baseline-shift="sub" font-size="10">p</tspan> = 200, k<tspan baseline-shift="sub" font-size="10">v</tspan> = 40 (2 kg에 맞춤)'),
        key(56, 338, 'c1', '제어 분할 k<tspan baseline-shift="sub" font-size="10">p</tspan> = 100 × 추정 질량, k<tspan baseline-shift="sub" font-size="10">v</tspan> = 20 × 추정 질량'),
        key(56, 360, 'axis', '기준: m = 2 kg', 'stroke-dasharray="6 4"'),
      ].join(''), '고정 이득은 질량이 바뀌면 응답이 달라지고, 제어 분할은 같은 응답을 지킨다');
    },
    readout: ({ m, r }) => {
      const wf = Math.sqrt(200 / m), zf = 40 / (2 * Math.sqrt(200 * m)), wp = 10 * Math.sqrt(r), zp = Math.sqrt(r);
      return `<div><span class="c2">● <b>고정 이득</b>: ω = √(200/m) = <b>${f2(wf)}</b> rad/s, ζ = <b>${f2(zf)}</b></span></div>` +
        `<div><span class="c1">● <b>제어 분할</b>: k<sub>p</sub> = ${f1(100 * r * m)}, k<sub>v</sub> = ${f1(20 * r * m)} → ω = 10√(추정/실제) = <b>${f2(wp)}</b> rad/s, ζ = √(추정/실제) = <b>${f2(zp)}</b></span></div>` +
        `<div class="q">추정이 맞으면 질량이 얼마든 ω = 10 rad/s, ζ = 1이다. 추정이 틀리면 그 비율의 제곱근만큼 달라진다.</div>`;
    },
  });

  // 궤적: 0초에서 1초 동안 0 → 10 cm (3차 다항식, 10장), 그다음 멈춘다
  const traj = t => {
    if (t < 0) return [0, 0, 0];
    if (t > 1) return [XD, 0, 0];
    return [XD * (3 * t * t - 2 * t ** 3), XD * (6 * t - 6 * t * t), XD * (6 - 12 * t)];
  };
  const track = (w, r) => {
    const kp = w * w, kv = 2 * w, run = mode => rk4((t, s) => {
      const [p, pd, pdd] = traj(t);
      const Fp = mode === 0 ? -kv * s[1] - kp * (s[0] - p) : mode === 1 ? pdd : pdd - kv * (s[1] - pd) - kp * (s[0] - p);
      return [s[1], r * Fp];                                          // m ẍ = (추정 질량) F′  →  ẍ = (추정/실제) F′
    }, [0, 0], 1.6, 0.002);
    return [0, 1, 2].map(run);
  };
  const maxErr = run => Math.max(...run.map(([t, s]) => Math.abs(s[0] - traj(t)[0])));

  // 그림 14-5 궤적 따라가기 (슬라이더)
  FIG.fig14_5 = el => interactive(el, {
    state: { w: 10, r: 0.8 },
    sliders: [
      { key: 'w', label: '닫힌 루프 ω (kₚ′ = ω²)', min: 2, max: 30, step: 1, unit: ' rad/s' },
      { key: 'r', label: '추정 질량 ÷ 실제 질량', min: 0.5, max: 1.5, step: 0.05, unit: '' },
    ],
    draw: ({ w, r }) => {
      const id = 'f145', g = frame({ id: 'f145c', x: 56, y: 56, w: 404, h: 220, t0: 0, t1: 1.6, v0: 0, v1: 16, yt: [0, 5, 10, 15], xt: [[0, '0'], [0.4, '0.4'], [0.8, '0.8'], [1.2, '1.2'], [1.6, '1.6 s']] });
      const [pd, ff, full] = track(w, r), P = run => thin(run, 2).map(([t, s]) => [t, s[0]]);
      const des = []; for (let i = 0; i <= 80; i++) { const t = 1.6 * i / 80; des.push([t, traj(t)[0]]); }
      return svg(id, [28, 326], [
        g.svg, T(48, 44, 'x (cm)', { a: 'end', c: 'q', s: 12.5 }),
        g.line(des, 's-ink', 2.5, 'stroke-dasharray="7 5"'),
        g.line(P(ff), 's-axis', 2.25),
        g.line(P(pd), 's-c2', 2.5),
        g.line(P(full), 's-c1', 2.5),
        key(56, 316, 'ink', '목표 궤적 x_d(t)'.replace('x_d', 'x<tspan baseline-shift="sub" font-size="10">d</tspan>'), 'stroke-dasharray="7 5"'),
        key(260, 316, 'axis', '앞먹임만: F′ = ẍ<tspan baseline-shift="sub" font-size="10">d</tspan>'),
        key(56, 340, 'c2', 'PD만'),
        key(260, 340, 'c1', '앞먹임 + 오차에 PD'),
      ].join(''), '가속도를 앞먹임하고 오차에 PD를 걸면 궤적에 거의 붙어 간다');
    },
    readout: ({ w, r }) => {
      const runs = track(w, r), e = runs.map(maxErr), fin = runs.map(run => run[run.length - 1][1][0]);
      const row = (c, name, i) => `<div><span class="${c}">● <b>${name}</b>: 가장 큰 오차 <b>${f2(e[i])} cm</b>, 1.6초에 ${f2(fin[i])} cm</span></div>`;
      return row('c2', 'PD만', 0) + row('q', '앞먹임만', 1) + row('c1', '앞먹임 + PD', 2) +
        `<div class="q">k<sub>p</sub>′ = ${w * w}, k<sub>v</sub>′ = ${2 * w} (ζ = 1) · 추정 질량 = ${f2(r)} × 실제 · 목표는 1초 동안 10 cm를 간다</div>`;
    },
  });

  // 세워 든 링크: 10 cm, 100 g (11장)
  const I0 = 0.1 * 0.01 / 3, MGL = 0.1 * 9.8 * 0.05;
  const holdRun = (thd, w, comp) => {
    const kp = I0 * w * w, kv = 2 * I0 * w, q = thd * D;
    return rk4((t, s) => {
      const G = MGL * Math.cos(s[0]), tau = -kp * (s[0] - q) - kv * s[1] + (comp ? G : 0);
      return [s[1], (tau - G) / I0];
    }, [-90 * D, 0], 2, 0.001);
  };

  // 그림 14-6 세워 든 링크를 PD로 들기 (슬라이더)
  FIG.fig14_6 = el => interactive(el, {
    state: { thd: 30, w: 20, comp: 0 },
    sliders: [
      { key: 'thd', label: '목표 각', min: -45, max: 135, step: 5, unit: '°' },
      { key: 'w', label: '닫힌 루프 ω', min: 5, max: 60, step: 1, unit: ' rad/s' },
      { key: 'comp', label: '중력 보상 (0 끔, 1 켬)', min: 0, max: 1, step: 1, unit: '' },
    ],
    draw: ({ thd, w, comp }) => {
      const id = 'f146', ox = 124, oy = 178, R = 104, run = holdRun(thd, w, comp), th = run[run.length - 1][1][0];
      const P = (a, k = R) => [ox + k * Math.cos(a), oy - k * Math.sin(a)], tg = P(thd * D), tip = P(th), sag = thd - th / D;
      const g = frame({ id: 'f146c', x: 300, y: 70, w: 160, h: 200, t0: 0, t1: 2, v0: -90, v1: 150, yt: [-90, 0, 90], xt: [[0, '0'], [1, '1'], [2, '2 s']] });
      const b = [
        L(ox + 14, oy, ox + R + 12, oy, 'axis', 1, dash),
        L(ox, oy - R - 12, ox, oy - 14, 'axis', 1, 'stroke-dasharray="2 4"'),
        L(ox, oy, tg[0], tg[1], 'ink', 2, 'stroke-dasharray="6 4"'), C(tg[0], tg[1], 4, 'f-none s-ink', 1.5),
        link(ox, oy, tip[0], tip[1], 'c1', 13), C(...P(th, R / 2), 4, 'f-ink', 0),
      ];
      if (Math.abs(sag) >= 3) {
        const lo = Math.min(th, thd * D), hi = Math.max(th, thd * D), mid = (lo + hi) / 2, lp = P(mid, R + 18);
        b.push(arc(ox, oy, 58, lo, hi, 'c2', 2));
        if (Math.abs(sag) >= 6) b.push(T(lp[0], lp[1] + 5, `${f1(Math.abs(sag))}°`, { a: Math.cos(mid) > 0.35 ? 'start' : Math.cos(mid) < -0.35 ? 'end' : 'middle', c: 'b', s: 13 }));
      }
      b.push(`<rect x="${ox - 15}" y="${oy - 15}" width="30" height="30" rx="5" class="f-tint s-axis" stroke-width="1.25"/>`, joint(ox, oy, 7));
      b.push(L(20, 322, 44, 322, 'ink', 2, 'stroke-dasharray="6 4"'), T(50, 327, '목표', { s: 12.5 }), L(104, 322, 128, 322, 'c1', 4), T(134, 327, '2초 뒤', { s: 12.5 }));
      b.push(g.svg, T(g.X(0), 58, 'θ (°)', { c: 'q', s: 12.5 }),
        L(g.X(0), g.Y(thd), g.X(2), g.Y(thd), 'ink', 1.25, 'stroke-dasharray="6 4"'),
        g.line(thin(run, 10).map(([t, s]) => [t, s[0] / D]), 's-c1', 2.5));
      return svg(id, [40, 296], b.join(''), '세워 든 링크를 PD로 들면 중력 때문에 목표보다 처지고, 중력을 보상하면 처짐이 사라진다');
    },
    readout: ({ thd, w, comp }) => {
      const kp = I0 * w * w, kv = 2 * I0 * w, run = holdRun(thd, w, comp), th = run[run.length - 1][1][0] / D, G = MGL * Math.cos(thd * D);
      const head = `<div>k<sub>p</sub> = I₀ω² = <b>${kp.toFixed(4)}</b> N·m/rad · k<sub>v</sub> = 2I₀ω = <b>${kv.toFixed(4)}</b> N·m·s/rad <span class="q">(I₀ = 3.33 × 10⁻⁴ kg·m², ζ = 1)</span></div>`;
      const sag = Math.abs(thd - th);
      if (comp) return head + `<div>τ = I₀τ′ + <b>0.049 cos θ</b> (β = 중력 항) → 2초 뒤 θ = <b>${m1(th)}°</b>, 처짐 <b>${f1(sag)}°</b></div>`;
      const est = Math.abs(G / kp / D);
      return head + `<div>중력 보상 없음 → 2초 뒤 θ = <b>${m1(th)}°</b>, 처짐 <b class="c2">${f1(sag)}°</b></div>` +
        (est < 40 && sag < 40 ? `<div class="q">어림: 처짐 ≈ G(θ<sub>d</sub>) / k<sub>p</sub> = ${Math.abs(G).toFixed(3)} / ${kp.toFixed(4)} rad = ${f1(est)}° (처짐이 작을 때 맞는다)</div>`
          : `<div class="q">k<sub>p</sub>가 중력에 비해 너무 작아 링크를 목표까지 들지 못한다. 어림 G / k<sub>p</sub>도 맞지 않는다.</div>`);
    },
  });

  // 그림 14-7 외란과 적분 항 (슬라이더)
  FIG.fig14_7 = el => interactive(el, {
    state: { fd: 2, ki: 300 },
    sliders: [
      { key: 'fd', label: '외란 힘', min: -4, max: 4, step: 0.5, unit: ' N' },
      { key: 'ki', label: '적분 이득 kᵢ′', min: 0, max: 2400, step: 50, unit: '' },
    ],
    draw: ({ fd, ki }) => {
      const id = 'f147', g = frame({ id: 'f147c', x: 56, y: 56, w: 404, h: 220, t0: 0, t1: 4, v0: -2.5, v1: 2.5, yt: [-2, -1, 0, 1, 2], xt: [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4 s']] });
      const run = k => rk4((t, s) => [s[1], -20 * s[1] - 100 * s[0] - k * s[2] + (t >= 0.5 ? 100 * fd / M0 : 0), s[0]], [0, 0, 0], 4, 0.002);
      const P = r => thin(r, 2).map(([t, s]) => [t, s[0]]), ess = fd / (M0 * 100) * 100;
      return svg(id, [28, 334], [
        g.svg, T(48, 44, 'e (cm)', { a: 'end', c: 'q', s: 12.5 }),
        L(g.X(0.5), g.Y(2.5), g.X(0.5), g.Y(-2.5), 'axis', 1.25, 'stroke-dasharray="2 3"'), T(g.X(0.5) + 5, g.Y(2.5) - 6, '외란 시작', { c: 'q', s: 12.5 }),
        Math.abs(ess) < 0.01 ? '' : L(g.X(0), g.Y(ess), g.X(4), g.Y(ess), 'c2', 1.5, 'stroke-dasharray="6 4"'),
        g.line(P(run(0)), 's-axis', 2.25),
        g.line(P(run(ki)), 's-c1', 2.5),
        key(56, 316, 'axis', 'PD만 (k<tspan baseline-shift="sub" font-size="10">i</tspan>′ = 0)'), key(200, 316, 'c1', 'PID (지금 k<tspan baseline-shift="sub" font-size="10">i</tspan>′)'),
        key(56, 340, 'c2', '남는 오차 F_d / k<tspan baseline-shift="sub" font-size="10">p</tspan>'.replace('F_d', 'F<tspan baseline-shift="sub" font-size="10">d</tspan>'), 'stroke-dasharray="6 4"'),
      ].join(''), '일정한 외란이 PD에는 오차를 남기고, 적분 항은 그 오차를 시간이 지나며 지운다');
    },
    readout: ({ fd, ki }) => {
      const run = rk4((t, s) => [s[1], -20 * s[1] - 100 * s[0] - ki * s[2] + (t >= 0.5 ? 100 * fd / M0 : 0), s[0]], [0, 0, 0], 4, 0.002);
      const end = run[run.length - 1][1][0], peak = Math.max(...run.map(([, s]) => Math.abs(s[0])));
      const warn = ki >= 2000 ? `<div class="c2"><b>k<sub>i</sub>′ ≥ k<sub>v</sub>′k<sub>p</sub>′ = 2000</b>: 흔들림이 줄지 않고 점점 커진다(불안정).</div>` : '';
      return `<div>m = 2 kg, k<sub>p</sub>′ = 100, k<sub>v</sub>′ = 20 (k<sub>p</sub> = 200 N/m) · PD만이면 남는 오차 F<sub>d</sub>/k<sub>p</sub> = ${m1(fd)} / 200 m = <b class="c2">${m2(fd / 2)} cm</b></div>` +
        `<div><span class="c1">PID: 4초에 e = <b>${Math.abs(end) > 50 ? '터짐' : m2(end)} cm</b> · 가장 크게 밀린 오차 ${peak > 50 ? '아주 큼' : f2(peak) + ' cm'}</span></div>` + warn;
    },
  });

  // 기어 바퀴: 중심 (cx, cy), 피치 반지름 rp, 이 n개
  const gear = (cx, cy, rp, n, cls, rot = 0) => {
    const pts = [], h = 5;
    for (let i = 0; i < n; i++) {
      const a = rot + 2 * Math.PI * i / n, s = Math.PI / n;
      [[a - s * 0.5, rp - h], [a - s * 0.3, rp + h], [a + s * 0.3, rp + h], [a + s * 0.5, rp - h], [a + s * 1.5, rp - h]].forEach(([b, r]) => pts.push([cx + r * Math.cos(b), cy - r * Math.sin(b)]));
    }
    return `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}Z" class="${cls}" stroke-width="1.5"/>`;
  };

  // 그림 14-8 기어비: 빠르기, 토크, 관성
  FIG.fig14_8 = el => {
    const id = 'f148', sy = 150, sx = 150, r = 24, R = 72, bx = sx + r + R, la = 38 * D, tip = [bx + 128 * Math.cos(la), sy - 128 * Math.sin(la)];
    el.innerHTML += svg(id, [40, 316], [
      `<rect x="18" y="${sy - 30}" width="84" height="60" rx="8" class="f-tint s-axis" stroke-width="1.5"/>`, T(60, sy + 5, '모터', { a: 'middle', c: 'b', s: 14 }),
      L(102, sy, sx, sy, 'axis', 4), T(60, sy + 52, sub('I', 'm') + ' · 회전자', { a: 'middle', c: 'q', s: 12.5 }),
      gear(bx, sy, R, 24, 'f-tint s-axis', Math.PI / 24), gear(sx, sy, r, 8, 'f-tint s-c2', 0),
      link(bx, sy, tip[0], tip[1], 'c1', 14), joint(bx, sy, 8), C(sx, sy, 4, 'f-ink', 0),
      L(sx, sy, sx, sy + r, 'ink', 1.25), T(sx + 5, sy + 18, 'r', { c: 'b', s: 13 }),
      L(bx, sy, bx - R * 0.7, sy + R * 0.7, 'ink', 1.25), T(bx - 34, sy + 30, 'R', { c: 'b', s: 13 }),
      arc(sx, sy, r + 16, 100 * D, 220 * D, 'c2', 2, A(id, 'c2')), T(sx - 46, sy - 34, '빠르게', { a: 'end', c: 'b', s: 12.5 }),
      arc(bx, sy, R + 14, -20 * D, -80 * D, 'c1', 2, A(id, 'c1')),
      T(tip[0] + 6, tip[1] - 8, '링크 ' + sub('I', 'L'), { c: 'b', s: 13 }), T(bx + 62, sy + 76, '느리게', { c: 'b', s: 12.5 }),
      L(16, 250, 464, 250, 'grid', 1),
      T(16, 276, 'η = R / r (그림은 η = 3)', { c: 'b', s: 13.5 }),
      T(16, 300, '빠르기: 모터가 η배 빨리 돈다', { s: 13 }), T(464, 300, sub('θ̇', 'm') + ' = η ' + sub('θ̇', 'L'), { a: 'end', s: 13 }),
      T(16, 322, '토크: 링크에서 η배 커진다', { s: 13 }), T(464, 322, sub('τ', 'L') + ' = η ' + sub('τ', 'm'), { a: 'end', s: 13 }),
      T(16, 344, '관성: 링크에서 본 회전자는 η²배', { s: 13 }), T(464, 344, sub('I', 'eff') + ' = ' + sub('I', 'L') + ' + η²' + sub('I', 'm'), { a: 'end', c: 'b', s: 13 }),
    ].join(''), '작은 기어의 모터가 큰 기어의 링크를 돌린다. 모터는 빨리 돌고 링크 토크는 커지며 회전자 관성은 기어비의 제곱으로 보인다');
  };

  // 그림 14-9 기어비와 유효 관성 (슬라이더)
  const IMOT = 0.5, IL = [3687, 2487 + 1200 * Math.cos(150 * D)];      // g·cm². 종이 팔 어깨의 M₁₁ (12장), θ₂ = 0°, 150°
  FIG.fig14_9 = el => interactive(el, {
    state: { eta: 100 },
    sliders: [{ key: 'eta', label: '기어비 η', min: 1, max: 300, step: 1, unit: '' }],
    draw: ({ eta }) => {
      const id = 'f149', mot = eta * eta * IMOT, tot = IL.map(v => v + mot), W = 350 / tot[0], x0 = 100;
      const row = (y, i, name, t2) => [
        T(x0 - 8, y - 10, name, { a: 'end', s: 12.5 }), T(x0 - 8, y + 8, `θ₂ = ${t2}°`, { a: 'end', c: 'q', s: 12.5 }),
        `<rect x="${x0}" y="${y - 12}" width="${IL[i] * W}" height="24" class="f-c1" fill-opacity="0.55"/>`,
        `<rect x="${x0 + IL[i] * W}" y="${y - 12}" width="${mot * W}" height="24" class="f-c2" fill-opacity="0.55"/>`,
        T(x0 + tot[i] * W, y - 18, sub('I', 'eff') + ' = ' + Math.round(tot[i]) + ' g·cm²', { a: 'end', c: 'b', s: 13 }),
      ].join('');
      const ratio = tot[0] / tot[1], cpl = 920 / tot[0] * 100;
      return svg(id, [56, 254], [
        row(98, 0, '편 팔', 0), row(170, 1, '접은 팔', 150),
        T(16, 232, `가장 무거울 때 ÷ 가장 가벼울 때 = ${f2(ratio)}배`, { c: 'b', s: 14 }),
        T(16, 256, `얽힘 칸 M₁₂ = 920은 그대로 → M₁₂ ÷ ${sub('I', 'eff')} = ${Math.round(cpl)}%`, { s: 13 }),
        sq(16, 290, 'c1', '링크 몫 ' + sub('I', 'L') + ' (자세마다 바뀐다)'), sq(250, 290, 'c2', '모터 몫 η²' + sub('I', 'm') + ' (일정)'),
      ].join(''), '기어비가 커질수록 모터 몫이 커져서 자세에 따른 유효 관성의 차이가 줄어든다');
    },
    readout: ({ eta }) => {
      const mot = eta * eta * IMOT, a = IL[1] + mot, b = IL[0] + mot, mid = Math.sqrt(a * b), q = (b / a) ** 0.25;
      return `<div><b>I<sub>eff</sub></b> = I<sub>L</sub> + η²I<sub>m</sub> = (1448 ~ 3687) + ${eta}² × 0.5 = <b>${Math.round(a)} ~ ${Math.round(b)}</b> g·cm²</div>` +
        `<div>이득을 기하 평균 √(${Math.round(a)} × ${Math.round(b)}) = ${Math.round(mid)}에 맞춰 ω = 20 rad/s, ζ = 1로 고정하면</div>` +
        `<div>ω는 <b>${f1(20 / q)} ~ ${f1(20 * q)}</b> rad/s, 가장 무거울 때 ζ = <b>${f2(1 / q)}</b> <span class="q">(I<sub>m</sub> = 0.5 g·cm²는 예시 값)</span></div>`;
    },
  });
})();
