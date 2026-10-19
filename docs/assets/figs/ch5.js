// 5장 그림: DH 복습, RPRR 팔, Scheinman 팔, 4×4 읽기, 종이 팔 역기구학
(function () {
  const { D, f1, f2, svg, T, L, A, AA, C, joint, link, arc, annulus, interactive, sub } = FigKit;
  const FIG = window.FIG;

  // ⊙: 종이 면에서 나를 향해 나오는 축
  const outDot = (x, y, c = 'c2', r = 7) => C(x, y, r, `f-tint s-${c}`, 1.75) + C(x, y, 2.4, `f-${c}`, 0);
  // 동그라미 번호
  const badge = (x, y, n) => C(x, y, 9.5, 'f-tint s-ink', 1.25) + T(x, y + 4.5, n, { a: 'middle', s: 12.5, c: 'b' });
  const ang = (dx, dy) => Math.atan2(-dy, dx);   // 화면 방향 → 수학 각도(라디안)

  // 3차원 → 화면 (Scheinman 팔 그림 둘이 같이 쓴다). x는 앞쪽 왼아래, y는 오른쪽, z는 위.
  const view = (ox, oy, s) => (p) => [ox + s * (-0.342 * p[0] + 0.940 * p[1]), oy - s * (-0.321 * p[0] - 0.117 * p[1] + 0.940 * p[2])];
  const add = (p, v, k = 1) => [p[0] + k * v[0], p[1] + k * v[1], p[2] + k * v[2]];

  // 그림 5-1 DH 파라미터 네 개와 좌표계 붙이기 네 단계
  FIG.fig5_1 = el => {
    const id = 'f51', al = 50 * D, th = 36 * D, ca = Math.cos(al), sa = Math.sin(al);
    const ox = 64, oy = 280, P = p => [ox + p[0] + 0.45 * p[1], oy - p[2] - 0.28 * p[1]];
    const zi = [0, -sa, ca], xi = [Math.cos(th), Math.sin(th) * ca, Math.sin(th) * sa];
    const a = 200, d = 170, B = [a, 0, 0], Oi = add(B, zi, d);
    const A0 = P([0, 0, 0]), B0 = P(B), O = P(Oi);
    const top1 = P([0, 0, 150]), bot1 = P([0, 0, -64]), top2 = P(add(B, zi, 296)), bot2 = P(add(B, zi, -60));
    const zim1 = P([0, 0, 58]), xim1 = P([62, 0, 0]), vB = P([a, 0, 74]), zT = P(add(Oi, zi, 80)), xT = P(add(Oi, xi, 96)), xc = P(add(Oi, [1, 0, 0], 86));
    const dirB = ang(top2[0] - B0[0], top2[1] - B0[1]), dirX = ang(xT[0] - O[0], xT[1] - O[1]), mB = (Math.PI / 2 + dirB) / 2;
    const dm = P(add(B, zi, d / 2));
    el.innerHTML += svg(id, [104, 270], [
      L(bot1[0], bot1[1], top1[0], top1[1], 'axis', 1.25, 'stroke-dasharray="6 4"'), T(top1[0], top1[1] - 8, '축 i−1', { a: 'middle', c: 'q', s: 12.5 }),
      L(bot2[0], bot2[1], top2[0], top2[1], 'axis', 1.25, 'stroke-dasharray="6 4"'), T(bot2[0] + 8, bot2[1] + 14, '축 i', { c: 'q', s: 12.5 }),
      L(A0[0], A0[1], B0[0], B0[1], 'ink', 1.5), C(B0[0], B0[1], 3, 'f-ink', 0),
      T(200, A0[1] + 22, sub('a', 'i−1') + ' (거리)', { a: 'middle', s: 13 }),
      L(A0[0], A0[1], zim1[0], zim1[1], 'c1', 2.5, A(id, 'c1')), T(zim1[0] - 8, zim1[1] + 6, sub('z', 'i−1'), { a: 'end', c: 'b', s: 13 }),
      L(A0[0], A0[1], xim1[0], xim1[1], 'c2', 2.5, A(id, 'c2')), T(xim1[0] - 4, A0[1] + 22, sub('x', 'i−1'), { a: 'middle', c: 'b', s: 13 }),
      C(A0[0], A0[1], 4, 'f-ink', 0), T(A0[0] - 10, A0[1] + 18, '{i−1}', { a: 'end', s: 13 }),
      L(B0[0], B0[1], vB[0], vB[1], 'axis', 1.25, 'stroke-dasharray="3 3"'),
      arc(B0[0], B0[1], 46, Math.PI / 2, dirB, 'c1', 1.5), T(B0[0] + 60 * Math.cos(mB), B0[1] - 60 * Math.sin(mB) + 5, sub('α', 'i−1'), { a: 'middle', c: 'b', s: 13 }),
      T(dm[0] - 12, dm[1] + 6, sub('d', 'i'), { a: 'end', c: 'b', s: 13 }),
      L(O[0], O[1], xc[0], xc[1], 'axis', 1.25, 'stroke-dasharray="3 3"'), T(xc[0] + 6, xc[1] + 5, sub('x', 'i−1') + ' 방향', { c: 'q', s: 12 }),
      arc(O[0], O[1], 50, 0, dirX, 'c2', 1.5), T(O[0] + 64 * Math.cos(dirX / 2), O[1] - 64 * Math.sin(dirX / 2) + 5, sub('θ', 'i'), { a: 'middle', c: 'b', s: 13 }),
      L(O[0], O[1], zT[0], zT[1], 'c1', 2.5, A(id, 'c1')), T(zT[0] - 8, zT[1] + 4, sub('z', 'i'), { a: 'end', c: 'b', s: 13 }),
      L(O[0], O[1], xT[0], xT[1], 'c2', 2.5, A(id, 'c2')), T(xT[0] + 6, xT[1] + 4, sub('x', 'i'), { c: 'b', s: 13 }),
      C(O[0], O[1], 4, 'f-ink', 0), T(O[0] - 12, O[1] + 18, '{i}', { a: 'end', s: 13 }),
      badge((A0[0] + B0[0]) / 2, A0[1] - 16, '1'), badge(O[0] + 10, O[1] - 20, '2'), badge(zT[0] + 18, zT[1] - 6, '3'), badge(xT[0] - 10, xT[1] - 18, '4'),
      badge(28, 352, '1'), T(42, 357, '공통 수선', { s: 12.5 }), badge(128, 352, '2'), T(142, 357, '원점', { s: 12.5 }),
      badge(204, 352, '3'), T(218, 357, 'z축 = 관절 축', { s: 12.5 }), badge(328, 352, '4'), T(342, 357, 'x축 = 수선 방향', { s: 12.5 }),
    ].join(''), '이웃한 두 관절 축 사이를 거리 둘, 각도 둘로 적는다');
  };

  // 그림 5-2 RPRR 팔과 좌표계 (옆에서 본 도식)
  FIG.fig5_2 = el => {
    const id = 'f52', O1 = [90, 252], O2 = [206, 252], O3 = [206, 178], y5 = 122, O5 = [404, y5], xk = 372;
    el.innerHTML += svg(id, [52, 340], [
      // 받침과 관절 1
      `<rect x="44" y="368" width="92" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(O1[0], 368, O1[0], O1[1], 'axis', 5, 'stroke-linecap="round"'),
      L(O1[0], 384, O1[0], 92, 'axis', 1, 'stroke-dasharray="6 4"'),
      `<rect x="${O1[0] - 13}" y="296" width="26" height="40" rx="4" class="f-tint s-ink" stroke-width="1.5"/>`,
      T(O1[0] - 20, 321, '관절 1 (R)', { a: 'end', s: 12.5 }),
      // 관절 2: 막대 위를 미끄러지는 토막
      L(O1[0], O1[1], 340, O1[1], 'axis', 5, 'stroke-linecap="round"'),
      `<rect x="${O2[0] - 22}" y="${O2[1] - 11}" width="44" height="22" rx="4" class="f-c1 s-c1" fill-opacity="0.18" stroke-width="1.5"/>`,
      C(O2[0] - 12, O2[1] + 15, 3, 'f-ink', 0), C(O2[0] + 12, O2[1] + 15, 3, 'f-ink', 0),
      T(O2[0] + 30, O2[1] + 32, '관절 2 (P)', { s: 12.5 }),
      // 링크 2: 토막 위 기둥, 관절 3, 관절 4, 손
      link(O2[0], O2[1] - 11, O3[0], O3[1] + 10, 'c1', 10),
      `<rect x="${O3[0] + 20}" y="${O3[1] - 9}" width="34" height="18" rx="4" class="f-tint s-ink" stroke-width="1.5"/>`,
      `<path d="M${O3[0] + 54} ${O3[1]}H${xk}V${y5}H${O5[0] - 8}" fill="none" class="s-c1" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.25"/>`,
      `<path d="M${O3[0] + 54} ${O3[1]}H${xk}V${y5}H${O5[0] - 8}" fill="none" class="s-c1" stroke-width="2" stroke-linejoin="round"/>`,
      C(O3[0], O3[1], 12, 'f-tint s-ink', 1.5),
      T(O3[0] + 62, O3[1] + 30, '관절 4 (R)', { a: 'middle', s: 12.5 }), T(O3[0] - 58, O3[1] + 5, '관절 3 (R)', { a: 'end', s: 12.5 }),
      // 치수
      L(O1[0] + 2, 282, O2[0] - 2, 282, 'ink', 1, AA(id, 'ink')), T((O1[0] + O2[0]) / 2, 300, 'd₂ (변수)', { a: 'middle', s: 13 }),
      L(170, O2[1] - 2, 170, O3[1] + 2, 'ink', 1, AA(id, 'ink')), T(162, (O2[1] + O3[1]) / 2 + 5, 'L₂', { a: 'end', s: 13 }),
      T(xk + 8, (O3[1] + y5) / 2 + 5, 'L₄', { s: 13 }),
      L(O3[0], y5, O5[0], y5, 'axis', 1, 'stroke-dasharray="3 3"'),
      L(O3[0] + 2, 100, O5[0] - 2, 100, 'ink', 1, AA(id, 'ink')), T((O3[0] + O5[0]) / 2, 94, 'L₅', { a: 'middle', s: 13 }),
      L(O3[0], O3[1] - 50, O3[0], 96, 'axis', 1, 'stroke-dasharray="3 3"'),
      // 좌표계 {0}, {1}
      L(O1[0], O1[1], O1[0], O1[1] - 64, 'c1', 2.5, A(id, 'c1')), T(O1[0] - 8, O1[1] - 54, 'z₀ z₁', { a: 'end', c: 'b', s: 13 }),
      outDot(O1[0], O1[1]), T(O1[0] - 12, O1[1] + 22, 'x₀ x₁ ⊙', { a: 'end', c: 'b', s: 13 }),
      // {2}
      L(O2[0], O2[1], O2[0] + 66, O2[1], 'c1', 2.5, A(id, 'c1')), T(O2[0] + 70, O2[1] - 8, 'z₂', { c: 'b', s: 13 }),
      L(O2[0], O2[1], O2[0], O3[1] + 14, 'c2', 2, A(id, 'c2')), T(O2[0] + 10, O2[1] - 26, 'x₂', { c: 'b', s: 13 }),
      // {3}, {4}
      outDot(O3[0], O3[1], 'c1', 6.5), T(O3[0] - 16, O3[1] - 8, 'z₃ ⊙', { a: 'end', c: 'b', s: 13 }),
      L(O3[0] + 13, O3[1], O3[0] + 112, O3[1], 'c1', 2.5, A(id, 'c1')), T(O3[0] + 116, O3[1] + 18, 'z₄', { c: 'b', s: 13 }),
      L(O3[0], O3[1] - 13, O3[0], O3[1] - 48, 'c2', 2.5, A(id, 'c2')), T(O3[0] - 8, O3[1] - 34, 'x₃ x₄', { a: 'end', c: 'b', s: 13 }),
      // {5} 손
      L(O5[0], O5[1], O5[0] + 50, O5[1], 'c1', 2.5, A(id, 'c1')), T(O5[0] + 44, O5[1] - 9, 'z₅', { c: 'b', s: 13 }),
      L(O5[0], O5[1], O5[0], O5[1] - 44, 'c2', 2.5, A(id, 'c2')), T(O5[0] + 9, O5[1] - 34, 'x₅', { c: 'b', s: 13 }),
      C(O5[0], O5[1], 4.5, 'f-ink', 0), T(O5[0] + 4, O5[1] + 22, '손 {5}', { s: 13 }),
    ].join(''), 'RPRR 팔의 관절 축마다 z축을, 공통 수선마다 x축을 놓는다');
  };

  // 그림 5-3 Scheinman 팔: θ가 모두 0인 자세의 관절 축과 좌표계
  FIG.fig5_3 = el => {
    const id = 'f53', P = view(186, 300, 4.3), d2 = 15, d3 = 40;
    const O0 = P([0, 0, 0]), O2 = P([0, d2, 0]), O3 = P([0, d2, d3]), bot = P([0, 0, -28]), tail = P([0, d2, -12]);
    const ar = (o, v, k) => P(add(o, v, k));
    const X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
    const x0 = ar([0, 0, 0], X, 22), z0 = ar([0, 0, 0], Z, 13), z2 = ar([0, d2, 0], Y, 14), x2 = ar([0, d2, 0], X, 22);
    const z3 = ar([0, d2, d3], Z, 14), z5 = ar([0, d2, d3], Y, 14), x3 = ar([0, d2, d3], X, 22);
    const a1t = P([0, 0, 22]), a2a = P([0, -8, 0]), a2b = P([0, d2 + 20, 0]), a3t = P([0, d2, d3 + 24]), a5a = P([0, d2 - 8, d3]), a5b = P([0, d2 + 20, d3]);
    el.innerHTML += svg(id, [50, 390], [
      `<rect x="${bot[0] - 34}" y="${bot[1]}" width="68" height="12" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(bot[0], bot[1] + 12, a1t[0], a1t[1], 'axis', 1, 'stroke-dasharray="6 4"'),
      L(a2a[0], a2a[1], a2b[0], a2b[1], 'axis', 1, 'stroke-dasharray="6 4"'),
      L(tail[0], tail[1] + 20, a3t[0], a3t[1], 'axis', 1, 'stroke-dasharray="6 4"'),
      L(a5a[0], a5a[1], a5b[0], a5b[1], 'axis', 1, 'stroke-dasharray="6 4"'),
      link(bot[0], bot[1], O0[0], O0[1], 'axis', 16), link(O0[0], O0[1], O2[0], O2[1], 'axis', 12),
      link(tail[0], tail[1], O3[0], O3[1], 'c1', 10),
      `<rect x="${O2[0] - 10}" y="${O2[1] - 14}" width="20" height="28" rx="3" class="f-tint s-ink" stroke-width="1.5"/>`,
      C(O0[0], O0[1], 9, 'f-tint s-ink'), C(O3[0], O3[1], 9, 'f-tint s-ink'),
      // 관절 번호
      T(bot[0] - 18, bot[1] - 30, '① 받침 회전', { a: 'end', s: 12.5 }),
      T(O0[0] - 16, O0[1] - 12, '② 어깨', { a: 'end', s: 12.5 }),
      T(O2[0] + 16, (O2[1] + O3[1]) / 2 + 10, '③ 팔대 미끄럼', { s: 12.5 }),
      T(O3[0] + 26, O3[1] + 30, '④⑤⑥ 손목', { s: 12.5 }),
      // 치수
      T((O0[0] + O2[0]) / 2, O0[1] - 10, 'd₂', { a: 'middle', c: 'b', s: 13 }),
      T(O2[0] - 14, O3[1] + 0.35 * (O2[1] - O3[1]) + 5, 'd₃', { a: 'end', c: 'b', s: 13 }),
      // 좌표계
      L(O0[0], O0[1], z0[0], z0[1], 'c1', 2.5, A(id, 'c1')), T(z0[0] + 8, z0[1] + 6, 'z₀ z₁', { c: 'b', s: 13 }),
      L(O0[0], O0[1], x0[0], x0[1], 'c2', 2.5, A(id, 'c2')), T(x0[0] - 6, x0[1] + 14, 'x₀ x₁', { a: 'end', c: 'b', s: 13 }),
      L(O2[0], O2[1], z2[0], z2[1], 'c1', 2.5, A(id, 'c1')), T(z2[0] + 6, z2[1] + 18, 'z₂', { c: 'b', s: 13 }),
      L(O2[0], O2[1], x2[0], x2[1], 'c2', 2.5, A(id, 'c2')), T(x2[0] - 6, x2[1] + 14, 'x₂', { a: 'end', c: 'b', s: 13 }),
      L(O3[0], O3[1], z3[0], z3[1], 'c1', 2.5, A(id, 'c1')), T(z3[0] + 8, z3[1] + 4, 'z₃ z₄ z₆', { c: 'b', s: 13 }),
      L(O3[0], O3[1], z5[0], z5[1], 'c1', 2.5, A(id, 'c1')), T(z5[0] + 6, z5[1] + 5, 'z₅', { c: 'b', s: 13 }),
      L(O3[0], O3[1], x3[0], x3[1], 'c2', 2.5, A(id, 'c2')), T(x3[0] - 6, x3[1] + 14, 'x₃ x₄ x₅ x₆', { a: 'end', c: 'b', s: 13 }),
      T(O3[0] - 14, O3[1] - 14, '손목 중심', { a: 'end', s: 12.5 }),
      T(z3[0] + 8, z3[1] - 14, '축 4와 축 6이 한 줄 (θ₅ = 0)', { c: 'q', s: 12.5 }),
    ].join(''), 'Scheinman 팔의 관절 축과 좌표계. 관절 각도가 모두 0이면 팔대가 위를 본다');
  };

  // 그림 5-4 왼쪽부터 차례로 곱하기
  FIG.fig5_4 = el => {
    const id = 'f54', X = i => 40 + i * 66, Y = i => 130 + 34 * (i - 1);
    const sup = ['⁰', '¹', '²', '³', '⁴', '⁵'], sb = ['₀', '₁', '₂', '₃', '₄', '₅', '₆'];
    const b = [];
    for (let i = 0; i <= 6; i++) {
      b.push(C(X(i), 74, 14, i === 0 ? 'f-tint s-axis' : 'f-none s-ink', 1.5), T(X(i), 79, String(i), { a: 'middle', c: 'b', s: 13 }));
      if (i < 6) b.push(L(X(i) + 15, 74, X(i + 1) - 17, 74, 'ink', 1.25, A(id, 'ink')), T((X(i) + X(i + 1)) / 2, 58, sup[i] + 'T' + sb[i + 1], { a: 'middle', s: 12.5 }));
    }
    b.push(T(X(0), 104, '받침', { a: 'middle', c: 'q', s: 12 }), T(X(6), 104, '손', { a: 'middle', c: 'q', s: 12 }));
    for (let i = 1; i <= 6; i++) {
      const y = Y(i), w = X(i) - X(0) + 28, wrist = i >= 3;
      b.push(`<rect x="${X(0) - 14}" y="${y}" width="${w}" height="24" rx="5" class="${wrist ? 'f-c2 s-c2' : 'f-c1 s-c1'}" fill-opacity="0.14" stroke-width="1.25"/>`);
      b.push(T(X(0) - 6, y + 17, i === 1 ? '⁰T₁' : `⁰T${sb[i]} = ⁰T${sb[i - 1]} · ${sup[i - 1]}T${sb[i]}`, { s: 12.5 }));
      b.push(C(X(Math.min(i, 3)), y + 12, 4.5, wrist ? 'f-c2' : 'f-c1', 0));
    }
    b.push(T(X(1) + 22, Y(1) + 17, '셋째 열 = 0에서 본 z₁', { c: 'q', s: 12 }));
    b.push(T(X(2) + 22, Y(2) + 17, '셋째 열 = 0에서 본 z₂', { c: 'q', s: 12 }));
    b.push(T(X(3) + 22, Y(3) + 17, '넷째 열 = 손목 중심', { c: 'q', s: 12 }));
    b.push(L(X(3), Y(3) + 16, X(3), Y(6) + 34, 'c2', 1.25, 'stroke-dasharray="4 3"'));
    b.push(T(X(3) - 8, Y(6) + 50, '③~⑥ 줄은 넷째 열(위치)이 모두 같다', { a: 'middle', s: 12.5 }));
    el.innerHTML += svg(id, [40, 324], b.join(''), '변환을 받침 쪽부터 하나씩 곱해 나간다');
  };

  // 그림 5-5 Scheinman 팔 움직여 보기 (슬라이더)
  const sch = ({ t1, t2, d3, t5 }) => {
    const c1 = Math.cos(t1 * D), s1 = Math.sin(t1 * D), c2 = Math.cos(t2 * D), s2 = Math.sin(t2 * D), d2 = 15;
    const n = [-s1, c1, 0], u = [c1 * s2, s1 * s2, c2], O2 = [d2 * n[0], d2 * n[1], 0], W = add(O2, u, d3);
    const q = (t2 + t5) * D, z6 = [c1 * Math.sin(q), s1 * Math.sin(q), Math.cos(q)], x6 = [c1 * Math.cos(q), s1 * Math.cos(q), -Math.sin(q)];
    return { n, u, O2, W, z6, x6 };
  };
  FIG.fig5_5 = el => interactive(el, {
    state: { t1: 90, t2: 30, d3: 40, t5: 0 },
    sliders: [
      { key: 't1', label: '받침 θ₁', min: -180, max: 180, unit: '°' },
      { key: 't2', label: '어깨 θ₂', min: 0, max: 120, unit: '°' },
      { key: 'd3', label: '팔대 d₃', min: 20, max: 45, unit: ' cm' },
      { key: 't5', label: '손목 θ₅', min: -90, max: 90, unit: '°' },
    ],
    draw: s => {
      const id = 'f55', P = view(240, 220, 3.6), g = sch(s), H = 30;
      const O0 = P([0, 0, 0]), bot = P([0, 0, -H]), O2 = P(g.O2), tail = P(add(g.O2, g.u, -10)), W = P(g.W);
      const tip = add(g.W, g.z6, 9), Tp = P(tip), f1a = P(add(add(g.W, g.z6, 5), g.x6, 2.6)), f1b = P(add(tip, g.x6, 2.6)), f2a = P(add(add(g.W, g.z6, 5), g.x6, -2.6)), f2b = P(add(tip, g.x6, -2.6));
      const foot = P([g.W[0], g.W[1], 0]);
      const ax = [[1, 0, 0, 'x₀', 36], [0, 1, 0, 'y₀', 30], [0, 0, 1, 'z₀', 26]].map(([a, b, c, nm, k]) => {
        const e = P([a * k, b * k, c * k]);
        return L(O0[0], O0[1], e[0], e[1], 'axis', 1.25, A(id, 'axis')) + T(e[0] + (a ? -6 : 6), e[1] + (a ? 14 : c ? 4 : 16), nm, { a: a ? 'end' : 'start', c: 'q', s: 12.5 });
      }).join('');
      return svg(id, [12, 376], [
        `<polygon points="${[[-16, -16], [16, -16], [16, 16], [-16, 16]].map(([x, y]) => P([x, y, -H]).join(',')).join(' ')}" class="f-tint s-grid" stroke-width="1"/>`,
        ax,
        L(W[0], W[1], foot[0], foot[1], 'ink', 1, 'stroke-dasharray="3 3" stroke-opacity="0.6"'), L(O0[0], O0[1], foot[0], foot[1], 'ink', 1, 'stroke-dasharray="3 3" stroke-opacity="0.6"'), C(foot[0], foot[1], 2.5, 'f-ink', 0),
        link(bot[0], bot[1], O0[0], O0[1], 'axis', 14), link(O0[0], O0[1], O2[0], O2[1], 'axis', 10),
        link(tail[0], tail[1], W[0], W[1], 'c1', 9), joint(O0[0], O0[1], 7), C(O2[0], O2[1], 6, 'f-tint s-ink'),
        L(W[0], W[1], Tp[0], Tp[1], 'c2', 3, 'stroke-linecap="round"'),
        L(f1a[0], f1a[1], f1b[0], f1b[1], 'c2', 2.5, 'stroke-linecap="round"'), L(f2a[0], f2a[1], f2b[0], f2b[1], 'c2', 2.5, 'stroke-linecap="round"'),
        L(f1a[0], f1a[1], f2a[0], f2a[1], 'c2', 2.5, 'stroke-linecap="round"'),
        C(W[0], W[1], 6, 'f-c2', 0),
      ].join(''), 'Scheinman 팔의 관절을 움직이면 손목 중심과 손 방향이 바뀐다');
    },
    readout: s => {
      const g = sch(s);
      const r = Math.sqrt(g.W[0] ** 2 + g.W[1] ** 2 + g.W[2] ** 2);
      return `<div><span class="dot c2">●</span> <b>손목 중심</b> (넷째 열) = (${f1(g.W[0])}, ${f1(g.W[1])}, ${f1(g.W[2])}) cm</div>` +
        `<div><b class="c2">손 방향 z₆</b> (셋째 열) = (${f2(g.z6[0])}, ${f2(g.z6[1])}, ${f2(g.z6[2])})</div>` +
        `<div class="q">d₂ = 15 cm, θ₄ = θ₆ = 0. 원점에서 손목 중심까지 ${f1(r)} cm = √(d₂² + d₃²). θ₅는 위치를 바꾸지 않는다.</div>`;
    },
  });

  // 4×4 행렬 표 (readout 안)
  const mat4 = (M, cls) => '<table class="mat">' + M.map(row => '<tr>' + row.map((v, j) => `<td class="${cls[j]}">${v}</td>`).join('') + '</tr>').join('') + '</table>';

  // 그림 5-6 ⁰T 읽기: 열 = 손의 축, 마지막 열 = 손 위치 (슬라이더)
  FIG.fig5_6 = el => interactive(el, {
    state: { t1: 50, t2: -70 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: -180, max: 180, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -150, max: 150, unit: '°' }],
    draw: ({ t1, t2 }) => {
      const id = 'f56', s = 9, bx = 240, by = 222, a = t1 * D, b = (t1 + t2) * D;
      const ex = bx + 10 * s * Math.cos(a), ey = by - 10 * s * Math.sin(a), hx = ex + 8 * s * Math.cos(b), hy = ey - 8 * s * Math.sin(b);
      const k = 40, Xh = [hx + k * Math.cos(b), hy - k * Math.sin(b)], Yh = [hx - k * Math.sin(b), hy - k * Math.cos(b)];
      return svg(id, [12, 418], [
        L(bx - 196, by, bx + 196, by, 'grid', 1), L(bx, by + 196, bx, by - 196, 'grid', 1),
        L(bx, by, bx + 196, by, 'axis', 1.25, A(id, 'axis')), L(bx, by, bx, by - 196, 'axis', 1.25, A(id, 'axis')),
        T(bx + 196, by + 18, 'x₀', { a: 'end', c: 'q', s: 13 }), T(bx + 8, by - 184, 'y₀', { c: 'q', s: 13 }),
        link(bx, by, ex, ey, 'axis', 10), link(ex, ey, hx, hy, 'axis', 10), joint(bx, by, 7), joint(ex, ey, 6),
        L(bx, by, hx, hy, 'ink', 1.5, 'stroke-dasharray="5 4" ' + A(id, 'ink')),
        T((bx + hx) / 2 + 14 * Math.sin(Math.atan2(by - hy, hx - bx)), (by + hy) / 2 + 14 * Math.cos(Math.atan2(by - hy, hx - bx)) + 5, 'p', { a: 'middle', c: 'b', s: 14 }),
        L(hx, hy, Xh[0], Xh[1], 'c1', 2.75, A(id, 'c1')), L(hx, hy, Yh[0], Yh[1], 'c2', 2.75, A(id, 'c2')),
        T(hx + 56 * Math.cos(b), hy - 56 * Math.sin(b) + 5, sub('x', 'H'), { a: 'middle', c: 'b', s: 14 }),
        T(hx - 56 * Math.sin(b), hy - 56 * Math.cos(b) + 5, sub('y', 'H'), { a: 'middle', c: 'b', s: 14 }),
        outDot(hx, hy, 'ink', 6.5),
      ].join(''), '손 좌표계의 축과 위치가 4×4 행렬의 열이 된다');
    },
    readout: ({ t1, t2 }) => {
      const a = t1 * D, b = (t1 + t2) * D, c = Math.cos(b), sn = Math.sin(b), px = 10 * Math.cos(a) + 8 * c, py = 10 * Math.sin(a) + 8 * sn;
      const M = [[f2(c), f2(-sn), '0', f1(px)], [f2(sn), f2(c), '0', f1(py)], ['0', '0', '1', '0'], ['0', '0', '0', '1']];
      return `<div class="matrow"><b>⁰T<sub>H</sub></b> = ${mat4(M, ['c1', 'c2', '', ''])}<span class="q"><span class="c1">1열 = x<sub>H</sub></span>, <span class="c2">2열 = y<sub>H</sub></span>,<br>3열 = z<sub>H</sub> (⊙, 책상 위쪽), 4열 = 손끝 위치 p</span></div>`;
    },
  });

  // 그림 5-7 코사인 법칙과 atan2로 두 각도 구하기
  FIG.fig5_7 = el => {
    const id = 'f57', s = 16, bx = 132, by = 330, t1 = 27.04 * D, t12 = (27.04 + 84.26) * D, ph = Math.atan2(12, 6);
    const E = [bx + 10 * s * Math.cos(t1), by - 10 * s * Math.sin(t1)], Pt = [bx + 6 * s, by - 12 * s], ext = [E[0] + 76 * Math.cos(t1), E[1] - 76 * Math.sin(t1)];
    el.innerHTML += svg(id, [104, 270], [
      L(bx, by, 450, by, 'axis', 1.25, A(id, 'axis')), T(450, by + 20, 'x', { a: 'end', c: 'q', s: 13 }),
      L(bx, by, Pt[0], Pt[1], 'ink', 1.5, 'stroke-dasharray="6 4"'),
      L(E[0], E[1], ext[0], ext[1], 'axis', 1.25, 'stroke-dasharray="4 4"'),
      link(bx, by, E[0], E[1], 'c2', 10), link(E[0], E[1], Pt[0], Pt[1], 'c2', 10),
      arc(bx, by, 44, 0, t1, 'c2', 1.75), T(bx + 58 * Math.cos(t1 / 2), by - 58 * Math.sin(t1 / 2) + 5, 'θ₁', { a: 'middle', c: 'b', s: 14 }),
      arc(bx, by, 74, t1, ph, 'ink', 1.25), T(bx + 88 * Math.cos((t1 + ph) / 2), by - 88 * Math.sin((t1 + ph) / 2) + 5, 'β', { a: 'middle', c: 'b', s: 14 }),
      arc(bx, by, 112, 0, ph, 'axis', 1.25, 'stroke-dasharray="3 3"'), T(bx + 140 * Math.cos(8 * D), by - 140 * Math.sin(8 * D) + 5, 'φ', { a: 'middle', c: 'b', s: 14 }),
      arc(E[0], E[1], 30, t1, t12, 'c2', 1.75), T(E[0] + 46 * Math.cos((t1 + t12) / 2), E[1] - 46 * Math.sin((t1 + t12) / 2) + 5, 'θ₂', { a: 'middle', c: 'b', s: 14 }),
      arc(E[0], E[1], 18, t12, t1 + Math.PI, 'ink', 1.25), T(E[0] - 24, E[1] - 5, '180° − θ₂', { a: 'end', s: 12.5 }),
      T(bx + 132 * Math.cos(t1) + 14 * Math.sin(t1), by - 132 * Math.sin(t1) + 14 * Math.cos(t1) + 5, '10', { a: 'middle', s: 13 }),
      T((E[0] + Pt[0]) / 2 + 14, (E[1] + Pt[1]) / 2 + 4, '8', { s: 13 }),
      T(bx + 0.42 * (Pt[0] - bx) - 12, by + 0.42 * (Pt[1] - by), 'r', { a: 'end', c: 'b', s: 14 }),
      joint(bx, by, 7), joint(E[0], E[1], 6), C(Pt[0], Pt[1], 5, 'f-ink', 0),
      T(bx - 12, by + 22, '받침 O', { a: 'end', s: 13 }), T(E[0] + 12, E[1] + 22, '팔꿈치 E', { s: 13 }),
      T(Pt[0] + 12, Pt[1] - 6, '목표 P (6, 12)', { c: 'b', s: 13 }),
    ].join(''), '삼각형 받침-팔꿈치-목표로 두 관절 각도를 구한다');
  };

  // 그림 5-8 역기구학 직접 해 보기 (슬라이더)
  const ik = (x, y) => {
    const c2 = (x * x + y * y - 164) / 160;
    if (c2 > 1 + 1e-9 || c2 < -1 - 1e-9) return { c2, sol: [] };
    const q = Math.acos(Math.max(-1, Math.min(1, c2)));
    return { c2, sol: [-q, q].map(t2 => [Math.atan2(y, x) - Math.atan2(8 * Math.sin(t2), 10 + 8 * Math.cos(t2)), t2]) };
  };
  const dg = v => { let r = Math.round(v / D * 10) / 10; if (r > 180) r -= 360; if (r <= -180) r += 360; return (Object.is(r, -0) ? 0 : r).toFixed(1); };
  FIG.fig5_8 = el => interactive(el, {
    state: { x: 12, y: 6 },
    sliders: [{ key: 'x', label: '목표 x', min: -20, max: 20, step: 0.5, unit: ' cm' }, { key: 'y', label: '목표 y', min: -8, max: 20, step: 0.5, unit: ' cm' }],
    draw: ({ x, y }) => {
      const id = 'f58', s = 10, bx = 240, by = 222, P = (u, v) => [bx + s * u, by - s * v], g = ik(x, y), Tg = P(x, y), r = Math.hypot(x, y);
      const b = [annulus(bx, by, 180, 20),
        L(bx - 196, by, bx + 196, by, 'axis', 1, A(id, 'axis')), L(bx, by + 186, bx, by - 206, 'axis', 1, A(id, 'axis')),
        T(bx + 196, by + 18, 'x', { a: 'end', c: 'q', s: 13 }), T(bx + 8, by - 196, 'y', { c: 'q', s: 13 })];
      const merged = g.sol.length && Math.abs(Math.abs(g.c2) - 1) < 1e-9;
      if (g.sol.length) {
        g.sol.forEach(([t1, t2], i) => {
          const c = i ? 'c2' : 'c1', E = P(10 * Math.cos(t1), 10 * Math.sin(t1));
          b.push(link(bx, by, E[0], E[1], c, 10), link(E[0], E[1], Tg[0], Tg[1], c, 10), C(E[0], E[1], 6, `f-tint s-${c}`));
          if (merged && i === 1) return;
          // 글자는 팔꿈치에서 두 링크의 바깥쪽에 둔다. 팔이 곧으면 옆에 둔다.
          const u1 = [bx - E[0], by - E[1]], u2 = [Tg[0] - E[0], Tg[1] - E[1]], n1 = Math.hypot(...u1), n2 = Math.hypot(...u2) || 1;
          let v = [-(u1[0] / n1 + u2[0] / n2), -(u1[1] / n1 + u2[1] / n2)], n = Math.hypot(...v);
          if (n < 0.3) { v = [u1[1] / n1, -u1[0] / n1]; n = 1; }
          b.push(T(E[0] + 26 * v[0] / n, E[1] + 26 * v[1] / n + 5, merged ? '답 1 = 답 2' : (i ? '답 2' : '답 1'), { a: 'middle', c: 'b', s: 13 }));
        });
      } else {
        const ph = Math.atan2(y, x), E = P(10 * Math.cos(ph), 10 * Math.sin(ph)), H = P((r > 18 ? 18 : 2) * Math.cos(ph), (r > 18 ? 18 : 2) * Math.sin(ph));
        b.push(L(bx, by, E[0], E[1], 'axis', 2, 'stroke-dasharray="5 4"'), L(E[0], E[1], H[0], H[1], 'axis', 2, 'stroke-dasharray="5 4"'), C(E[0], E[1], 5, 'f-tint s-axis'));
      }
      b.push(joint(bx, by, 7), C(Tg[0], Tg[1], 10, 'f-none s-ink', 1.5), C(Tg[0], Tg[1], 3.5, 'f-ink', 0));
      b.push(T(16, 398, g.sol.length ? (merged ? '경계 위: 답 1개' : '답 2개') : `도달 불가 (r ${r > 18 ? '> 18' : '< 2'} cm)`, { c: 'b', s: 14 }));
      return svg(id, [12, 398], b.join(''), '목표 위치를 옮기면 두 가지 자세가 따라온다');
    },
    readout: ({ x, y }) => {
      const g = ik(x, y), r = Math.hypot(x, y);
      let h = `<div><b>목표</b> (${f1(x)}, ${f1(y)}) cm · 거리 r = ${f2(r)} cm · cos θ₂ = (r² − 164) / 160 = <b>${f2(g.c2)}</b></div>`;
      if (!g.sol.length) return h + `<div><b>도달 불가</b>: cos θ₂가 −1과 1 사이가 아니다 (${r > 18 ? 'r > 18 cm, 너무 멀다' : 'r < 2 cm, 너무 가깝다'}).</div>`;
      const fk = ([t1, t2]) => `(${f1(10 * Math.cos(t1) + 8 * Math.cos(t1 + t2))}, ${f1(10 * Math.sin(t1) + 8 * Math.sin(t1 + t2))})`;
      g.sol.forEach(([t1, t2], i) => {
        h += `<div><span class="dot ${i ? 'c2' : 'c1'}">●</span> 답 ${i + 1} (θ₂ ${i ? '≥' : '≤'} 0): θ₁ = <b>${dg(t1)}°</b>, θ₂ = <b>${dg(t2)}°</b> <span class="q">→ 순기구학으로 다시 넣으면 ${fk([t1, t2])}</span></div>`;
      });
      if (Math.abs(Math.abs(g.c2) - 1) < 1e-9) h += `<div class="q">경계 위다. 두 답이 하나로 합쳐졌다.</div>`;
      return h;
    },
  });
})();
