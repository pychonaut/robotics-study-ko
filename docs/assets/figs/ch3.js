// 3장 그림: 변환 잇기, 변환 고리, 방향 표현(오일러 각, 고정 각, 짐벌 잠금, 오일러 파라미터)
(function () {
  const { D, f2, svg, T, L, A, C, joint, link, arc, interactive, sub } = FigKit;
  const FIG = window.FIG;

  // 숫자: 정수에 가까우면 정수로, 아니면 소수 둘째 자리
  const fm = v => { const r = Math.round(v); return Math.abs(v - r) < 0.005 ? String(r === 0 ? 0 : r) : v.toFixed(2); };
  // readout 안의 행렬 표 (행 수·열 수 자유). cls는 열마다 색 이름
  const mat = (M, cls = [], nr = 9) => `<table class="mat">${M.map((r, i) => `<tr>${r.map((v, j) => `<td class="${i < nr ? cls[j] || '' : ''}">${fm(v)}</td>`).join('')}</tr>`).join('')}</table>`;
  // SVG 글자 속 왼쪽 위 첨자 + 오른쪽 아래 첨자 (예: ᵂT₀)
  const pre = (sp, v, sb) => `<tspan baseline-shift="super" font-size="10">${sp}</tspan>${v}<tspan baseline-shift="sub" font-size="10">${sb}</tspan>`;
  const norm = v => { const r = ((v % 360) + 540) % 360 - 180; return r === -180 ? 180 : r; };

  // 3×3 회전 도구 (라디안)
  const Rx = a => { const c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
  const Ry = a => { const c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
  const Rz = a => { const c = Math.cos(a), s = Math.sin(a); return [[c, -s, 0], [s, c, 0], [0, 0, 1]]; };
  const mul = (P, Q) => P.map(r => [0, 1, 2].map(j => r[0] * Q[0][j] + r[1] * Q[1][j] + r[2] * Q[2][j]));
  const mv = (M, v) => M.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const colv = (M, j) => [M[0][j], M[1][j], M[2][j]];
  const sc = (v, k) => v.map(u => u * k);
  const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  const zyx = (a, b, g) => mul(mul(Rz(a * D), Ry(b * D)), Rx(g * D));   // 도 단위
  const axang = (k, t) => {
    const c = Math.cos(t), s = Math.sin(t), v = 1 - c, [x, y, z] = k;
    return [[x * x * v + c, x * y * v - z * s, x * z * v + y * s], [x * y * v + z * s, y * y * v + c, y * z * v - x * s], [x * z * v - y * s, y * z * v + x * s, z * z * v + c]];
  };

  // 등각 투영: x는 왼쪽 아래, y는 오른쪽 아래, z는 위 (2장 그림 2-7과 같은 방향)
  const iso = (cx, cy, s) => p => [cx + (p[1] - p[0]) * 0.866 * s, cy + (p[0] + p[1]) * 0.5 * s - p[2] * s];
  const depth = v => v[0] + v[1] + v[2];   // 클수록 보는 사람 쪽
  const pts = arr => arr.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');

  // 3차원 화살표 하나와 끝의 이름
  function ax3(id, P, v, cls, w, name, o = {}) {
    const a = P([0, 0, 0]), b = P(v), dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy), g = o.gap || 13;
    const lx = n > 10 ? b[0] + dx / n * g : b[0] + 12, ly = n > 10 ? b[1] + dy / n * g + 5 : b[1] - 6;
    return L(a[0], a[1], b[0], b[1], cls, w, (o.more || '') + ' ' + A(o.mk || id, cls)) +
      (name ? T(lx.toFixed(1), ly.toFixed(1), name, { a: 'middle', c: o.lc || 'b', s: o.s || 13 }) : '');
  }
  // 글자 자리 고르기: 후보 가운데 다른 글자·선과 겹치지 않는 첫 자리 (없으면 가장 덜 겹치는 자리)
  function placer(lines) {
    const used = [], dots = [];
    lines.forEach(([x1, y1, x2, y2]) => { const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 8)); for (let i = 0; i <= n; i++) dots.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]); });
    const room = c => Math.min(...used.map(u => Math.hypot(u[0] - c[0], u[1] - c[1]) - 19), ...dots.map(u => Math.hypot(u[0] - c[0], u[1] - c[1]) - 11), 99);
    const put = (cands, w = 0) => { let best = cands[0], br = -1e9; for (const c of cands) { const r = room(c) - w; if (r >= 0) { best = c; break; } if (r > br) { br = r; best = c; } } used.push(best); return best; };
    put.mark = c => used.push(c);
    return put;
  }

  // 몸에 붙은 좌표계: x 파랑, y 주황, z 검정. 먼 축부터 그리고, 이름은 다른 선·글자를 피해 놓는다.
  // o.lines: 피할 선 [[x1, y1, x2, y2], ...], o.marks: 피할 글자 자리 [[x, y], ...]
  function body(id, P, R, names, o = {}) {
    const cls = ['c1', 'c2', 'ink'], lc = ['f-c1 b', 'f-c2 b', 'b'], k = o.k || 1, O = P([0, 0, 0]), g = o.gap || 13;
    const tips = [0, 1, 2].map(j => P(sc(colv(R, j), k)));
    const put = placer(tips.map(t => [O[0], O[1], t[0], t[1]]).concat(o.lines || []));
    (o.marks || []).forEach(put.mark);
    const lines = [0, 1, 2].sort((i, j) => depth(colv(R, i)) - depth(colv(R, j)))
      .map(j => L(O[0], O[1], tips[j][0].toFixed(1), tips[j][1].toFixed(1), cls[j], o.w || 2.25, A(id, cls[j]))).join('');
    if (!names) return lines;
    const labs = [0, 1, 2].sort((i, j) => Math.hypot(tips[i][0] - O[0], tips[i][1] - O[1]) - Math.hypot(tips[j][0] - O[0], tips[j][1] - O[1])).map(j => {
      const t = tips[j], dx = t[0] - O[0], dy = t[1] - O[1], n = Math.hypot(dx, dy), ux = n > 6 ? dx / n : 0.7, uy = n > 6 ? dy / n : -0.7;
      const q = put([[t[0] + ux * g, t[1] + uy * g], [t[0] + ux * g - uy * 14, t[1] + uy * g + ux * 14], [t[0] + ux * g + uy * 14, t[1] + uy * g - ux * 14], [t[0] + ux * (g + 12), t[1] + uy * (g + 12)]]);
      return T(q[0].toFixed(1), (q[1] + 5).toFixed(1), names[j], { a: 'middle', c: lc[j], s: o.s || 13 });
    });
    return lines + labs.join('');
  }
  // 기준 좌표계의 이름 자리 (body가 피하도록 넘겨 준다)
  const refMarks = (P, k, g = 13) => [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(v => { const O = P([0, 0, 0]), t = P(sc(v, k)), dx = t[0] - O[0], dy = t[1] - O[1], n = Math.hypot(dx, dy); return [t[0] + dx / n * g, t[1] + dy / n * g]; });
  const refLines = (P, k) => [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map(v => { const O = P([0, 0, 0]), t = P(sc(v, k)); return [O[0], O[1], t[0], t[1]]; });
  // 기준 좌표계 (회색)
  function ref(id, P, k, names, o = {}) {
    return [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((v, j) => ax3(id, P, sc(v, k), 'axis', o.w || 1.25, names ? names[j] : '', { lc: 'q', s: o.s || 12.5, more: o.more })).join('');
  }
  // {B}에 붙은 판 (x·y 면)
  const plate = (P, R, w = 0.5, h = 0.32) => {
    const q = [[-w, -h], [w, -h], [w, h], [-w, h]].map(([u, v]) => P(mv(R, [u, v, 0])));
    return `<polygon points="${q.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')}" class="f-c1 s-c1" fill-opacity="0.1" stroke-opacity="0.45" stroke-width="1.25"/>`;
  };
  // 축 n을 중심으로 u에서 ang만큼 도는 호 (반지름 r)
  const arc3 = (P, n, u, ang, r, cls, w, more = '') => {
    const q = [];
    for (let i = 0; i <= 30; i++) q.push(P(sc(mv(axang(n, ang * i / 30), u), r)));
    return `<path d="M${pts(q)}" fill="none" class="s-${cls}" stroke-width="${w}" ${more}/>`;
  };
  // 축 하나를 길게 그린 반투명 띠
  const band = (P, v, cls, k = 1.35) => {
    const a = P(sc(v, -k)), b = P(sc(v, k));
    return L(a[0], a[1], b[0], b[1], cls, 8, 'stroke-linecap="round" stroke-opacity="0.28"') + L(a[0], a[1], b[0], b[1], cls, 1, 'stroke-dasharray="5 4"');
  };

  // 그림 3-1 종이 팔의 좌표계 {0}, {1}, {2} (슬라이더)
  FIG.fig3_1 = el => interactive(el, {
    state: { t1: 30, t2: 60 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: 0, max: 180, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -150, max: 150, unit: '°' }],
    draw: ({ t1, t2 }) => {
      const id = 'f31', bx = 240, by = 250, l1 = 110, l2 = 88, ln = 48, a = t1 * D, b = (t1 + t2) * D;
      const ex = bx + l1 * Math.cos(a), ey = by - l1 * Math.sin(a), hx = ex + l2 * Math.cos(b), hy = ey - l2 * Math.sin(b);
      const U = g => [[Math.cos(g), -Math.sin(g)], [-Math.sin(g), -Math.cos(g)]];   // 화면에서 x축, y축 방향
      const [u1, v1] = U(a), [u2, v2] = U(b);
      const tip = (o, u, k) => [o[0] + k * u[0], o[1] + k * u[1]];
      const S = [bx, by], E = [ex, ey], X1 = tip(S, u1, ln), Y1 = tip(S, v1, ln), X2 = tip(E, u2, ln), Y2 = tip(E, v2, ln);
      const put = placer([[bx, by, ex, ey], [ex, ey, hx, hy], [bx, by, bx + 70, by], [bx, by, bx, by - 70], [bx, by, ...X1], [bx, by, ...Y1], [ex, ey, ...X2], [ex, ey, ...Y2]]);
      [[bx + 74, by + 16], [bx + 16, by - 66], [hx, hy]].forEach(put.mark);
      const pol = (o, r, g) => [o[0] + r * Math.cos(g), o[1] - r * Math.sin(g)];
      const th1 = t1 > 12 ? put([pol(S, 46, a / 2), pol(S, 46, a / 2 - 0.25), pol(S, 46, a / 2 + 0.25), pol(S, 60, a / 2)]) : null;
      const th2 = Math.abs(t2) > 12 ? put([pol(E, 42, (a + b) / 2), pol(E, 42, (a + b) / 2 - Math.sign(t2) * 0.3), pol(E, 56, (a + b) / 2)]) : null;
      const lab = (c, k, cls) => T(c[0].toFixed(1), (c[1] + 5).toFixed(1), k, { a: 'middle', c: cls, s: 13 });
      const xc = (X, u, v) => [tip(tip(X, u, 10), v, 14), tip(tip(X, u, 10), v, -14), tip(tip(X, u, 26), v, 14), tip(tip(X, u, 26), v, -14), tip(X, u, 16)];
      const yc = (Y, u, v) => [tip(Y, v, 14), tip(tip(Y, v, 8), u, -15), tip(tip(Y, v, 8), u, 15), tip(Y, v, 28)];
      return svg(id, [34, 340], [
        L(bx, by, bx + 70, by, 'axis', 1.5, A(id, 'axis')), L(bx, by, bx, by - 70, 'axis', 1.5, A(id, 'axis')),
        lab([bx + 74, by + 16], sub('x', '0'), 'q'), lab([bx + 16, by - 66], sub('y', '0'), 'q'),
        link(bx, by, ex, ey, 'axis', 10), link(ex, ey, hx, hy, 'axis', 10),
        L(ex, ey, ex + 50 * Math.cos(a), ey - 50 * Math.sin(a), 'axis', 1, 'stroke-dasharray="4 4"'),
        arc(bx, by, 30, 0, a, 'ink', 1.25), arc(ex, ey, 28, a, b, 'ink', 1.25),
        th1 ? lab(th1, 'θ₁', 'b') : '', th2 ? lab(th2, 'θ₂', 'b') : '',
        L(bx, by, ...X1, 'c1', 2.25, A(id, 'c1')), L(bx, by, ...Y1, 'c1', 2.25, A(id, 'c1')),
        L(ex, ey, ...X2, 'c2', 2.25, A(id, 'c2')), L(ex, ey, ...Y2, 'c2', 2.25, A(id, 'c2')),
        lab(put(xc(X1, u1, v1)), sub('x', '1'), 'f-c1 b'), lab(put(yc(Y1, u1, v1)), sub('y', '1'), 'f-c1 b'),
        lab(put(xc(X2, u2, v2)), sub('x', '2'), 'f-c2 b'), lab(put(yc(Y2, u2, v2)), sub('y', '2'), 'f-c2 b'),
        joint(bx, by), joint(ex, ey, 7), C(hx, hy, 6, 'f-ink', 0),
        T(bx - 14, by + 26, '어깨', { a: 'end', c: 'q', s: 12.5 }),
        lab(put([pol([hx, hy], 22, b), pol([hx, hy], 20, b + 1.57), pol([hx, hy], 20, b - 1.57), pol([hx, hy], 24, b + 0.8), pol([hx, hy], 24, b - 0.8)], 8), '손끝', 'b'),
      ].join(''), '받침, 링크 1, 링크 2에 붙은 좌표계 세 개');
    },
    readout: ({ t1, t2 }) => {
      const c1 = Math.cos(t1 * D), s1 = Math.sin(t1 * D), c2 = Math.cos(t2 * D), s2 = Math.sin(t2 * D), c12 = Math.cos((t1 + t2) * D), s12 = Math.sin((t1 + t2) * D);
      const k = ['', '', 'c2'];
      return `<div class="matrow"><span><b><sup>0</sup>T<sub>1</sub></b> =</span>${mat([[c1, -s1, 0], [s1, c1, 0], [0, 0, 1]], k, 2)}<span><b><sup>1</sup>T<sub>2</sub></b> =</span>${mat([[c2, -s2, 10], [s2, c2, 0], [0, 0, 1]], k, 2)}</div>` +
        `<div class="matrow"><span><b><sup>0</sup>T<sub>2</sub></b> = <sup>0</sup>T<sub>1</sub> <sup>1</sup>T<sub>2</sub> =</span>${mat([[c12, -s12, 10 * c1], [s12, c12, 10 * s1], [0, 0, 1]], k, 2)}<span class="q">회전 θ₁ + θ₂ = ${t1 + t2}°<br>주황 = 팔꿈치 위치</span></div>` +
        `<div><b>손끝</b> = <sup>0</sup>T<sub>2</sub> × (8, 0, 1) = <b>(${f2(10 * c1 + 8 * c12)}, ${f2(10 * s1 + 8 * s12)})</b> cm</div>`;
    },
  });

  // 그림 3-2 변환 고리: 책상, 받침, 카메라, 컵
  FIG.fig3_2 = el => {
    const id = 'f32', u = 8, ox = 64, oy = 416, W = (x, y) => [ox + u * x, oy - u * y];
    const O0 = W(30, 10), OC = W(10, 40), OG = W(22, 24);
    // 좌표계: 수학 방향 deg만큼 돈 x, y축. lx, ly는 이름 자리 (원점에서 잰 화면 좌표)
    const fr = (o, deg, k, lx, ly, len = 30) => {
      const c = Math.cos(deg * D), s = Math.sin(deg * D), X = [o[0] + len * c, o[1] - len * s], Y = [o[0] - len * s, o[1] - len * c];
      return L(o[0], o[1], X[0], X[1], 'ink', 1.5, A(id, 'ink')) + L(o[0], o[1], Y[0], Y[1], 'ink', 1.5, A(id, 'ink')) +
        T(o[0] + lx[0], o[1] + lx[1] + 5, sub('x', k), { a: 'middle', s: 12.5 }) + T(o[0] + ly[0], o[1] + ly[1] + 5, sub('y', k), { a: 'middle', s: 12.5 });
    };
    // 원점에서 원점으로 가는 변환 화살표 (양끝을 조금 줄인다)
    const tr = (p, q, cls, more = '', c0 = 16, c1 = 16) => {
      const dx = q[0] - p[0], dy = q[1] - p[1], n = Math.hypot(dx, dy);
      return L(p[0] + dx / n * c0, p[1] + dy / n * c0, q[0] - dx / n * c1, q[1] - dy / n * c1, cls, 2.5, more + ' ' + A(id, cls));
    };
    el.innerHTML += svg(id, [40, 420], [
      `<rect x="24" y="52" width="440" height="404" rx="10" class="f-tint s-grid" stroke-width="1.25"/>`,
      `<rect x="${O0[0] - 15}" y="${O0[1] - 15}" width="30" height="30" rx="5" class="f-none s-axis" stroke-width="1.5"/>`,
      `<rect x="${OC[0] - 13}" y="${OC[1] - 10}" width="26" height="20" rx="4" class="f-c1 s-c1" fill-opacity="0.25" stroke-width="1.5"/>`,
      C(OG[0], OG[1], 12, 'f-none s-ink', 1.5),
      tr(W(0, 0), O0, 'ink', '', 10, 24), tr(W(0, 0), OC, 'ink', '', 10, 20), tr(OC, OG, 'c1', '', 16, 18), tr(O0, OG, 'c2', 'stroke-dasharray="7 5"', 18, 18),
      fr(W(0, 0), 0, 'W', [43, 2], [-12, -32]), fr(O0, 90, '0', [12, -36], [-30, -13]), fr(OC, -90, 'C', [13, 30], [43, 0]), fr(OG, -90, 'G', [-12, 32], [43, 0]),
      T(ox - 6, oy + 26, '책상 모서리 {W}', { c: 'b', s: 13 }),
      T(O0[0] + 24, O0[1] + 6, '받침 {0}', { c: 'b', s: 13 }), T(O0[0] + 24, O0[1] + 24, 'W에서 (30, 10), 90°', { c: 'q', s: 12.5 }),
      T(OC[0] + 18, OC[1] - 20, '카메라 {C}', { c: 'b', s: 13 }), T(OC[0] + 94, OC[1] - 20, 'W에서 (10, 40), −90°', { c: 'q', s: 12.5 }),
      T(OG[0] + 20, OG[1] - 18, '컵 {G}', { c: 'b', s: 13 }),
      T(196, 404, pre('W', 'T', '0'), { a: 'middle', c: 'b', s: 15 }),
      T(92, 262, pre('W', 'T', 'C'), { a: 'end', c: 'b', s: 15 }),
      T(204, 146, pre('C', 'T', 'G'), { c: 'b', s: 15 }), T(210, 166, '카메라가 봄', { c: 'q', s: 12.5 }),
      T(256, 300, pre('0', 'T', 'G') + ' = ?', { a: 'end', c: 'b', s: 15 }), T(256, 318, '구할 것', { a: 'end', c: 'q', s: 12.5 }),
    ].join(''), '책상, 받침, 카메라, 컵의 좌표계가 고리를 이룬다');
  };

  // 그림 3-3 회전행렬의 숫자를 섞으면 (슬라이더)
  FIG.fig3_3 = el => interactive(el, {
    state: { p: 120, s: 0.5 },
    sliders: [{ key: 'p', label: '끝 방향', min: 30, max: 180, step: 5, unit: '°' }, { key: 's', label: '섞는 비율 s', min: 0, max: 1, step: 0.05, unit: '' }],
    draw: ({ p, s }) => {
      const id = 'f33', ox = 240, oy = 224, r = 160, cp = Math.cos(p * D), sp = Math.sin(p * D), Pt = (x, y) => [ox + r * x, oy - r * y];
      const S0 = Pt(1, 0), S1 = Pt(cp, sp), Mx = Pt(1 - s + s * cp, s * sp), Ax = Pt(Math.cos(s * p * D), Math.sin(s * p * D));
      return svg(id, [44, 214], [
        arc(ox, oy, r, 0, Math.PI, 'grid', 1.25, 'stroke-dasharray="3 4"'), L(ox - r - 16, oy, ox + r + 16, oy, 'grid', 1),
        arc(ox, oy, r, 0, p * D, 'c1', 1.5, 'stroke-opacity="0.45"'),
        L(S0[0], S0[1], S1[0], S1[1], 'c2', 1.25, 'stroke-dasharray="5 4" stroke-opacity="0.7"'),
        L(ox, oy, S0[0], S0[1], 'axis', 1.5, A(id, 'axis')), L(ox, oy, S1[0], S1[1], 'axis', 1.5, A(id, 'axis')),
        L(ox, oy, Ax[0], Ax[1], 'c1', 3, A(id, 'c1')), Math.hypot(Mx[0] - ox, Mx[1] - oy) > 4 ? L(ox, oy, Mx[0], Mx[1], 'c2', 3, A(id, 'c2')) : '',
        C(ox, oy, 4.5, 'f-ink', 0),
        T(S0[0], S0[1] + 22, '처음 0°', { a: 'middle', c: 'q', s: 12.5 }),
        T(S1[0] + 14 * cp, S1[1] - 14 * sp + (sp < 0.3 ? 22 : 4), '끝 ' + p + '°', { a: cp < -0.3 ? 'end' : cp > 0.3 ? 'start' : 'middle', c: 'q', s: 12.5 }),
        T(ox, oy + 22, '원점', { a: 'middle', c: 'q', s: 12.5 }),
      ].join(''), '회전행렬의 숫자를 섞으면 축이 짧아지고, 각도를 섞으면 길이가 그대로다');
    },
    readout: ({ p, s }) => {
      const cp = Math.cos(p * D), sp = Math.sin(p * D), a = 1 - s + s * cp, b = s * sp;
      return `<div class="matrow"><b>숫자를 섞은 행렬</b> (1 − s) R(0°) + s R(${p}°) = ${mat([[a, -b], [b, a]])}</div>` +
        `<div><span class="dot c2">●</span> 숫자를 섞은 x축의 길이: <b>${f2(Math.hypot(a, b))}</b> <span class="q">(회전행렬이면 1)</span></div>` +
        `<div><span class="dot c1">●</span> 각도를 섞은 x축: ${fm(s * p)}° 방향, 길이 <b>1.00</b></div>`;
    },
  });

  // 그림 3-4 Z-Y-X 오일러 각의 세 단계
  FIG.fig3_4 = el => {
    const id = 'f34', al = 150, be = 50, ga = 60, s = 50, cx = [82, 242, 402], cy = 172;
    const R1 = Rz(al * D), R2 = mul(R1, Ry(be * D)), R3 = mul(R2, Rx(ga * D));
    const steps = [
      { prev: I3, R: R1, ax: [0, 0, 1], u: [1, 0, 0], ang: al, nm: 'α', names: ['x′', 'y′', 'z′'], title: '① z축으로 α', foot: '{A} → {B′}' },
      { prev: R1, R: R2, ax: colv(R1, 1), u: colv(R1, 0), ang: be, nm: 'β', names: ['x″', 'y″', 'z″'], title: '② 새 y축으로 β', foot: '{B′} → {B″}' },
      { prev: R2, R: R3, ax: colv(R2, 0), u: colv(R2, 1), ang: ga, nm: 'γ', names: [sub('x', 'B'), sub('y', 'B'), sub('z', 'B')], title: '③ 새 x축으로 γ', foot: '{B″} → {B}' },
    ];
    const b = steps.map((st, i) => {
      const P = iso(cx[i], cy, s), mid = P(sc(mv(axang(st.ax, st.ang * D / 2), st.u), 0.78));
      return T(cx[i], 58, st.title, { a: 'middle', c: 'b', s: 14 }) +
        band(P, st.ax, 'axis', 1.2) +
        [0, 1, 2].map(j => ax3(id, P, colv(st.prev, j), 'axis', 1.25, '', { more: 'stroke-dasharray="3 3"' })).join('') +
        arc3(P, st.ax, st.u, st.ang * D, 0.6, 'ink', 1.75) +
        body(id, P, st.R, st.names, { s: 13 }) +
        T(mid[0].toFixed(1), (mid[1] + 5).toFixed(1), st.nm, { a: 'middle', c: 'b', s: 14 }) +
        T(cx[i], 276, st.foot, { a: 'middle', c: 'q', s: 12.5 });
    });
    b.push(L(162, 64, 162, 270, 'grid', 1), L(322, 64, 322, 270, 'grid', 1));
    el.innerHTML += svg(id, [36, 252], b.join(''), 'Z-Y-X 오일러 각: 매번 방금 돌아간 새 축으로 돈다');
  };

  // 그림 3-5 Z-Y-X 오일러 각 (슬라이더)
  FIG.fig3_5 = el => interactive(el, {
    state: { a: 40, b: 30, g: 20 },
    sliders: [{ key: 'a', label: 'α (z축)', min: -180, max: 180, unit: '°' }, { key: 'b', label: 'β (새 y축)', min: -90, max: 90, unit: '°' }, { key: 'g', label: 'γ (새 x축)', min: -180, max: 180, unit: '°' }],
    draw: ({ a, b, g }) => {
      const id = 'f35', P = iso(240, 206, 116), R = zyx(a, b, g);
      return svg(id, [34, 352], [
        ref(id, P, 1.32, [sub('x', 'A'), sub('y', 'A'), sub('z', 'A')]),
        plate(P, R), body(id, P, R, [sub('x', 'B'), sub('y', 'B'), sub('z', 'B')], { k: 0.95, w: 2.75, s: 14, marks: refMarks(P, 1.32), lines: refLines(P, 1.32) }),
        C(240, 206, 4, 'f-ink', 0),
      ].join(''), 'Z-Y-X 오일러 각으로 돌린 좌표계 B');
    },
    readout: ({ a, b, g }) => `<div class="matrow"><b>R</b> = ${mat(zyx(a, b, g), ['c1', 'c2', ''])}<span class="q">첫 열 = x<sub>B</sub>, 둘째 열 = y<sub>B</sub>, 셋째 열 = z<sub>B</sub><br>(모두 A의 숫자로 적었다)</span></div>`,
  });

  // 그림 3-6 새 축으로 Z→Y = 고정 축으로 Y→Z
  FIG.fig3_6 = el => {
    const id = 'f36', s = 40, cx = [72, 240, 408], z90 = Rz(90 * D), y90 = Ry(90 * D), fin = mul(z90, y90);
    const rows = [
      { y: 158, title: '(가) 새 축으로: z로 90°, 그다음 새 y로 90°', Rs: [I3, z90, fin], steps: ['z로 90°', '새 y로 90°'] },
      { y: 362, title: '(나) 처음 축으로: y로 90°, 그다음 z로 90°', Rs: [I3, y90, fin], steps: ['처음 y로 90°', '처음 z로 90°'] },
    ];
    const b = [];
    rows.forEach(rw => {
      b.push(T(16, rw.y - 92, rw.title, { c: 'b', s: 14 }));
      rw.Rs.forEach((R, i) => {
        const P = iso(cx[i], rw.y, s);
        b.push(ref(id, P, 1.25, i === 0 ? [sub('x', 'A'), sub('y', 'A'), sub('z', 'A')] : null, { more: 'stroke-dasharray="3 3"', s: 12.5 }));
        if (i > 0) b.push(body(id, P, R, ['x', 'y', 'z'], { s: 13 }));
      });
      rw.steps.forEach((st, i) => {
        const x0 = cx[i] + 46, x1 = cx[i + 1] - 46;
        b.push(L(x0, rw.y + 4, x1, rw.y + 4, 'axis', 1.5, A(id, 'axis')), T((x0 + x1) / 2, rw.y - 6, st, { a: 'middle', s: 12.5 }));
      });
    });
    b.push(T(cx[0], 158 + 66, '처음 자세', { a: 'middle', c: 'q', s: 12.5 }), T(cx[0], 362 + 66, '처음 자세', { a: 'middle', c: 'q', s: 12.5 }));
    b.push(L(cx[2], 158 + 62, cx[2], 362 - 76, 'c2', 1.5, `marker-start="url(#${id}-c2)" ` + A(id, 'c2')), T(cx[2] - 10, 260, '같은 자세', { a: 'end', c: 'b', s: 13 }));
    b.push(L(16, 252, 300, 252, 'grid', 1));
    // 처음 자세에서 몸 축은 A 축과 겹친다
    rows.forEach(rw => b.push(body(id, iso(cx[0], rw.y, s), I3, null, {})));
    el.innerHTML += svg(id, [42, 400], b.join(''), '새 축으로 Z 다음 Y, 처음 축으로 Y 다음 Z는 같은 자세에 닿는다');
  };

  // 그림 3-7 atan2
  FIG.fig3_7 = el => {
    const id = 'f37', ox = 130, oy = 178, r = 92, P = [ox + r * 0.5, oy - r * 0.866], Q = [ox - r * 0.5, oy + r * 0.866];
    el.innerHTML += svg(id, [52, 260], [
      L(ox - 118, oy, ox + 122, oy, 'axis', 1.25, A(id, 'axis')), L(ox, oy + 112, ox, oy - 116, 'axis', 1.25, A(id, 'axis')),
      T(ox + 124, oy + 18, 'x', { c: 'q', s: 13 }), T(ox + 10, oy - 106, 'y', { c: 'q', s: 13 }),
      `<circle cx="${ox}" cy="${oy}" r="${r}" fill="none" class="s-grid" stroke-dasharray="3 4" stroke-width="1.25"/>`,
      L(ox - 0.62 * r, oy + 1.07 * r, ox + 0.62 * r, oy - 1.07 * r, 'axis', 1, 'stroke-dasharray="2 4"'),
      arc(ox, oy, 26, 0, 60 * D, 'c1', 1.75, A(id, 'c1')), arc(ox, oy, 40, 0, -120 * D, 'c2', 1.75, A(id, 'c2')),
      L(ox, oy, P[0], P[1], 'c1', 2.5, A(id, 'c1')), L(ox, oy, Q[0], Q[1], 'c2', 2.5, A(id, 'c2')),
      C(P[0], P[1], 5, 'f-c1', 0), C(Q[0], Q[1], 5, 'f-c2', 0),
      T(ox + 44, oy - 10, '60°', { c: 'b', s: 13 }), T(ox + 34, oy + 44, '−120°', { c: 'b', s: 13 }),
      T(P[0] + 10, P[1] - 8, 'P (0.5, 0.87)', { c: 'b', s: 13 }), T(Q[0] + 12, Q[1] + 16, 'Q (−0.5, −0.87)', { c: 'b', s: 13 }),
      L(276, 64, 276, 300, 'grid', 1),
      T(292, 84, 'y ÷ x만 쓰면', { c: 'b', s: 14 }),
      T(292, 108, 'P도 Q도 y ÷ x = 1.73', { s: 13 }), T(292, 130, 'tan⁻¹(1.73) = 60°', { s: 13 }), T(292, 152, 'Q가 어느 쪽인지 모른다', { c: 'q', s: 12.5 }),
      T(292, 198, 'atan2(y, x)는', { c: 'b', s: 14 }),
      T(292, 222, 'P → 60°', { c: 'f-c1 b', s: 13 }), T(292, 244, 'Q → −120°', { c: 'f-c2 b', s: 13 }), T(292, 266, 'x, y의 부호로 가린다', { c: 'q', s: 12.5 }),
    ].join(''), '기울기가 같은 두 방향을 atan2는 부호로 가린다');
  };

  // 그림 3-8 짐벌 잠금 (슬라이더)
  FIG.fig3_8 = el => interactive(el, {
    state: { a: 30, b: 90, g: 0 },
    sliders: [{ key: 'a', label: 'α (z축)', min: -180, max: 180, unit: '°' }, { key: 'b', label: 'β (새 y축)', min: -90, max: 90, unit: '°' }, { key: 'g', label: 'γ (새 x축)', min: -180, max: 180, unit: '°' }],
    draw: ({ a, b, g }) => {
      const id = 'f38', P = iso(240, 206, 98), R = zyx(a, b, g), yb1 = colv(Rz(a * D), 1), xb = colv(R, 0);
      const lab = (v, k, txt, cls) => { const p = P(sc(v, k)); return T(p[0].toFixed(1), (p[1] + 6).toFixed(1), txt, { a: 'middle', c: cls, s: 15 }); };
      // β, γ 이름은 띠의 두 끝 가운데 α 이름·B 축 끝에서 먼 쪽에 둔다
      const far = [P([0, 0, 1.56]), ...[0, 1, 2].map(j => P(sc(colv(R, j), 0.82)))];
      const pick = (v, k, more) => { const c = [P(sc(v, k)), P(sc(v, -k))], m = q => Math.min(...far.concat(more).map(f => Math.hypot(f[0] - q[0], f[1] - q[1]))); return m(c[0]) >= m(c[1]) ? c[0] : c[1]; };
      const pb = pick(yb1, 1.42, []), pg = pick(xb, 1.42, [pb]);
      const lab2 = (p, txt, cls) => T(p[0].toFixed(1), (p[1] + 6).toFixed(1), txt, { a: 'middle', c: cls, s: 15 });
      return svg(id, [22, 370], [
        ref(id, P, 0.9, null),
        band(P, [0, 0, 1], 'axis', 1.42), band(P, yb1, 'c1', 1.3), band(P, xb, 'c2', 1.3),
        lab([0, 0, 1], 1.56, 'α', 'b'), lab2(pb, 'β', 'f-c1 b'), lab2(pg, 'γ', 'f-c2 b'),
        plate(P, R, 0.55, 0.36),
        body(id, P, R, [sub('x', 'B'), sub('y', 'B'), sub('z', 'B')], { k: 0.82, w: 2.25, s: 13, marks: [P([0, 0, 1.56]), pb, pg] }),
        C(240, 206, 4, 'f-ink', 0),
      ].join(''), '베타가 90도이면 알파와 감마의 회전축이 한 줄로 겹친다');
    },
    readout: ({ a, b, g }) => {
      const R = zyx(a, b, g), ang = 90 - Math.abs(b);
      const msg = b === 90 ? `<b>두 축이 한 줄로 겹쳤다.</b> 행렬에는 α − γ = ${norm(a - g)}°만 남는다.`
        : b === -90 ? `<b>두 축이 한 줄로 겹쳤다.</b> 행렬에는 α + γ = ${norm(a + g)}°만 남는다.`
          : `두 축이 벌어져 있어 α와 γ가 서로 다른 움직임을 만든다.`;
      return `<div>α가 도는 축과 γ가 도는 축 사이: <b>${ang}°</b></div><div>${msg}</div><div class="matrow"><b>R</b> = ${mat(R)}</div>`;
    },
  });

  // 그림 3-9 각-축 표현과 오일러 파라미터 (슬라이더)
  FIG.fig3_9 = el => interactive(el, {
    state: { t: 60 },
    sliders: [{ key: 't', label: '돌린 각도 θ', min: -180, max: 180, step: 5, unit: '°' }],
    draw: ({ t }) => {
      const id = 'f39', K = [0, 0.6, 0.8], P = iso(120, 206, 84), R = axang(K, t * D);
      const h = Math.sin(t * D / 2), e = [K[0] * h, K[1] * h, K[2] * h, Math.cos(t * D / 2)], ab = e.map(Math.abs), im = ab.indexOf(Math.max(...ab));
      const k0 = P(sc(K, -1.05)), k1 = P(sc(K, 1.5)), kl = P(sc(K, 1.66));
      const path = [];
      for (let i = 0; i <= 40; i++) path.push(P(mv(axang(K, t * D * i / 40), [1, 0, 0])));
      const y0 = 210, hs = 96, bx = i => 298 + 42 * i;
      const bars = e.map((v, i) => {
        const top = Math.min(y0, y0 - v * hs), hh = Math.max(Math.abs(v) * hs, 1);
        return `<rect x="${bx(i) - 14}" y="${top.toFixed(1)}" width="28" height="${hh.toFixed(1)}" rx="3" class="${i === im ? 'f-c2' : 'f-c1'}" fill-opacity="${i === im ? 0.75 : 0.4}"/>` +
          T(bx(i), v >= 0 ? top - 8 : top + hh + 18, f2(v), { a: 'middle', c: i === im ? 'b' : '', s: 12.5 }) +
          T(bx(i), 336, ['ε₁', 'ε₂', 'ε₃', 'ε₄'][i], { a: 'middle', c: 'b', s: 14 });
      }).join('');
      return svg(id, [40, 306], [
        ref(id, P, 1.2, [sub('x', 'A'), sub('y', 'A'), sub('z', 'A')]),
        L(k0[0], k0[1], k1[0], k1[1], 'ink', 1.25, 'stroke-dasharray="6 4"'), T(kl[0] + 6, kl[1] + 4, '축 K', { c: 'b', s: 13 }),
        Math.abs(t) > 4 ? `<path d="M${pts(path)}" fill="none" class="s-c1" stroke-width="1.5" stroke-dasharray="3 3"/>` : '',
        body(id, P, R, [sub('x', 'B'), sub('y', 'B'), sub('z', 'B')], { k: 1, w: 2.5, marks: refMarks(P, 1.2).concat([[kl[0] + 26, kl[1]]]), lines: refLines(P, 1.2).concat([[k0[0], k0[1], k1[0], k1[1]]]) }),
        C(120, 206, 4, 'f-ink', 0),
        L(272, 52, 272, 340, 'grid', 1),
        L(280, y0, 444, y0, 'axis', 1), L(280, y0 - hs / 2, 444, y0 - hs / 2, 'axis', 1, 'stroke-dasharray="3 4"'), L(280, y0 + hs / 2, 444, y0 + hs / 2, 'axis', 1, 'stroke-dasharray="3 4"'),
        L(280, y0 - hs, 444, y0 - hs, 'grid', 1), L(280, y0 + hs, 444, y0 + hs, 'grid', 1),
        T(450, y0 - hs / 2 + 4, '½', { c: 'q', s: 13 }), T(450, y0 + hs / 2 + 4, '−½', { c: 'q', s: 13 }), T(450, y0 - hs + 4, '1', { c: 'q', s: 12.5 }), T(450, y0 + hs + 4, '−1', { c: 'q', s: 12.5 }), T(450, y0 + 4, '0', { c: 'q', s: 12.5 }),
        bars,
      ].join(''), '축 K로 돌린 좌표계와 오일러 파라미터 네 개');
    },
    readout: ({ t }) => {
      const K = [0, 0.6, 0.8], R = axang(K, t * D), h = Math.sin(t * D / 2), e = [K[0] * h, K[1] * h, K[2] * h, Math.cos(t * D / 2)];
      const ab = e.map(Math.abs), im = ab.indexOf(Math.max(...ab)), th = Math.acos(Math.max(-1, Math.min(1, (R[0][0] + R[1][1] + R[2][2] - 1) / 2))), s = Math.sin(th);
      const back = s < 0.005 ? `sin θ = 0 → <b>0으로 나누게 되어 K를 구할 수 없다</b>`
        : `θ = ${Math.round(th / D)}°, K = (${[R[2][1] - R[1][2], R[0][2] - R[2][0], R[1][0] - R[0][1]].map(v => f2(v / (2 * s))).join(', ')})`;
      return `<div><b>ε</b> = (${e.map(f2).join(', ')}) <span class="q">제곱 합 = ${f2(e.reduce((q, v) => q + v * v, 0))}</span></div>` +
        `<div>각-축 식으로 되돌리기: ${back}</div>` +
        `<div>가장 큰 칸 <b class="c2">${['ε₁', 'ε₂', 'ε₃', 'ε₄'][im]} = ${f2(e[im])}</b> <span class="q">크기가 ½ 이상이라 이것으로 나누면 언제나 풀린다</span></div>`;
    },
  });
})();
