// 4장 그림: 링크를 숫자 네 개로 적기 (DH 파라미터, 수정 DH = Craig 방식)
(function () {
  const { D, f1, f2, svg, T, L, A, C, joint, link, arc, interactive, sub } = FigKit;
  const FIG = window.FIG;

  // ---- 3차원 그림 도구 ----
  const add = (p, q) => p.map((v, i) => v + q[i]);
  const mul = (k, p) => p.map(v => k * v);
  const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  // 정사영: psi = 옆으로 돈 각, eps = 내려다보는 각, (ox, oy) = 원점이 그려지는 곳, s = 1 cm의 픽셀 수
  const view = (psi, eps, ox, oy, s) => {
    const r = [-Math.sin(psi), Math.cos(psi), 0];
    const u = [-Math.sin(eps) * Math.cos(psi), -Math.sin(eps) * Math.sin(psi), Math.cos(eps)];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    return p => [+(ox + s * dot(p, r)).toFixed(1), +(oy - s * dot(p, u)).toFixed(1)];
  };
  const L3 = (P, p, q, c, w, more) => { const a = P(p), b = P(q); return L(a[0], a[1], b[0], b[1], c, w, more); };
  const T3 = (P, p, dx, dy, txt, o) => { const a = P(p); return T(+(a[0] + dx).toFixed(1), +(a[1] + dy).toFixed(1), txt, o); };
  const path3 = (P, pts, c, w, more = '') =>
    `<path d="${pts.map((p, i) => { const q = P(p); return (i ? 'L' : 'M') + q[0] + ' ' + q[1]; }).join('')}" fill="none" class="s-${c}" stroke-width="${w}" ${more}/>`;
  // 3차원 호: 중심 c0, 평면의 두 단위벡터 u, v, 반지름 r, 각 a0 → a1 (라디안)
  const arc3 = (P, c0, u, v, r, a0, a1, c, w, more) => {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const t = a0 + (a1 - a0) * k / 24; pts.push(add(c0, add(mul(r * Math.cos(t), u), mul(r * Math.sin(t), v)))); }
    return path3(P, pts, c, w, more);
  };
  const dot3 = (P, p, r, cls) => { const a = P(p); return C(a[0], a[1], r, cls, 0); };
  // 직각 표시: 꼭짓점 p에서 단위벡터 u, v 방향으로 k만큼
  const corner = (P, p, u, v, k = 0.3) => path3(P, [add(p, mul(k, u)), add(p, add(mul(k, u), mul(k, v))), add(p, mul(k, v))], 'ink', 1);
  // 평면 그림: z축이 종이에서 나온다 (⊙)
  const zdot = (x, y) => C(x, y, 5, 'f-none s-ink', 1.25) + C(x, y, 1.6, 'f-ink', 0);
  // 2차원 화살표: 수학 방향 각 ang(도), 길이 len
  const arrow2 = (id, x, y, ang, len, c, w = 2) => L(x, y, +(x + len * Math.cos(ang * D)).toFixed(1), +(y - len * Math.sin(ang * D)).toFixed(1), c, w, A(id, c));
  const at2 = (x, y, ang, len) => [x + len * Math.cos(ang * D), y - len * Math.sin(ang * D)];
  // readout용 4×4 행렬 (마지막 열 = 위치는 주황)
  const mat4 = M => `<table class="mat">${M.map((row, i) => `<tr>${row.map((v, j) => `<td class="${j === 3 && i < 3 ? 'c2' : ''}">${i === 3 ? v : f2(v)}</td>`).join('')}</tr>`).join('')}</table>`;
  // 수정 DH 링크 변환 (각은 도)
  const dh = (a, al, d, th) => {
    const ca = Math.cos(al * D), sa = Math.sin(al * D), ct = Math.cos(th * D), st = Math.sin(th * D);
    return [[ct, -st, 0, a], [st * ca, ct * ca, -sa, -sa * d], [st * sa, ct * sa, ca, ca * d], [0, 0, 0, 1]];
  };
  const mm = (X, Y) => X.map((row, i) => Y[0].map((_, j) => row.reduce((s, v, k) => s + v * Y[k][j], 0)));

  // 그림 4-1 좌표계를 아무 데나 붙일 때와 규칙대로 붙일 때
  FIG.fig4_1 = el => {
    const id = 'f41', s = 11;
    const arm = (bx, by) => {
      const E = at2(bx, by, 55, 10 * s), H = at2(E[0], E[1], -15, 8 * s);
      return { E, H, svg: link(bx, by, E[0], E[1], 'axis', 11) + link(E[0], E[1], H[0], H[1], 'axis', 11) + joint(bx, by, 7) + joint(E[0], E[1], 6) + C(H[0], H[1], 4, 'f-ink', 0) +
        `<rect x="${bx - 24}" y="${by + 7}" width="48" height="13" rx="3" class="f-tint s-axis" stroke-width="1.25"/>` };
    };
    const fr = (x, y, ang, c) => arrow2(id, x, y, ang, 32, c, 2.25) + arrow2(id, x, y, ang + 90, 24, c, 1.5);
    const bA = [50, 246], bB = [290, 246], A1 = arm(...bA), B1 = arm(...bB);
    const m1 = at2(bA[0], bA[1], 55, 58), m2 = at2(A1.E[0], A1.E[1], -15, 46);
    const curve = (p, q, lift) => `<path d="M${(p[0]).toFixed(1)} ${(p[1]).toFixed(1)} Q ${((p[0] + q[0]) / 2).toFixed(1)} ${(Math.min(p[1], q[1]) - lift).toFixed(1)} ${(q[0]).toFixed(1)} ${(q[1]).toFixed(1)}" fill="none" class="s-axis" stroke-width="1.25" stroke-dasharray="4 3" ${A(id, 'axis')}/>`;
    el.innerHTML += svg(id, [36, 300], [
      T(16, 58, '(가) 아무 데나 붙이면', { c: 'b' }),
      A1.svg, fr(m1[0], m1[1], 125, 'c2'), fr(m2[0], m2[1], -70, 'c2'),
      curve([m1[0] - 4, m1[1] - 38], [m2[0] + 4, m2[1] - 36], 44), T((m1[0] + m2[0]) / 2, Math.min(m1[1], m2[1]) - 66, '숫자 6개', { a: 'middle', c: 'b', s: 13 }),
      T(16, 294, '링크 가운데에, 아무 방향으로', { s: 12.5 }), T(16, 313, '사이의 숫자 6개가', { c: 'q', s: 12.5 }), T(16, 331, '모두 θ₂와 얽혀 바뀐다', { c: 'q', s: 12.5 }),
      L(240, 44, 240, 334, 'grid', 1),
      T(256, 58, '(나) 규칙대로 붙이면', { c: 'b' }),
      B1.svg, fr(bB[0], bB[1], 55, 'c1'), fr(B1.E[0], B1.E[1], -15, 'c1'), zdot(bB[0], bB[1]), zdot(B1.E[0], B1.E[1]),
      curve([bB[0] - 6, bB[1] - 44], [B1.E[0] - 6, B1.E[1] - 34], 40), T((bB[0] + B1.E[0]) / 2 - 8, Math.min(bB[1] - 44, B1.E[1] - 34) - 30, '숫자 4개', { a: 'middle', c: 'b', s: 13 }),
      T(256, 294, '관절 축에, x는 링크를 따라', { s: 12.5 }), T(256, 313, '숫자 4개 중 3개는 고정,', { c: 'q', s: 12.5 }), T(256, 331, '바뀌는 것은 θ₂ 하나', { c: 'q', s: 12.5 }),
    ].join(''), '좌표계를 규칙대로 붙이면 이웃 좌표계 사이를 숫자 네 개로 적는다');
  };

  // 3차원 그림의 공통 시점: x는 오른쪽(조금 위), y는 왼쪽 위(안쪽), z는 위
  const PSI = -130 * D, EPS = 20 * D;

  // 그림 4-2 두 관절 축 사이: 링크 길이 a와 비틀림 α (슬라이더)
  FIG.fig4_2 = el => interactive(el, {
    state: { a: 3.5, al: 40 },
    sliders: [
      { key: 'a', label: '링크 길이 a', min: 0, max: 5, step: 0.5, unit: ' cm' },
      { key: 'al', label: '비틀림 α', min: -90, max: 90, step: 5, unit: '°' },
    ],
    draw: ({ a, al }) => {
      const id = 'f42', P = view(PSI, EPS, 120, 212, 44), r = al * D;
      const z = [0, 0, 1], x = [1, 0, 0], dir = [0, -Math.sin(r), Math.cos(r)], F = [a, 0, 0];
      const top = add(F, mul(3, dir)), q0 = P(F), q1 = P(top), n = Math.hypot(q1[0] - q0[0], q1[1] - q0[1]);
      const b = [
        L3(P, [0, 0, -1.2], [0, 0, 3.2], 'ink', 2.5), T3(P, [0, 0, 3.2], 0, -10, a === 0 && al === 0 ? '축 i−1 = 축 i' : '축 i−1', { a: 'middle', c: 'b', s: 13 }),
        L3(P, F, add(F, [0, 0, 2.6]), 'axis', 1.25, 'stroke-dasharray="4 4"'),
        L3(P, add(F, mul(-1.2, dir)), top, 'c1', 2.5),
        a === 0 && al === 0 ? '' : T(+(q1[0] + 16 * (q1[0] - q0[0]) / n).toFixed(1), +(q1[1] + 16 * (q1[1] - q0[1]) / n + 5).toFixed(1), '축 i', { a: 'middle', c: 'b', s: 13 }),
      ];
      if (a > 0) {
        b.push(L3(P, [0, 0, 0], F, 'c2', 3.5, 'stroke-linecap="round"'), corner(P, [0, 0, 0], x, z, 0.32), corner(P, F, mul(-1, x), dir, 0.32));
        b.push(T3(P, mul(0.5, F), 2, 22, 'a', { a: 'middle', c: 'b', s: 15 }));
      }
      if (al) {
        b.push(arc3(P, F, z, [0, -1, 0], 1.4, 0, r, 'c2', 2, A(id, 'c2')));
        const m = add(F, add(mul(1.95 * Math.cos(r / 2), z), mul(-1.95 * Math.sin(r / 2), [0, 1, 0])));
        b.push(T3(P, m, al > 0 ? 4 : -4, 6, 'α', { a: al > 0 ? 'start' : 'end', c: 'b', s: 15 }));
      }
      b.push(dot3(P, [0, 0, 0], 4, 'f-ink'), dot3(P, F, 4, 'f-c1'));
      return svg(id, [14, 254], b.join(''), '두 관절 축 사이의 공통 수선 길이 a와 비틀림 α');
    },
    readout: ({ a, al }) => {
      const kind = a === 0 && al === 0 ? '한 직선으로 겹친다' : a === 0 ? '한 점에서 만난다 (a = 0)' : al === 0 ? '나란하다 (α = 0)' : '꼬인 위치 (만나지도, 나란하지도 않다)';
      return `<div><b>a</b> = ${f1(a)} cm <span class="q">두 축 사이의 가장 짧은 거리 (주황 선)</span></div>` +
        `<div><b>α</b> = ${al}° <span class="q">주황 선 방향으로 보고, 축 i−1에서 축 i까지 돈 각</span></div>` +
        `<div>지금 두 축은 <b>${kind}</b></div>`;
    },
  });

  // 그림 4-3 꼬인 위치, 나란한 축, 만나는 축
  FIG.fig4_3 = el => {
    const id = 'f43', x = [1, 0, 0], z = [0, 0, 1], b = [];
    const panel = (k, title, l1, l2) => {
      const x0 = 160 * k, P = view(PSI, EPS, x0 + 42, 186, 27);
      b.push(T(x0 + 80, 58, title, { a: 'middle', c: 'b' }), T(x0 + 80, 262, l1, { a: 'middle', s: 12.5 }), T(x0 + 80, 280, l2, { a: 'middle', c: 'q', s: 12.5 }));
      if (k) b.push(L(x0, 44, x0, 284, 'grid', 1));
      return P;
    };
    // (가) 꼬인 위치
    let P = panel(0, '(가) 꼬인 위치', 'a > 0, α ≠ 0', '수선은 하나뿐');
    let F = [3, 0, 0], dir = [0, Math.sin(50 * D), Math.cos(50 * D)];
    b.push(L3(P, [0, 0, -1.3], [0, 0, 3], 'ink', 2.25), L3(P, add(F, mul(-1.2, dir)), add(F, mul(2.6, dir)), 'c1', 2.25),
      L3(P, F, add(F, [0, 0, 2.2]), 'axis', 1, 'stroke-dasharray="3 3"'),
      L3(P, [0, 0, 0], F, 'c2', 3, 'stroke-linecap="round"'), corner(P, [0, 0, 0], x, z, 0.4),
      arc3(P, F, z, [0, -1, 0], 1.3, 0, -50 * D, 'c2', 1.75, A(id, 'c2')),
      T3(P, mul(0.5, F), 0, 20, 'a', { a: 'middle', c: 'b' }), T3(P, add(F, [0, 0.75, 1.65]), -4, 0, 'α', { a: 'end', c: 'b' }));
    // (나) 나란한 축
    P = panel(1, '(나) 나란하다', 'α = 0, 수선이 여럿', '높이를 하나 고른다');
    F = [3, 0, 0];
    b.push(L3(P, [0, 0, -1.3], [0, 0, 3], 'ink', 2.25), L3(P, add(F, [0, 0, -1.3]), add(F, [0, 0, 3]), 'c1', 2.25));
    [-0.9, 1.1, 2.3].forEach(h => b.push(L3(P, [0, 0, h], add(F, [0, 0, h]), 'c2', 1.25, 'stroke-dasharray="4 3"')));
    b.push(L3(P, [0, 0, 0], F, 'c2', 3, 'stroke-linecap="round"'), corner(P, [0, 0, 0], x, z, 0.4), T3(P, mul(0.5, F), 0, -9, 'a', { a: 'middle', c: 'b' }));
    // (다) 만나는 축
    P = panel(2, '(다) 만난다', 'a = 0, 수선 방향 둘', '하나를 고른다');
    dir = [0, Math.sin(55 * D), Math.cos(55 * D)];
    const O = [1.4, 0, 0];
    b.push(L3(P, add(O, [0, 0, -1.3]), add(O, [0, 0, 3]), 'ink', 2.25), L3(P, add(O, mul(-1.4, dir)), add(O, mul(2.8, dir)), 'c1', 2.25),
      L3(P, O, add(O, [1.9, 0, 0]), 'c2', 2.5, A(id, 'c2')), L3(P, O, add(O, [-1.9, 0, 0]), 'c2', 1.5, 'stroke-dasharray="4 3" ' + A(id, 'c2')),
      T3(P, add(O, [1.9, 0, 0]), 4, -10, '이쪽', { a: 'middle', s: 12.5 }), T3(P, add(O, [-1.9, 0, 0]), -2, 20, '저쪽', { a: 'middle', s: 12.5 }),
      dot3(P, O, 4, 'f-ink'));
    el.innerHTML += svg(id, [36, 256], b.join(''), '두 관절 축은 꼬인 위치이거나, 나란하거나, 만난다');
  };

  // 그림 4-4 관절 축 i에서: 링크 오프셋 d와 관절 각 θ (슬라이더)
  FIG.fig4_4 = el => interactive(el, {
    state: { th: 30, d: 2 },
    sliders: [
      { key: 'th', label: '관절 각 θ', min: -90, max: 120, step: 5, unit: '°' },
      { key: 'd', label: '오프셋 d', min: 0, max: 3, step: 0.5, unit: ' cm' },
    ],
    draw: ({ th, d }) => {
      const id = 'f44', P = view(PSI, 30 * D, 244, 238, 34), t = th * D, c = Math.cos(t), s = Math.sin(t);
      const z = [0, 0, 1], X0 = [-4, 0, 0], dp = [0, -Math.sin(35 * D), Math.cos(35 * D)];
      const H = [0, 0, d], xi = [c, s, 0], E = add(H, mul(3.2, xi));
      const dn = add(mul(Math.cos(30 * D), z), mul(Math.sin(30 * D), cross(xi, z)));
      const b = [
        L3(P, add(X0, mul(-1.3, dp)), add(X0, mul(2.6, dp)), 'axis', 2), T3(P, add(X0, mul(-1.3, dp)), -4, 18, '축 i−1', { a: 'middle', c: 'q', s: 13 }),
        L3(P, [0, 0, -1.2], [0, 0, 4.7], 'ink', 2.5), T3(P, [0, 0, 4.7], 0, -10, '축 i', { a: 'middle', c: 'b', s: 13 }),
        L3(P, add(E, mul(-1.1, dn)), add(E, mul(1.7, dn)), 'axis', 2),
        (() => { const hi = P(add(E, mul(1.7, dn))), lo = P(add(E, mul(-1.1, dn))), h = P(H), far = Math.hypot(hi[0] - h[0], hi[1] - h[1]) >= Math.hypot(lo[0] - h[0], lo[1] - h[1]);
          return far ? T(hi[0], +(hi[1] - 9).toFixed(1), '축 i+1', { a: 'middle', c: 'q', s: 13 }) : T(lo[0], +(lo[1] + 18).toFixed(1), '축 i+1', { a: 'middle', c: 'q', s: 13 }); })(),
        L3(P, X0, [0, 0, 0], 'c1', 2.5, A(id, 'c1')), T3(P, [-2, 0, 0], 0, 24, sub('a', 'i−1'), { a: 'middle', c: 'b', s: 14 }),
        L3(P, H, add(H, [2.3, 0, 0]), 'axis', 1.25, 'stroke-dasharray="4 4"'),
        L3(P, H, E, 'c1', 2.5, A(id, 'c1')), T3(P, E, 10, 16, sub('a', 'i'), { c: 'b', s: 14 }),
        dot3(P, [0, 0, 0], 4, 'f-ink'), dot3(P, H, 4, 'f-c1'),
      ];
      if (d > 0) {
        b.push(L3(P, [0, 0, 0], H, 'c2', 4.5, 'stroke-linecap="round" stroke-opacity="0.8"'));
        b.push(T3(P, [0, 0, d / 2], -12, 5, 'd', { a: 'end', c: 'b', s: 15 }));
      }
      if (th) {
        b.push(arc3(P, H, [1, 0, 0], [0, 1, 0], 1.45, 0, t, 'c2', 2, A(id, 'c2')));
        const q = P(add(H, [2.05 * Math.cos(t / 2), 2.05 * Math.sin(t / 2), 0])), ox = P(H)[0], near = Math.abs(q[0] - ox) < 10;
        b.push(T(+(near ? ox + 10 : q[0]).toFixed(1), +(q[1] + 5).toFixed(1), 'θ', { a: near ? 'start' : 'middle', c: 'b', s: 15 }));
      }
      return svg(id, [24, 308], b.join(''), '관절 축을 따라 잰 오프셋 d와 축을 중심으로 잰 관절 각 θ');
    },
    readout: ({ th, d }) => `<div><b>d</b> = ${f1(d)} cm <span class="q">축 i를 따라 잰, 두 공통 수선 사이 거리</span></div>` +
      `<div><b>θ</b> = ${th}° <span class="q">축 i를 중심으로, a<sub>i−1</sub> 방향에서 a<sub>i</sub> 방향까지 돈 각</span></div>` +
      `<div class="q">회전 관절이면 θ가, 직동 관절이면 d가 움직인다.</div>`,
  });

  // 그림 4-5 좌표계 붙이기 네 단계
  FIG.fig4_5 = el => {
    const id = 'f45', x = [1, 0, 0], z = [0, 0, 1], b = [];
    const steps = [['① 공통 수선', '두 축에 모두 수직인 선'], ['② 원점', '수선이 축 i와 만나는 점'], ['③ z축', '관절 축 i를 따라'], ['④ x축과 y축', 'x는 수선을 따라, y는 오른손']];
    const F = [3.3, 0, 0], dir = [0, Math.sin(50 * D), Math.cos(50 * D)];
    steps.forEach(([t1, t2], k) => {
      const x0 = 240 * (k % 2), y0 = 40 + 196 * Math.floor(k / 2), P = view(PSI, EPS, x0 + 62, y0 + 134, 29);
      b.push(T(x0 + 14, y0 + 20, t1, { c: 'b' }), T(x0 + 14, y0 + 40, t2, { c: 'q', s: 12.5 }));
      b.push(L3(P, [0, 0, -1.1], [0, 0, 2.6], 'ink', 2), T3(P, [0, 0, -1.1], 0, 16, '축 i', { a: 'middle', c: 'q', s: 12.5 }));
      b.push(L3(P, add(F, mul(-1.0, dir)), add(F, mul(2.2, dir)), 'ink', 2), T3(P, add(F, mul(2.2, dir)), 6, 4, '축 i+1', { c: 'q', s: 12.5 }));
      b.push(L3(P, [0, 0, 0], F, k === 0 ? 'c2' : 'axis', k === 0 ? 3.5 : 2, 'stroke-linecap="round"'));
      if (k === 0) b.push(corner(P, [0, 0, 0], x, z, 0.38), corner(P, F, mul(-1, x), dir, 0.38));
      if (k >= 1) b.push(dot3(P, [0, 0, 0], k === 1 ? 5 : 3.5, k === 1 ? 'f-c2' : 'f-ink'));
      if (k === 1) b.push(T3(P, [0, 0, 0], -10, 5, '원점', { a: 'end', c: 'b', s: 13 }));
      if (k >= 2) b.push(L3(P, [0, 0, 0], [0, 0, 1.8], k === 2 ? 'c2' : 'c1', 2.5, A(id, k === 2 ? 'c2' : 'c1')), T3(P, [0, 0, 1.8], 8, 4, sub('z', 'i'), { a: 'start', c: 'b', s: 14 }));
      if (k === 3) {
        b.push(L3(P, [0, 0, 0], [1.9, 0, 0], 'c2', 2.5, A(id, 'c2')), T3(P, [1.9, 0, 0], 2, 18, sub('x', 'i'), { a: 'middle', c: 'b', s: 14 }));
        b.push(L3(P, [0, 0, 0], [0, 1.6, 0], 'c2', 2, A(id, 'c2')), T3(P, [0, 1.6, 0], -6, 2, sub('y', 'i'), { a: 'end', c: 'b', s: 14 }));
      }
    });
    b.push(L(240, 44, 240, 424, 'grid', 1), L(16, 230, 464, 230, 'grid', 1));
    el.innerHTML += svg(id, [36, 392], b.join(''), '좌표계를 붙이는 네 단계: 공통 수선, 원점, z축, x축');
  };

  // 그림 4-6 종이 팔에 좌표계 붙이기 (슬라이더)
  FIG.fig4_6 = el => interactive(el, {
    state: { t1: 30, t2: 45 },
    sliders: [
      { key: 't1', label: '어깨 θ₁', min: 0, max: 180, unit: '°' },
      { key: 't2', label: '팔꿈치 θ₂', min: -135, max: 135, unit: '°' },
    ],
    draw: ({ t1, t2 }) => {
      const id = 'f46', s = 10, bx = 240, by = 252, a = t1, b2 = t1 + t2;
      const E = at2(bx, by, a, 10 * s), H = at2(E[0], E[1], b2, 8 * s);
      const lab = (x, y, ang, len, off, txt, c) => { const p = at2(x, y, ang, len), q = at2(p[0], p[1], ang + 90, off); return T(+q[0].toFixed(1), +(q[1] + 5).toFixed(1), txt, { a: 'middle', c: c || 'b', s: 13 }); };
      const frame = (x, y, ang, c, k, xl, yl, side) => arrow2(id, x, y, ang, xl, c, 2.25) + arrow2(id, x, y, ang + 90, yl, c, 1.5) +
        lab(x, y, ang, xl - 2, 15 * side, sub('x', k)) + lab(x, y, ang + 90, yl + 10, 0, sub('y', k));
      const ext = at2(E[0], E[1], a, 42);
      return svg(id, [22, 352], [
        `<rect x="${bx - 24}" y="${by + 8}" width="48" height="14" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
        link(bx, by, E[0], E[1], 'axis', 12), link(E[0], E[1], H[0], H[1], 'axis', 12),
        L(E[0], E[1], +ext[0].toFixed(1), +ext[1].toFixed(1), 'axis', 1, 'stroke-dasharray="3 3"'),
        arrow2(id, bx, by, 0, 58, 'axis', 1.75), arrow2(id, bx, by, 90, 52, 'axis', 1.25),
        T(bx + 56, by + 22, sub('x', '0'), { a: 'middle', c: 'q', s: 13 }), T(bx - 10, by - 46, sub('y', '0'), { a: 'end', c: 'q', s: 13 }),
        t1 ? arc(bx, by, 22, 0, a * D, 'c2', 1.5) : '', t2 ? arc(E[0], E[1], 22, a * D, b2 * D, 'c2', 1.5) : '',
        frame(bx, by, a, 'c1', '1', 36, 26, 1), frame(E[0], E[1], b2, 'c1', '2', 34, 24, t2 >= 0 ? 1 : -1), frame(H[0], H[1], b2, 'c2', 'H', 32, 24, 1),
        joint(bx, by, 7), joint(E[0], E[1], 6), zdot(bx, by), zdot(E[0], E[1]), zdot(H[0], H[1]),
        t1 ? lab(bx, by, a / 2, t1 > 120 ? 30 : 34, 0, 'θ₁', 'b') : '', t2 ? lab(E[0], E[1], a + t2 / 2, 34, 0, 'θ₂', 'b') : '',
      ].join(''), '종이 팔의 받침, 링크 1, 링크 2, 손에 붙인 좌표계');
    },
    readout: ({ t1, t2 }) => {
      const M = mm(mm(dh(0, 0, 0, t1), dh(10, 0, 0, t2)), dh(8, 0, 0, 0));
      return `<div class="matrow"><b><sup>0</sup>T<sub>H</sub></b> = ${mat4(M)}<span class="q">= <sup>0</sup>T<sub>1</sub> · <sup>1</sup>T<sub>2</sub> · <sup>2</sup>T<sub>H</sub></span></div>` +
        `<div>손끝 (x, y) = <b class="c2">(${f2(M[0][3])}, ${f2(M[1][3])})</b> cm · 손 방향 θ₁ + θ₂ = ${t1 + t2}°</div>`;
    },
  });

  // 그림 4-7 링크 변환 = 기본 변환 네 번 (슬라이더)
  FIG.fig4_7 = el => interactive(el, {
    state: { al: 50, a: 3, th: -40, d: 2 },
    sliders: [
      { key: 'al', label: '① 비틀림 α', min: -45, max: 90, step: 5, unit: '°' },
      { key: 'a', label: '② 길이 a', min: 2.5, max: 4, step: 0.5, unit: ' cm' },
      { key: 'th', label: '③ 관절 각 θ', min: -90, max: 180, step: 5, unit: '°' },
      { key: 'd', label: '④ 오프셋 d', min: 0, max: 2.5, step: 0.5, unit: ' cm' },
    ],
    draw: ({ al, a, th, d }) => {
      const id = 'f47', P = view(PSI, EPS, 112, 262, 46), ra = al * D, rt = th * D;
      const x = [1, 0, 0], y = [0, 1, 0], z = [0, 0, 1];
      const zi = [0, -Math.sin(ra), Math.cos(ra)], yq = [0, Math.cos(ra), Math.sin(ra)];
      const xi = add(mul(Math.cos(rt), x), mul(Math.sin(rt), yq));
      const F = [a, 0, 0], O = add(F, mul(d, zi)), ax = add(F, mul(d + 1.8, zi));
      // 화면에서의 방향 (글자 자리 잡기)
      const sdir = (p, q) => { const A0 = P(p), B0 = P(q), dx = B0[0] - A0[0], dy = B0[1] - A0[1], n = Math.hypot(dx, dy) || 1; return [dx / n, dy / n]; };
      const at = (p, dx, dy, txt, o) => T3(P, p, dx, dy, txt, o);
      const zs = sdir(F, add(F, zi)), xs = sdir(O, add(O, xi)), up = sdir(F, add(F, z));
      let pz = [-zs[1], zs[0]]; if (pz[0] * xs[0] + pz[1] * xs[1] > 0) pz = [-pz[0], -pz[1]];          // z_i 글자: x_i 반대쪽
      let pd = [-zs[1], zs[0]]; if (pd[0] * (up[0] - zs[0]) + pd[1] * (up[1] - zs[1]) > 0) pd = [-pd[0], -pd[1]];   // d 글자: α 호 반대쪽
      const b = [
        L3(P, [0, 0, -0.9], [0, 0, 2.3], 'axis', 1.5), at([0, 0, -0.9], 0, 16, '축 i−1', { a: 'middle', c: 'q', s: 12.5 }),
        L3(P, add(F, mul(-0.9, zi)), ax, 'axis', 1.5), at(ax, 14 * zs[0], 14 * zs[1] + 5, '축 i', { a: 'middle', c: 'q', s: 12.5 }),
        // 기준선: F에서 z_{i-1}과 나란한 선, {i}의 원점에서 x_{i-1}과 나란한 선
        L3(P, F, add(F, mul(1.8, z)), 'axis', 1, 'stroke-dasharray="3 3"'), L3(P, O, add(O, mul(1.6, x)), 'axis', 1, 'stroke-dasharray="3 3"'),
        // ② a, ① α (x축에 관한 둘)
        L3(P, [0.05, 0, 0], F, 'c2', 4, 'stroke-linecap="round" stroke-opacity="0.8"'), at(mul(0.6, F), 4, 22, 'a', { a: 'middle', c: 'b', s: 15 }),
      ];
      if (al) b.push(arc3(P, F, z, [0, -1, 0], 1.0, 0, ra, 'c2', 1.75, A(id, 'c2')),
        at(add(F, add(mul(1.38 * Math.cos(ra / 2), z), mul(-1.38 * Math.sin(ra / 2), y))), 0, 6, 'α', { a: 'middle', c: 'b', s: 15 }));
      // ④ d, ③ θ (z축에 관한 둘)
      if (d > 0) b.push(L3(P, F, O, 'c2', 4, 'stroke-linecap="round" stroke-opacity="0.8"'), at(add(F, mul(d / 2, zi)), 13 * pd[0], 13 * pd[1] + 5, 'd', { a: 'middle', c: 'b', s: 15 }));
      if (th) b.push(arc3(P, O, x, yq, 0.95, 0, rt, 'c2', 1.75, A(id, 'c2')),
        at(add(O, add(mul(1.36 * Math.cos(rt / 2), x), mul(1.36 * Math.sin(rt / 2), yq))), 0, 6, 'θ', { a: 'middle', c: 'b', s: 15 }));
      // {i-1}과 {i}: x, z만 그린다 (y는 오른손 법칙으로 정해진다)
      const zt = P(add(O, mul(1.3, zi)));
      b.push(L3(P, [0, 0, 0], [0.85, 0, 0], 'ink', 2.25, A(id, 'ink')), L3(P, [0, 0, 0], [0, 0, 1.3], 'ink', 2.25, A(id, 'ink')),
        at([0, 0, 1.3], -7, 2, sub('z', 'i−1'), { a: 'end', s: 13 }), at([0.85, 0, 0], -10, 19, sub('x', 'i−1'), { a: 'middle', s: 13 }),
        L3(P, O, add(O, mul(1.3, xi)), 'c1', 2.5, A(id, 'c1')), L3(P, O, add(O, mul(1.3, zi)), 'c1', 2.5, A(id, 'c1')),
        T3(P, add(O, mul(1.3, xi)), 11 * xs[0], 11 * xs[1] + 5, sub('x', 'i'), { a: 'middle', c: 'b', s: 13 }),
        T(+(zt[0] + 12 * pz[0]).toFixed(1), +(zt[1] + 12 * pz[1] + 5).toFixed(1), sub('z', 'i'), { a: 'middle', c: 'b', s: 13 }),
        dot3(P, [0, 0, 0], 3.5, 'f-ink'), dot3(P, O, 4, 'f-c1'));
      return svg(id, [8, 344], b.join(''), '좌표계 i−1에서 좌표계 i로: x축으로 비틀고 밀고, z축으로 돌리고 민다');
    },
    readout: ({ al, a, th, d }) => {
      const M = dh(a, al, d, th);
      return `<div class="matrow"><b><sup>i−1</sup>T<sub>i</sub></b> = ${mat4(M)}<span class="q">왼쪽 세 열 = x<sub>i</sub>, y<sub>i</sub>, z<sub>i</sub> 방향<br>마지막 열 = {i}의 원점</span></div>` +
        `<div>{i−1}에서 본 {i}의 원점 = <b class="c2">(${f2(M[0][3])}, ${f2(M[1][3])}, ${f2(M[2][3])})</b> cm</div>`;
    },
  });

  // 그림 4-8 강의 예제: 관절 3개 평면 팔의 좌표계
  FIG.fig4_8 = el => {
    const id = 'f48', s = 18, bx = 56, by = 304, t = [30, 40, -50], g = [t[0], t[0] + t[1], t[0] + t[1] + t[2]];
    const J2 = at2(bx, by, g[0], 8 * s), J3 = at2(J2[0], J2[1], g[1], 7 * s), Tp = at2(J3[0], J3[1], g[2], 5 * s);
    const lab = (x, y, ang, len, off, txt, o) => { const p = at2(x, y, ang, len), q = at2(p[0], p[1], ang + 90, off); return T(+q[0].toFixed(1), +(q[1] + 5).toFixed(1), txt, Object.assign({ a: 'middle' }, o)); };
    const fx = (x, y, ang, c, k, side) => arrow2(id, x, y, ang, 34, c, 2.25) + arrow2(id, x, y, ang + 90, 22, c, 1.25) + lab(x, y, ang, 30, 14 * side, sub('x', k), { c: 'b', s: 13 });
    const e2 = at2(J2[0], J2[1], g[0], 40), e3 = at2(J3[0], J3[1], g[1], 40);
    el.innerHTML += svg(id, [36, 300], [
      `<rect x="${bx - 24}" y="${by + 8}" width="48" height="14" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(bx, by, 230, by, 'axis', 1, 'stroke-dasharray="4 4"'), T(236, by + 5, sub('x', '0'), { c: 'q', s: 13 }),
      link(bx, by, J2[0], J2[1], 'axis', 11), link(J2[0], J2[1], J3[0], J3[1], 'axis', 11), link(J3[0], J3[1], Tp[0], Tp[1], 'axis', 11),
      L(J2[0], J2[1], +e2[0].toFixed(1), +e2[1].toFixed(1), 'axis', 1, 'stroke-dasharray="3 3"'), L(J3[0], J3[1], +e3[0].toFixed(1), +e3[1].toFixed(1), 'axis', 1, 'stroke-dasharray="3 3"'),
      arc(bx, by, 26, 0, g[0] * D, 'c2', 1.5), arc(J2[0], J2[1], 24, g[0] * D, g[1] * D, 'c2', 1.5), arc(J3[0], J3[1], 24, g[1] * D, g[2] * D, 'c2', 1.5),
      fx(bx, by, g[0], 'c1', '1', 1), fx(J2[0], J2[1], g[1], 'c1', '2', 1), fx(J3[0], J3[1], g[2], 'c1', '3', -1), fx(Tp[0], Tp[1], g[2], 'c2', '4', 1),
      joint(bx, by, 7), joint(J2[0], J2[1], 6), joint(J3[0], J3[1], 6), zdot(bx, by), zdot(J2[0], J2[1]), zdot(J3[0], J3[1]), zdot(Tp[0], Tp[1]),
      lab(bx, by, g[0] / 2, 44, 0, 'θ₁', { c: 'b', s: 13 }), lab(J2[0], J2[1], (g[0] + g[1]) / 2, 38, 0, 'θ₂', { c: 'b', s: 13 }), lab(J3[0], J3[1], (g[1] + g[2]) / 2, 38, 0, 'θ₃', { c: 'b', s: 13 }),
      lab(bx, by, g[0], 8 * s * 0.62, -17, 'a₁ = 8', { s: 12.5 }), lab(J2[0], J2[1], g[1], 7 * s * 0.58, -14, 'a₂ = 7', { a: 'start', s: 12.5 }),
      lab(J3[0], J3[1], g[2], 5 * s * 0.62, -16, '5 (손까지)', { a: 'start', s: 12.5 }),
      T(300, 280, '⊙ = z축 (종이에서 나온다)', { c: 'q', s: 12.5 }), T(300, 300, '{0}은 받침에 고정,', { c: 'q', s: 12.5 }), T(300, 318, 'θ₁ = 0이면 {1}과 겹친다', { c: 'q', s: 12.5 }),
    ].join(''), '관절 3개 평면 팔에 붙인 좌표계 0부터 4까지');
  };
})();
