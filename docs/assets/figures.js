// 그림 그리기. 정적 그림은 SVG 문자열을 돌려주고, 움직이는 그림은 슬라이더로 다시 그린다.
(function () {
  const D = Math.PI / 180;
  const f1 = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(1);
  const f2 = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);

  const defs = id => '<defs>' + ['axis', 'ink', 'c1', 'c2'].map(c =>
    `<marker id="${id}-${c}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="f-${c}"/></marker>`).join('') + '</defs>';
  const svg = (id, vb, body, label) => `<svg viewBox="0 ${vb[0]} 480 ${vb[1]}" role="img" aria-label="${label}">${defs(id)}${body}</svg>`;
  const T = (x, y, txt, o = {}) => `<text x="${x}" y="${y}" class="${o.c || ''}" text-anchor="${o.a || 'start'}" font-size="${o.s || 14}">${txt}</text>`;
  const L = (x1, y1, x2, y2, c, w = 1.25, more = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="s-${c}" stroke-width="${w}" ${more}/>`;
  const A = (id, c) => `marker-end="url(#${id}-${c})"`;
  const AA = (id, c) => `marker-start="url(#${id}-${c})" marker-end="url(#${id}-${c})"`;
  const C = (x, y, r, cls, w = 1.5) => `<circle cx="${x}" cy="${y}" r="${r}" class="${cls}" stroke-width="${w}"/>`;
  const joint = (x, y, r = 8) => C(x, y, r, 'f-tint s-axis');
  const link = (x1, y1, x2, y2, c = 'c1', fat = 12) =>
    L(x1, y1, x2, y2, c, fat, `stroke-linecap="round" stroke-opacity="0.25"`) + L(x1, y1, x2, y2, c, 2);
  const arc = (ox, oy, r, from, to, c, w = 1.5, more = '') => {
    const big = Math.abs(to - from) > Math.PI ? 1 : 0;
    return `<path d="M${ox + r * Math.cos(from)} ${oy - r * Math.sin(from)} A${r} ${r} 0 ${big} ${to > from ? 0 : 1} ${ox + r * Math.cos(to)} ${oy - r * Math.sin(to)}" fill="none" class="s-${c}" stroke-width="${w}" ${more}/>`;
  };
  const annulus = (bx, by, R, r) =>
    `<path d="M${bx - R} ${by}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0zM${bx - r} ${by}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z" fill-rule="evenodd" class="f-tint s-grid" stroke-width="1"/>`;

  // 슬라이더가 있는 그림의 뼈대
  function interactive(el, spec) {
    const state = Object.assign({}, spec.state);
    const box = document.createElement('div');
    const ctr = document.createElement('div');
    ctr.className = 'controls';
    const out = document.createElement('div');
    out.className = 'readout';
    const spans = {};
    spec.sliders.forEach(s => {
      const lab = document.createElement('label');
      lab.textContent = s.label;
      const inp = document.createElement('input');
      Object.assign(inp, { type: 'range', min: s.min, max: s.max, step: s.step || 1, value: state[s.key] });
      inp.setAttribute('aria-label', s.label);
      const val = document.createElement('span');
      val.className = 'val';
      spans[s.key] = [val, s.unit];
      inp.addEventListener('input', () => { state[s.key] = Number(inp.value); render(); });
      ctr.append(lab, inp, val);
    });
    function render() {
      box.innerHTML = spec.draw(state);
      Object.entries(spans).forEach(([k, [v, u]]) => { v.textContent = state[k] + u; });
      out.innerHTML = spec.readout ? spec.readout(state) : '';
    }
    el.append(box, ctr, out);
    render();
  }

  const FIG = {};

  // 그림 1-1 종이 팔의 부분
  FIG.fig1_1 = el => {
    const id = 'f11', sx = 150, sy = 236, a1 = 50 * D, a2 = -20 * D;
    const ex = sx + 160 * Math.cos(a1), ey = sy - 160 * Math.sin(a1), hx = ex + 130 * Math.cos(a2), hy = ey - 130 * Math.sin(a2);
    const b = [
      L(sx, sy, sx + 84, sy, 'axis', 1, 'stroke-dasharray="4 4"'),
      L(ex, ey, ex + 60 * Math.cos(a1), ey - 60 * Math.sin(a1), 'axis', 1, 'stroke-dasharray="4 4"'),
      L(sx, sy, sx, sy + 8, 'axis', 2),
      `<rect x="${sx - 40}" y="${sy + 8}" width="80" height="22" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
      T(sx, sy + 52, '받침 (고정)', { a: 'middle' }),
      link(sx, sy, ex, ey, 'c1', 14), link(ex, ey, hx, hy, 'c1', 14),
      T(sx + 80 * Math.cos(a1) - 24 * Math.sin(a1), sy - 80 * Math.sin(a1) - 24 * Math.cos(a1) + 5, '링크 1', { a: 'end' }),
      T(ex + 65 * Math.cos(a2) + 24 * Math.sin(a2), ey - 65 * Math.sin(a2) + 24 * Math.cos(a2) + 5, '링크 2', { a: 'middle' }),
      arc(sx, sy, 44, 0, a1, 'c1'), arc(ex, ey, 34, a1, a2, 'c1'),
      T(sx + 62 * Math.cos(25 * D), sy - 62 * Math.sin(25 * D) + 5, 'θ₁', { c: 'b' }),
      T(ex + 54 * Math.cos(15 * D), ey - 54 * Math.sin(15 * D) + 5, 'θ₂', { c: 'b' }),
      joint(sx, sy, 9), T(sx - 16, sy - 10, '관절 1 · 어깨', { a: 'end' }),
      joint(ex, ey, 9), T(ex - 14, ey - 14, '관절 2 · 팔꿈치', { a: 'end' }),
      L(hx, hy, hx + 20 * Math.cos(a2 + 30 * D), hy - 20 * Math.sin(a2 + 30 * D), 'c1', 3, 'stroke-linecap="round"'),
      L(hx, hy, hx + 20 * Math.cos(a2 - 30 * D), hy - 20 * Math.sin(a2 - 30 * D), 'c1', 3, 'stroke-linecap="round"'),
      C(hx, hy, 6, 'f-c1', 0), T(hx, hy + 42, '손끝 (말단 장치)', { a: 'middle' }),
    ];
    el.innerHTML += svg(id, [56, 246], b.join(''), '종이 팔은 받침, 링크, 관절, 손끝으로 이루어진다');
  };

  // 그림 1-2 순기구학 (슬라이더)
  FIG.fig1_2 = el => interactive(el, {
    state: { t1: 50, t2: -70 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: -180, max: 180, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -150, max: 150, unit: '°' }],
    draw: ({ t1, t2 }) => {
      const id = 'f12', s = 10, bx = 240, by = 240, a = t1 * D, b = (t1 + t2) * D;
      const ex = bx + 100 * Math.cos(a), ey = by - 100 * Math.sin(a), hx = ex + 80 * Math.cos(b), hy = ey - 80 * Math.sin(b);
      return svg(id, [40, 392], [
        annulus(bx, by, 180, 20), T(bx, by + 166, '손끝이 닿는 곳 (2~18 cm)', { a: 'middle', c: 'q', s: 12.5 }),
        L(bx, by, bx + 200, by, 'axis', 1, A(id, 'axis')), L(bx, by, bx, by - 192, 'axis', 1, A(id, 'axis')),
        T(bx + 206, by + 5, 'x', { c: 'q' }), T(bx + 8, by - 182, 'y', { c: 'q' }),
        L(hx, hy, hx, by, 'c1', 1, 'stroke-dasharray="3 3" stroke-opacity="0.7"'), L(hx, hy, bx, hy, 'c1', 1, 'stroke-dasharray="3 3" stroke-opacity="0.7"'),
        link(bx, by, ex, ey), link(ex, ey, hx, hy),
        arc(bx, by, 30, 0, a, 'c1'), arc(ex, ey, 24, a, b, 'c1'),
        joint(bx, by), joint(ex, ey), C(hx, hy, 6, 'f-c1', 0),
        T(bx + 46 * Math.cos(a / 2), by - 46 * Math.sin(a / 2) + 5, 'θ₁', { a: 'middle', c: 'b' }),
        T(ex + 40 * Math.cos((a + b) / 2), ey - 40 * Math.sin((a + b) / 2) + 5, 'θ₂', { a: 'middle', c: 'b' }),
      ].join(''), '관절 각도 두 개가 손끝 위치 하나를 정한다');
    },
    readout: ({ t1, t2 }) => {
      const x = 10 * Math.cos(t1 * D) + 8 * Math.cos((t1 + t2) * D), y = 10 * Math.sin(t1 * D) + 8 * Math.sin((t1 + t2) * D);
      return `<b>손끝 (x, y)</b> = (${f1(x)}, ${f1(y)}) cm`;
    },
  });

  // 그림 1-3 역기구학의 두 답
  FIG.fig1_3 = el => {
    const id = 'f13', s = 10, bx = 240, by = 230, P = (x, y) => [bx + s * x, by - s * y];
    const Tg = P(12, 6), Eu = P(10 * Math.cos(62.96 * D), 10 * Math.sin(62.96 * D)), Ed = P(10 * Math.cos(-9.83 * D), 10 * Math.sin(-9.83 * D)), F = P(-15.5, 15.5);
    const arm = (E, c) => link(bx, by, E[0], E[1], c, 10) + link(E[0], E[1], Tg[0], Tg[1], c, 10) + C(E[0], E[1], 7, `f-tint s-${c}`);
    el.innerHTML += svg(id, [44, 432], [
      annulus(bx, by, 180, 20),
      arm(Eu, 'c1'), T(Eu[0] - 12, Eu[1] - 14, '답 1: 팔꿈치 위', { a: 'end' }),
      arm(Ed, 'c2'), T(Ed[0], Ed[1] + 30, '답 2: 팔꿈치 아래', { a: 'middle' }),
      joint(bx, by), T(bx - 14, by + 22, '받침', { a: 'end', c: 'q', s: 12.5 }),
      C(Tg[0], Tg[1], 11, 'f-none s-axis'), C(Tg[0], Tg[1], 4, 'f-ink', 0), T(Tg[0] + 16, Tg[1] - 8, '목표 (12, 6) cm', { c: 'b' }),
      C(F[0], F[1], 4, 'f-none s-axis'), T(F[0] + 12, F[1] + 5, '닿지 않는 곳: 답이 없다'),
      T(bx, by + 166, '손끝이 닿는 곳 (2~18 cm)', { a: 'middle', c: 'q', s: 12.5 }),
      L(16, 436, 40, 436, 'c1', 3), T(48, 441, '답 1: θ₁ = 63°, θ₂ = −84°'),
      L(16, 460, 40, 460, 'c2', 3), T(48, 465, '답 2: θ₁ = −10°, θ₂ = 84°'),
    ].join(''), '같은 손끝 위치에 닿는 자세는 두 개다');
  };

  // 그림 1-4 자코비안의 두 가지 일
  FIG.fig1_4 = el => {
    const id = 'f14', W = 160, H = 76, xl = 16, xr = 304, r1 = 72, r2 = 172;
    const box = (x, y, name, l1, l2) => `<rect x="${x}" y="${y}" width="${W}" height="${H}" rx="8" fill="none" class="s-axis" stroke-width="1.25"/>` +
      T(x + 12, y + 24, name, { c: 'b', s: 15 }) + T(x + 12, y + 46, l1, { s: 12.5 }) + T(x + 12, y + 64, l2, { s: 12.5 });
    el.innerHTML += svg(id, [40, 220], [
      T(xl + W / 2, 58, '관절 쪽 (모터)', { a: 'middle', c: 'q b', s: 13 }), T(xr + W / 2, 58, '손끝 쪽 (하는 일)', { a: 'middle', c: 'q b', s: 13 }),
      box(xl, r1, '관절 속도', '어깨와 팔꿈치가', '도는 빠르기'), box(xr, r1, '손끝 속도', '손끝이 움직이는', '빠르기와 방향'),
      box(xl, r2, '관절 토크', '모터가 내야 할', '돌리는 힘'), box(xr, r2, '손끝 힘', '계란을 누르는 힘,', '벽을 미는 힘'),
      `<path d="M${xl + W + 4} ${r1 + 38}H${xr - 4}" fill="none" class="s-c1" stroke-width="2" ${A(id, 'c1')}/>`,
      `<path d="M${xr - 4} ${r2 + 38}H${xl + W + 4}" fill="none" class="s-c1" stroke-width="2" ${A(id, 'c1')}/>`,
      T(240, r1 + 30, '자코비안', { a: 'middle', c: 'b', s: 13 }), T(240, r2 + 30, '같은 자코비안', { a: 'middle', c: 'b', s: 13 }),
      T(240, r2 + 58, '(거꾸로)', { a: 'middle', c: 'q', s: 11.5 }),
    ].join(''), '자코비안 하나가 속도와 힘을 함께 옮긴다');
  };

  // 그림 1-5 자세마다 다른 무게 (슬라이더)
  FIG.fig1_5 = el => interactive(el, {
    state: { t2: 0 },
    sliders: [{ key: 't2', label: '팔꿈치 θ₂', min: 0, max: 150, unit: '°' }],
    draw: ({ t2 }) => {
      const id = 'f15', s = 12, bx = 48, by = 214, a = 20 * D, b = (20 + t2) * D;
      const ex = bx + s * 10 * Math.cos(a), ey = by - s * 10 * Math.sin(a), hx = ex + s * 8 * Math.cos(b), hy = ey - s * 8 * Math.sin(b);
      const c = Math.cos(t2 * D), I = 500 + 15 * (116 + 80 * c) + 50 * (164 + 160 * c), Imax = 19640;
      return svg(id, [64, 262], [
        L(bx, by, hx, hy, 'axis', 1, 'stroke-dasharray="4 4"'),
        link(bx, by, ex, ey), link(ex, ey, hx, hy),
        C(bx + s * 5 * Math.cos(a), by - s * 5 * Math.sin(a), 5, 'f-axis', 0), C(ex + s * 4 * Math.cos(b), ey - s * 4 * Math.sin(b), 4.5, 'f-axis', 0),
        joint(bx, by), joint(ex, ey, 7),
        `<rect x="${hx - 8}" y="${hy - 8}" width="16" height="16" rx="3" class="f-c1 s-c1" fill-opacity="0.35" stroke-width="1.5"/>`,
        T(hx + 14, hy - 10, '50 g', { s: 12.5 }), T(bx, by + 28, '어깨', { a: 'middle', c: 'q', s: 12.5 }),
        T(312, 120, '어깨에서 손까지', { c: 'q', s: 13 }), T(312, 142, Math.sqrt(164 + 160 * c).toFixed(1) + ' cm', { c: 'b', s: 15 }),
        T(16, 270, '어깨에서 느끼는 무거움 (관성)', { c: 'b', s: 13 }), T(464, 270, Math.round(I / Imax * 100) + '%', { a: 'end', c: 'b', s: 15 }),
        `<rect x="16" y="280" width="448" height="14" rx="4" fill="none" class="s-grid"/>`,
        `<rect x="16" y="280" width="${448 * I / Imax}" height="14" rx="4" class="f-c1" fill-opacity="0.45"/>`,
        T(16, 314, '팔을 다 편 때를 100%로 본 값', { c: 'q', s: 11.5 }),
      ].join(''), '팔을 접으면 어깨가 돌리기 쉬워진다');
    },
  });

  // 그림 1-6 끌어당기고 밀어내는 제어
  FIG.fig1_6 = el => {
    const id = 'f16', bx = 60, by = 270, ex = 160, ey = 160, hx = 280, hy = 200, gx = 410, gy = 110, ox = 330, oy = 272;
    el.innerHTML += svg(id, [66, 236], [
      C(gx, gy, 14, 'f-none s-c1'), C(gx, gy, 5, 'f-c1', 0), T(gx, gy - 24, '목표', { a: 'middle', c: 'b' }),
      C(ox, oy, 28, 'f-tint s-axis', 1.25), T(ox, oy + 5, '장애물', { a: 'middle', s: 13 }),
      `<rect x="${bx - 30}" y="${by + 6}" width="60" height="16" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
      link(bx, by, ex, ey, 'axis', 10), link(ex, ey, hx, hy, 'axis', 10), joint(bx, by, 7), joint(ex, ey, 7), C(hx, hy, 6, 'f-ink', 0),
      L(hx + 10, hy - 7, hx + 76, hy - 52, 'c1', 2.5, A(id, 'c1')), L(hx + 82, hy - 56, gx - 14, gy + 9, 'c1', 1, 'stroke-dasharray="3 4"'),
      T(hx + 70, hy - 18, '끌어당기는 힘'),
      L(hx - 7, hy - 10, hx - 38, hy - 54, 'c2', 2.5, A(id, 'c2')), T(hx - 46, hy - 62, '밀어내는 힘', { a: 'end' }),
    ].join(''), '손을 목표로 끌어당기고 장애물은 밀어낸다');
  };

  // 그림 1-7 수업의 길
  FIG.fig1_7 = el => {
    const id = 'f17', x0 = 16, W = 448, H = 72, Y = i => 48 + 92 * i;
    const steps = [
      ['① 위치 적기 · 2~5강', '좌표계, 회전행렬, 순기구학', '예: 모터 각도로 손끝 위치 구하기'],
      ['② 속도와 힘 · 6~8강', '자코비안, 특이점, 속도·힘 쌍대성', '예: 계란을 얼마나 세게 쥘지 정하기'],
      ['③ 눈 · 9강 (초청 강의)', '카메라로 물체를 찾는 컴퓨터 비전', '예: 카메라로 컵 찾기'],
      ['④ 부드러운 길 · 10강', '출발부터 도착까지 궤적 만들기', '예: 모터가 덜컥거리지 않게 움직이기'],
      ['⑤ 무게와 힘 · 11~12강', '동역학, 질량 행렬', '예: 모터 힘이 충분한지 계산하기'],
      ['⑥ 제어 · 13~15강', 'PD·PID 제어, 작업 공간 제어', '예: 손끝을 원하는 곳에 정확히 보내기'],
      ['⑦ 힘 제어 · 16강', '닿으면서 움직이기, 사람 곁의 안전', '예: 세게 누르면 멈추기'],
    ];
    const b = steps.map((s, i) => {
      const main = i === 0;
      return `<rect x="${x0}" y="${Y(i)}" width="${W}" height="${H}" rx="8" class="${main ? 'f-c1 s-c1' : 's-axis'}" fill${main ? '-opacity="0.12"' : '="none"'} stroke-width="${main ? 2 : 1.25}"/>` +
        T(x0 + 14, Y(i) + 24, s[0], { c: 'b', s: 15 }) + T(x0 + 14, Y(i) + 44, s[1], { s: 12.5 }) + T(x0 + 14, Y(i) + 62, s[2], { c: 'q', s: 12.5 }) +
        (i < 6 ? L(240, Y(i) + H, 240, Y(i + 1) - 2, 'axis', 1.25, A(id, 'axis')) : '');
    });
    b.push(T(x0 + W - 14, Y(0) + 24, '다음: 2장', { a: 'end', c: 'b', s: 11.5 }));
    b.push(L(x0, Y(2) - 10, x0 + W, Y(2) - 10, 'axis', 1, 'stroke-dasharray="4 4"'), T(x0 + W, Y(2) - 15, '여기까지 중간고사', { a: 'end', c: 'q', s: 11.5 }));
    el.innerHTML += svg(id, [36, 648], b.join(''), '로봇 팔을 움직이는 순서대로 16강이 이어진다');
  };

  // 그림 2-1 회전 관절과 직동 관절
  FIG.fig2_1 = el => {
    const id = 'f21', px = 120, py = 172, a = 35 * D;
    el.innerHTML += svg(id, [40, 216], [
      T(124, 60, '회전 관절 (R)', { a: 'middle', c: 'b', s: 15 }), T(124, 80, '자유도 1', { a: 'middle', c: 'q', s: 12.5 }),
      `<rect x="36" y="${py - 9}" width="${px - 36}" height="18" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
      link(px, py, px + 92 * Math.cos(a), py - 92 * Math.sin(a), 'c1', 16), joint(px, py, 9),
      arc(px, py, 40, -5 * D, 75 * D, 'c1', 1.75, AA(id, 'c1')),
      T(124, 222, '한 축을 중심으로 돈다', { a: 'middle' }), T(124, 242, '예: 문 경첩, 모터 관절', { a: 'middle', c: 'q', s: 12.5 }),
      L(240, 48, 240, 246, 'grid', 1),
      T(356, 60, '직동 관절 (P)', { a: 'middle', c: 'b', s: 15 }), T(356, 80, '자유도 1', { a: 'middle', c: 'q', s: 12.5 }),
      `<rect x="300" y="164" width="150" height="16" rx="4" class="f-c1 s-c1" fill-opacity="0.3" stroke-width="1.5"/>`,
      `<rect x="264" y="154" width="100" height="36" rx="6" class="f-tint s-axis" stroke-width="1.25"/>`,
      L(330, 130, 440, 130, 'c1', 1.75, AA(id, 'c1')),
      T(356, 222, '한 축을 따라 미끄러진다', { a: 'middle' }), T(356, 242, '예: 서랍, 주사기', { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '관절은 돌거나 미끄러진다');
  };

  // 그림 2-2 자유도 세기
  FIG.fig2_2 = el => {
    const id = 'f22', cx = 124, cy = 160, s = 44;
    const P = (x, y, z) => `${cx + (x - y) * 0.866 * s},${cy + (x + y - 1) * 0.5 * s - (z - 0.5) * s}`;
    const face = pts => `<polygon points="${pts.join(' ')}" class="f-tint s-axis" stroke-width="1.25"/>`;
    const hx = 330, hy = 186, a = 40 * D;
    el.innerHTML += svg(id, [38, 280], [
      T(cx, 58, '공중에 떠 있는 링크', { a: 'middle', c: 'b', s: 15 }),
      face([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)]), face([P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)]), face([P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)]),
      L(cx + 34 * 0.866, cy + 17, cx + 78 * 0.866, cy + 39, 'c1', 2, A(id, 'c1')), L(cx - 34 * 0.866, cy + 17, cx - 78 * 0.866, cy + 39, 'c1', 2, A(id, 'c1')),
      L(cx, cy - 44, cx, cy - 82, 'c1', 2, A(id, 'c1')),
      `<path d="M${cx - 13} ${cy - 66} A13 5 0 1 0 ${cx + 13} ${cy - 66}" fill="none" class="s-c2" stroke-width="1.75" ${A(id, 'c2')}/>`,
      `<path d="M${cx + 58} ${cy + 22} A6 12 -30 1 0 ${cx + 70} ${cy + 44}" fill="none" class="s-c2" stroke-width="1.75" ${A(id, 'c2')}/>`,
      `<path d="M${cx - 58} ${cy + 22} A6 12 30 1 1 ${cx - 70} ${cy + 44}" fill="none" class="s-c2" stroke-width="1.75" ${A(id, 'c2')}/>`,
      T(cx, 252, '이동 3 + 회전 3', { a: 'middle', s: 13 }), T(cx, 270, '= 숫자 6개', { a: 'middle', c: 'b', s: 13 }),
      L(240, 44, 240, 276, 'grid', 1),
      T(356, 58, '관절로 붙인 링크', { a: 'middle', c: 'b', s: 15 }),
      `<rect x="280" y="206" width="150" height="10" class="f-tint s-axis" stroke-width="1"/>`,
      `<rect x="${hx - 16}" y="${hy}" width="32" height="20" rx="3" class="f-tint s-axis" stroke-width="1.25"/>`,
      link(hx, hy, hx + 100 * Math.cos(a), hy - 100 * Math.sin(a), 'c1', 16), joint(hx, hy),
      arc(hx, hy, 46, 15 * D, 70 * D, 'c2', 1.75, AA(id, 'c2')),
      T(356, 252, '남는 것: 돌기 1개', { a: 'middle', s: 13 }), T(356, 270, '관절이 5개를 막았다', { a: 'middle', c: 'b', s: 13 }),
      T(240, 304, '링크 n개: 6n − 5n = n 자유도', { a: 'middle', c: 'b', s: 15 }),
    ].join(''), '관절 하나가 움직임 6개 중 5개를 막는다');
  };

  // 그림 2-3 관절 공간과 작업 공간 (슬라이더)
  FIG.fig2_3 = el => interactive(el, {
    state: { t1: 50, t2: -70 },
    sliders: [{ key: 't1', label: '어깨 θ₁', min: -180, max: 180, unit: '°' }, { key: 't2', label: '팔꿈치 θ₂', min: -150, max: 150, unit: '°' }],
    draw: ({ t1, t2 }) => {
      const id = 'f23', s = 7, bx = 240, by = 182;
      const Xr = 10 * Math.cos(t1 * D) + 8 * Math.cos((t1 + t2) * D), Yr = 10 * Math.sin(t1 * D) + 8 * Math.sin((t1 + t2) * D);
      const phi = Math.atan2(Yr, Xr) / D, g1 = Math.round(((2 * phi - t1 + 540) % 360) - 180), g2 = -t2;
      const pts = (u1, u2) => { const ex = bx + 70 * Math.cos(u1 * D), ey = by - 70 * Math.sin(u1 * D); return [ex, ey, ex + 56 * Math.cos((u1 + u2) * D), ey - 56 * Math.sin((u1 + u2) * D)]; };
      const a = pts(t1, t2), g = pts(g1, g2), px = u => 240 + u, py = u => 500 - u;
      const grid = [-90, 0, 90].map(v => L(px(v), 350, px(v), 650, 'grid', 1, v ? 'stroke-dasharray="3 4"' : '') + L(60, py(v), 420, py(v), 'grid', 1, v ? 'stroke-dasharray="3 4"' : '')).join('');
      return svg(id, [32, 668], [
        T(16, 48, '작업 공간: 손끝이 있는 곳', { c: 'b' }),
        annulus(bx, by, 126, 14),
        L(bx, by, g[0], g[1], 'c2', 2, 'stroke-dasharray="5 4"'), L(g[0], g[1], g[2], g[3], 'c2', 2, 'stroke-dasharray="5 4"'), C(g[0], g[1], 5, 'f-none s-c2'),
        link(bx, by, a[0], a[1], 'c1', 10), link(a[0], a[1], a[2], a[3], 'c1', 10), joint(bx, by, 6), joint(a[0], a[1], 6), C(a[2], a[3], 6, 'f-ink', 0),
        L(16, 318, 464, 318, 'grid', 1),
        T(16, 340, '관절 공간: 관절 각도로 만든 판', { c: 'b' }),
        `<rect x="60" y="350" width="360" height="300" fill="none" class="s-axis" stroke-width="1"/>`, grid,
        C(px(g1), py(g2), 7, 'f-none s-c2', 2), C(px(t1), py(t2), 7, 'f-c1', 0),
        T(60, 668, '−180°', { a: 'middle', c: 'q', s: 12 }), T(240, 668, '0°', { a: 'middle', c: 'q', s: 12 }), T(420, 668, '180°', { a: 'middle', c: 'q', s: 12 }),
        T(54, 354, '150°', { a: 'end', c: 'q', s: 12 }), T(54, 504, '0°', { a: 'end', c: 'q', s: 12 }), T(54, 654, '−150°', { a: 'end', c: 'q', s: 12 }),
        T(420, 690, '가로: θ₁ 어깨', { a: 'end', s: 12.5 }), T(66, 690, '세로: θ₂ 팔꿈치', { s: 12.5 }),
      ].join(''), '같은 팔 자세를 두 공간의 점으로 본다');
    },
    readout: ({ t1, t2 }) => {
      const Xr = 10 * Math.cos(t1 * D) + 8 * Math.cos((t1 + t2) * D), Yr = 10 * Math.sin(t1 * D) + 8 * Math.sin((t1 + t2) * D);
      const phi = Math.atan2(Yr, Xr) / D, g1 = Math.round(((2 * phi - t1 + 540) % 360) - 180);
      return `<div><b>손끝 (x, y)</b> = (${f1(Xr)}, ${f1(Yr)}) cm</div><div><span class="dot c1">●</span> 지금 자세 (${t1}°, ${t2}°)</div><div><span class="dot c2">○</span> 같은 손끝에 닿는 다른 자세 (${g1}°, ${-t2}°)</div>`;
    },
  });

  // 그림 2-4 여유자유도 (슬라이더)
  FIG.fig2_4 = el => interactive(el, {
    state: { psi: 30 },
    sliders: [{ key: 'psi', label: '마지막 링크 방향', min: -75, max: 115, unit: '°' }],
    draw: ({ psi }) => {
      const id = 'f24', s = 12, bx = 110, by = 222, Tx = 12, Ty = 4;
      const solve = p => { const wx = Tx - 5 * Math.cos(p * D), wy = Ty - 5 * Math.sin(p * D); const c = Math.max(-1, Math.min(1, (wx * wx + wy * wy - 113) / 112)); const q2 = -Math.acos(c); const q1 = Math.atan2(wy, wx) - Math.atan2(7 * Math.sin(q2), 8 + 7 * Math.cos(q2)); return [q1, q2, wx, wy]; };
      const P = (x, y) => [bx + s * x, by - s * y];
      const path = p => { const q = solve(p), E = P(8 * Math.cos(q[0]), 8 * Math.sin(q[0])), W = P(q[2], q[3]), Tt = P(Tx, Ty); return `M${bx} ${by}L${E[0]} ${E[1]}L${W[0]} ${W[1]}L${Tt[0]} ${Tt[1]}`; };
      const q = solve(psi), E = P(8 * Math.cos(q[0]), 8 * Math.sin(q[0])), W = P(q[2], q[3]), Tt = P(Tx, Ty);
      return svg(id, [100, 160], [
        [-70, -20, 40, 100].map(g => `<path d="${path(g)}" fill="none" class="s-grid" stroke-width="2"/>`).join(''),
        `<path d="${path(psi)}" fill="none" class="s-c1" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.25"/>`,
        `<path d="${path(psi)}" fill="none" class="s-c1" stroke-width="2" stroke-linejoin="round"/>`,
        `<rect x="${bx - 26}" y="${by + 6}" width="52" height="14" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
        joint(bx, by, 7), joint(E[0], E[1], 6), joint(W[0], W[1], 6),
        C(Tt[0], Tt[1], 12, 'f-none s-ink'), C(Tt[0], Tt[1], 4, 'f-ink', 0), T(Tt[0] + 20, Tt[1] + 30, '손끝은 여기 고정', { c: 'b' }),
      ].join(''), '손끝은 그대로인데 팔 모양은 계속 바뀔 수 있다');
    },
    readout: ({ psi }) => {
      const wx = 12 - 5 * Math.cos(psi * D), wy = 4 - 5 * Math.sin(psi * D); const c = Math.max(-1, Math.min(1, (wx * wx + wy * wy - 113) / 112)); const q2 = -Math.acos(c); const q1 = Math.atan2(wy, wx) - Math.atan2(7 * Math.sin(q2), 8 + 7 * Math.cos(q2));
      const a1 = Math.round(q1 / D), a2 = Math.round(q2 / D);
      return `<b>관절 각도</b> θ₁ = ${a1}°, θ₂ = ${a2}°, θ₃ = ${Math.round(psi - a1 - a2)}° · 손끝은 항상 (12, 4) cm`;
    },
  });

  // 그림 2-5 원점과 축
  FIG.fig2_5 = el => {
    const id = 'f25', ax = 70, ay = 236, bx2 = 210, by2 = 250, px = 340, py = 96, ox = 100, oy = 500, s = 45, c = Math.cos(30 * D), sn = Math.sin(30 * D);
    const Pp = [ox + 2 * s, oy - 3 * s], fxb = [ox + 3.232 * s * c, oy - 3.232 * s * sn], fyb = [ox - 1.598 * s * sn, oy - 1.598 * s * c];
    el.innerHTML += svg(id, [36, 480], [
      T(16, 56, '(가) 원점이 다르면 화살표 자체가 다르다', { c: 'b' }),
      L(ax, ay, ax + 40, ay, 'axis', 1.25, A(id, 'axis')), L(ax, ay, ax, ay - 40, 'axis', 1.25, A(id, 'axis')),
      L(bx2, by2, bx2 + 40, by2, 'c1', 1.25, A(id, 'c1')), L(bx2, by2, bx2, by2 - 40, 'c1', 1.25, A(id, 'c1')),
      L(ax + 4, ay + 1, bx2 - 6, by2 - 1, 'axis', 1.25, 'stroke-dasharray="4 4" ' + A(id, 'axis')),
      L(ax, ay, px - 6, py + 4, 'ink', 2, A(id, 'ink')), L(bx2, by2, px - 3, py + 7, 'c1', 2, A(id, 'c1')),
      C(px, py, 5, 'f-ink', 0), T(px + 10, py - 6, '점 P', { c: 'b' }),
      T(ax - 6, ay + 20, '원점 A', { a: 'middle' }), T(bx2, by2 + 20, '원점 B', { a: 'middle' }),
      T(164, 150, 'A에서 본 P', { a: 'end' }), T(292, 190, 'B에서 본 P'), T(140, 264, '원점 사이', { a: 'middle', c: 'q', s: 12 }),
      L(16, 290, 464, 290, 'grid', 1),
      T(16, 318, '(나) 축만 돌리면 화살표는 같고 숫자만 바뀐다', { c: 'b' }),
      L(ox, oy, ox + 190, oy, 'axis', 1.25, A(id, 'axis')), L(ox, oy, ox, oy - 160, 'axis', 1.25, A(id, 'axis')),
      L(ox, oy, ox + 190 * c, oy - 190 * sn, 'c1', 1.5, A(id, 'c1')), L(ox, oy, ox - 150 * sn, oy - 150 * c, 'c1', 1.5, A(id, 'c1')),
      L(Pp[0], Pp[1], Pp[0], oy, 'axis', 1, 'stroke-dasharray="3 3"'), L(Pp[0], Pp[1], ox, Pp[1], 'axis', 1, 'stroke-dasharray="3 3"'),
      L(Pp[0], Pp[1], fxb[0], fxb[1], 'c1', 1, 'stroke-dasharray="3 3"'), L(Pp[0], Pp[1], fyb[0], fyb[1], 'c1', 1, 'stroke-dasharray="3 3"'),
      L(ox, oy, Pp[0] - 3, Pp[1] + 5, 'c2', 2.5, A(id, 'c2')), C(Pp[0], Pp[1], 5, 'f-ink', 0), T(Pp[0] + 10, Pp[1] - 6, '점 P', { c: 'b' }),
      T(ox + 196, oy + 5, 'x<tspan baseline-shift="sub" font-size="10">A</tspan>', { c: 'q', s: 13 }), T(ox + 6, oy - 164, 'y<tspan baseline-shift="sub" font-size="10">A</tspan>', { c: 'q', s: 13 }),
      T(ox + 196 * c, oy - 196 * sn, 'x<tspan baseline-shift="sub" font-size="10">B</tspan>', { c: 'b', s: 13 }), T(ox - 156 * sn - 10, oy - 156 * c - 6, 'y<tspan baseline-shift="sub" font-size="10">B</tspan>', { c: 'b', s: 13 }),
      T(ox + 54, oy - 10, '30°', { c: 'q', s: 12 }),
      T(316, 420, 'A의 축으로 재면 (2, 3)', { s: 13 }), T(316, 442, 'B의 축으로 재면 (3.2, 1.6)', { c: 'b', s: 13 }), T(316, 464, '같은 화살표, 다른 숫자', { c: 'q', s: 11.5 }),
    ].join(''), '벡터는 원점과 축을 정해야 숫자가 된다');
  };

  const sub = (v, k) => `${v}<tspan baseline-shift="sub" font-size="10">${k}</tspan>`;
  const matrix2 = (a, b, c, d, cls = ['c1', 'c2']) => `<table class="mat"><tr><td class="${cls[0]}">${a}</td><td class="${cls[1]}">${b}</td></tr><tr><td class="${cls[0]}">${c}</td><td class="${cls[1]}">${d}</td></tr></table>`;

  // 그림 2-6 평면 회전행렬 (슬라이더)
  FIG.fig2_6 = el => interactive(el, {
    state: { t: 30 },
    sliders: [{ key: 't', label: '돌린 각도 θ', min: -180, max: 180, unit: '°' }],
    draw: ({ t }) => {
      const id = 'f26', r = t * D, c = Math.cos(r), sn = Math.sin(r), u = 60, ox = 200, oy = 236, S = (x, y) => [ox + u * x, oy - u * y];
      const XB = S(c, sn), YB = S(-sn, c), M = S(2 * c, 2 * sn), Pp = S(2 * c - sn, 2 * sn + c);
      const e1 = S(-2.6 * c, -2.6 * sn), e2 = S(2.6 * c, 2.6 * sn), e3 = S(2.6 * sn, -2.6 * c), e4 = S(-2.6 * sn, 2.6 * c);
      return svg(id, [40, 362], [
        L(40, oy, 440, oy, 'axis', 1.25, A(id, 'axis')), L(ox, 396, ox, 48, 'axis', 1.25, A(id, 'axis')),
        T(444, oy + 18, sub('x', 'A'), { c: 'q', s: 13 }), T(ox + 10, 56, sub('y', 'A'), { c: 'q', s: 13 }),
        `<circle cx="${ox}" cy="${oy}" r="${u}" fill="none" class="s-grid" stroke-dasharray="3 4"/>`,
        L(e1[0], e1[1], e2[0], e2[1], 'c1', 1, 'stroke-opacity="0.35"'), L(e3[0], e3[1], e4[0], e4[1], 'c2', 1, 'stroke-opacity="0.35"'),
        L(XB[0], XB[1], XB[0], oy, 'axis', 1, 'stroke-dasharray="3 3"'), L(XB[0], XB[1], ox, XB[1], 'axis', 1, 'stroke-dasharray="3 3"'),
        T((ox + XB[0]) / 2, oy + 18, 'cos θ', { a: 'middle', s: 12.5 }), T(XB[0] + 8, (oy + XB[1]) / 2 + 4, 'sin θ', { s: 12.5 }),
        arc(ox, oy, 26, 0, r, 'c1', 1.25), T(ox + 40 * Math.cos(r / 2), oy - 40 * Math.sin(r / 2) + 5, 'θ', { a: 'middle', c: 'b', s: 13 }),
        L(ox, oy, M[0], M[1], 'c1', 1.5, 'stroke-dasharray="5 4"'), L(M[0], M[1], Pp[0], Pp[1], 'c2', 1.5, 'stroke-dasharray="5 4"'),
        L(ox, oy, XB[0], XB[1], 'c1', 2.5, A(id, 'c1')), L(ox, oy, YB[0], YB[1], 'c2', 2.5, A(id, 'c2')),
        T(ox + u * 1.2 * c - 16 * sn, oy - u * 1.2 * sn - 16 * c + 5, sub('x', 'B'), { a: 'middle', c: 'b', s: 13 }),
        T(ox - u * 1.2 * sn - 16 * c, oy - u * 1.2 * c + 16 * sn + 5, sub('y', 'B'), { a: 'middle', c: 'b', s: 13 }),
        C(Pp[0], Pp[1], 6, 'f-ink', 0), T(Pp[0] + 10, Pp[1] - 8, 'P', { c: 'b' }),
      ].join(''), '돌린 축을 원래 축으로 적으면 cos와 sin이 나온다');
    },
    readout: ({ t }) => {
      const c = Math.cos(t * D), s = Math.sin(t * D);
      return `<div class="matrow"><b>회전행렬 R</b> = ${matrix2(f2(c), f2(-s), f2(s), f2(c))}<span class="q">왼쪽 열 = x<sub>B</sub>, 오른쪽 열 = y<sub>B</sub></span></div>` +
        `<div>B의 숫자 (2, 1) → A의 숫자 = 2 × (${f2(c)}, ${f2(s)}) + 1 × (${f2(-s)}, ${f2(c)}) = <b>(${f2(2 * c - s)}, ${f2(2 * s + c)})</b></div>`;
    },
  });

  // 그림 2-7 x축으로 90° 돌린 좌표계
  FIG.fig2_7 = el => {
    const id = 'f27', Lh = 80, kx = -0.866, ky = 0.5, ax = 120, ay = 186, bx = 352, by = 186;
    const tip = (ox, oy, dx, dy, k) => [ox + k * dx, oy + k * dy];
    const XA = tip(ax, ay, kx, ky, Lh), YA = tip(ax, ay, -kx, ky, Lh), ZA = tip(ax, ay, 0, -1, Lh);
    const fX = tip(bx, by, kx, ky, Lh), fY = tip(bx, by, -kx, ky, Lh), fZ = tip(bx, by, 0, -1, Lh), nY = tip(bx, by, kx, -ky, Lh), mid = tip(bx, by, kx, ky, 44);
    el.innerHTML += svg(id, [40, 270], [
      T(ax, 58, '좌표계 A', { a: 'middle', c: 'b' }),
      L(ax, ay, XA[0], XA[1], 'axis', 1.75, A(id, 'axis')), L(ax, ay, YA[0], YA[1], 'axis', 1.75, A(id, 'axis')), L(ax, ay, ZA[0], ZA[1], 'axis', 1.75, A(id, 'axis')),
      T(XA[0] - 6, XA[1] + 16, sub('x', 'A'), { a: 'middle', s: 13 }), T(YA[0] + 6, YA[1] + 16, sub('y', 'A'), { a: 'middle', s: 13 }), T(ZA[0] + 8, ZA[1] + 4, sub('z', 'A'), { s: 13 }),
      T(ax, 290, '오른손: 엄지 x, 검지 y, 중지 z', { a: 'middle', c: 'q', s: 12 }),
      L(238, 44, 238, 300, 'grid', 1),
      T(bx, 58, '좌표계 B: A를 x축으로 90° 돌린 것', { a: 'middle', c: 'b' }),
      L(bx, by, fY[0], fY[1], 'grid', 1, 'stroke-dasharray="3 3"'),
      L(bx, by, fX[0], fX[1], 'c1', 2.5, A(id, 'c1')), L(bx, by, fZ[0], fZ[1], 'c1', 2.5, A(id, 'c1')), L(bx, by, nY[0], nY[1], 'c1', 2.5, A(id, 'c1')),
      `<path d="M${mid[0] - 10} ${mid[1] - 14} A12 7 30 1 1 ${mid[0] + 12} ${mid[1] + 4}" fill="none" class="s-axis" stroke-width="1.25" ${A(id, 'axis')}/>`,
      T(fX[0] - 6, fX[1] + 16, sub('x', 'B'), { a: 'middle', c: 'b', s: 13 }), T(fZ[0] + 8, fZ[1] + 4, sub('y', 'B'), { c: 'b', s: 13 }), T(nY[0] - 8, nY[1] - 4, sub('z', 'B'), { a: 'end', c: 'b', s: 13 }),
      T(fY[0] + 6, fY[1] + 16, sub('y', 'A') + ' 방향', { a: 'middle', c: 'q', s: 12 }),
      T(262, 256, sub('x', 'B') + ' → A로 (1, 0, 0)', { s: 13 }), T(262, 274, sub('y', 'B') + ' → A로 (0, 0, 1)', { s: 13 }), T(262, 292, sub('z', 'B') + ' → A로 (0, −1, 0)', { s: 13 }),
    ].join(''), 'B의 축을 A로 적으면 회전행렬의 세 열이 된다');
  };

  // 그림 2-8 내적과 cos
  FIG.fig2_8 = el => {
    const id = 'f28', ox = 70, oy = 168, u = 150, t = 40 * D, tx = ox + u * Math.cos(t), ty = oy - u * Math.sin(t);
    el.innerHTML += svg(id, [40, 166], [
      L(ox, oy, 300, oy, 'axis', 1.75, A(id, 'axis')), L(ox, oy, tx, ty, 'c1', 2.5, A(id, 'c1')),
      L(tx, ty, tx, oy, 'axis', 1, 'stroke-dasharray="3 3"'), L(ox, oy + 1, tx, oy + 1, 'c2', 5, 'stroke-opacity="0.6"'),
      arc(ox, oy, 34, 0, t, 'axis', 1), T(ox + 46, oy - 12, 'θ', { s: 13 }),
      T(306, oy + 5, 'A의 축 (길이 1)', { s: 13 }), T(tx + 8, ty - 4, 'B의 축 (길이 1)', { c: 'b', s: 13 }),
      T((ox + tx) / 2, oy + 24, '그림자 = cos θ', { a: 'middle', c: 'b', s: 13 }),
      T(306, 110, '두 축이 같으면 1', { c: 'q', s: 12 }), T(306, 128, '수직이면 0', { c: 'q', s: 12 }), T(306, 146, '반대면 −1', { c: 'q', s: 12 }),
    ].join(''), '단위벡터의 내적은 그림자 길이 cos θ다');
  };

  // 그림 2-9 전치행렬 (슬라이더)
  FIG.fig2_9 = el => interactive(el, {
    state: { t: 30 },
    sliders: [{ key: 't', label: 'B를 돌린 각도 θ', min: 0, max: 75, unit: '°' }],
    draw: ({ t }) => {
      const id = 'f29', c = Math.cos(t * D), s = Math.sin(t * D), u = 50, ox = 180, oy = 330, S = (x, y) => [ox + u * x, oy - u * y];
      const P = S(2, 3), b1 = 2 * c + 3 * s, b2 = -2 * s + 3 * c, F1 = [ox + u * b1 * c, oy - u * b1 * s], F2 = [ox - u * b2 * s, oy - u * b2 * c], XB = S(5 * c, 5 * s), YB = S(-3.6 * s, 3.6 * c);
      return svg(id, [40, 320], [
        L(ox, oy, 460, oy, 'axis', 1.25, A(id, 'axis')), L(ox, oy, ox, 48, 'axis', 1.25, A(id, 'axis')),
        T(452, oy + 18, sub('x', 'A'), { a: 'end', c: 'q', s: 13 }), T(ox + 8, 56, sub('y', 'A'), { c: 'q', s: 13 }),
        L(ox, oy, XB[0], XB[1], 'c1', 2, A(id, 'c1')), L(ox, oy, YB[0], YB[1], 'c2', 2, A(id, 'c2')),
        T(XB[0] + 4, XB[1] - 8, sub('x', 'B'), { c: 'b', s: 13 }), T(YB[0] - 6, YB[1] - 6, sub('y', 'B'), { a: 'end', c: 'b', s: 13 }),
        L(P[0], P[1], P[0], oy, 'axis', 1, 'stroke-dasharray="2 4"'), L(P[0], P[1], ox, P[1], 'axis', 1, 'stroke-dasharray="2 4"'),
        L(P[0], P[1], F1[0], F1[1], 'c1', 1.25, 'stroke-dasharray="4 3"'), L(P[0], P[1], F2[0], F2[1], 'c2', 1.25, 'stroke-dasharray="4 3"'),
        C(F1[0], F1[1], 4, 'f-c1', 0), C(F2[0], F2[1], 4, 'f-c2', 0),
        T(F1[0] + 8, F1[1] + 18, f2(b1), { c: 'b', s: 13 }), T(F2[0] - 8, F2[1] + 4, f2(b2), { a: 'end', c: 'b', s: 13 }),
        C(P[0], P[1], 6, 'f-ink', 0), T(P[0] + 10, P[1] - 8, 'P = A에서 (2, 3)', { c: 'b', s: 13 }),
        T(P[0], oy + 18, '2', { a: 'middle', c: 'q', s: 12 }), T(ox - 8, P[1] + 4, '3', { a: 'end', c: 'q', s: 12 }),
      ].join(''), '같은 점을 돌린 축으로 다시 잰다');
    },
    readout: ({ t }) => {
      const c = Math.cos(t * D), s = Math.sin(t * D);
      return `<div class="matrow"><b>R<sup>T</sup></b> = <table class="mat"><tr><td class="c1">${f2(c)}</td><td class="c1">${f2(s)}</td></tr><tr><td class="c2">${f2(-s)}</td><td class="c2">${f2(c)}</td></tr></table><span class="q">윗줄 = x<sub>B</sub>, 아랫줄 = y<sub>B</sub></span></div>` +
        `<div>B의 숫자 = R<sup>T</sup> × (2, 3) = <b>(${f2(2 * c + 3 * s)}, ${f2(-2 * s + 3 * c)})</b></div>`;
    },
  });

  // 그림 2-10 동차변환: 카메라 → 팔 받침 (슬라이더)
  FIG.fig2_10 = el => interactive(el, {
    state: { t: 90, a: 2 },
    sliders: [{ key: 't', label: '카메라 방향 θ', min: 0, max: 180, unit: '°' }, { key: 'a', label: '카메라 앞 거리', min: 1, max: 9, step: 0.5, unit: ' cm' }],
    draw: ({ t, a }) => {
      const id = 'f210', c = Math.cos(t * D), s = Math.sin(t * D), u = 20, ox = 50, oy = 340, S = (x, y) => [ox + u * x, oy - u * y];
      const Co = S(10, 5), Cup = S(a * c + 10, a * s + 5), cx = S(10 + 2.2 * c, 5 + 2.2 * s), cy = S(10 - 2.2 * s, 5 + 2.2 * c);
      return svg(id, [36, 336], [
        [100, 200, 300].map(v => L(ox + v, 44, ox + v, oy, 'grid', 1)).join(''), [100, 200].map(v => L(ox, oy - v, 460, oy - v, 'grid', 1)).join(''),
        L(ox, oy, 462, oy, 'axis', 1.5, A(id, 'axis')), L(ox, oy, ox, 44, 'axis', 1.5, A(id, 'axis')),
        `<rect x="${ox - 14}" y="${oy - 14}" width="28" height="28" rx="4" class="f-tint s-axis" stroke-width="1.25"/>`,
        T(ox + 6, oy + 26, '팔 받침 (0)', { c: 'q', s: 12 }), T(458, oy - 8, sub('x', '0'), { a: 'end', c: 'q', s: 12 }), T(ox + 8, 54, sub('y', '0'), { c: 'q', s: 12 }),
        T(ox + 100, oy + 16, '5', { a: 'middle', c: 'q', s: 11.5 }), T(ox + 200, oy + 16, '10 cm', { a: 'middle', c: 'q', s: 11.5 }), T(ox + 300, oy + 16, '15', { a: 'middle', c: 'q', s: 11.5 }),
        L(ox + 6, oy - 3, Co[0] - 6, Co[1] + 3, 'axis', 1.5, 'stroke-dasharray="5 4" ' + A(id, 'axis')),
        L(Co[0], Co[1], Cup[0], Cup[1], 'c1', 2.5, A(id, 'c1')), L(ox, oy, Cup[0], Cup[1], 'c2', 2.5, A(id, 'c2')),
        L(Co[0], Co[1], cx[0], cx[1], 'c1', 1.25, A(id, 'c1')), L(Co[0], Co[1], cy[0], cy[1], 'c1', 1.25, A(id, 'c1')),
        `<rect x="${Co[0] - 9}" y="${Co[1] - 7}" width="18" height="14" rx="3" class="f-c1 s-c1" fill-opacity="0.3" stroke-width="1.5"/>`,
        T(Co[0] + 12, Co[1] + 20, '카메라 (C)', { c: 'b', s: 12 }),
        C(Cup[0], Cup[1], 9, 'f-tint s-ink'), T(Cup[0] + 14, Cup[1] - 8, '컵', { c: 'b' }),
      ].join(''), '카메라가 본 컵을 팔 받침 기준으로 바꾼다');
    },
    readout: ({ t, a }) => {
      const c = Math.cos(t * D), s = Math.sin(t * D), Rx = a * c, Ry = a * s;
      return `<div>① 카메라가 본 컵: <b>(${f1(a)}, 0)</b> cm <span class="q">(카메라 기준)</span></div>` +
        `<div>② 받침 방향으로 돌리기: R × (${f1(a)}, 0) = <b class="c1">(${f2(Rx)}, ${f2(Ry)})</b></div>` +
        `<div>③ 카메라 위치 (10, 5)를 더하기: <b class="c2">(${f2(Rx + 10)}, ${f2(Ry + 5)})</b> cm <span class="q">(받침 기준)</span></div>`;
    },
  });

  // 그림 2-11 매핑과 연산자
  FIG.fig2_11 = el => {
    const id = 'f211', a = 35 * D, o1x = 120, o1y = 214, o2x = 120, o2y = 446, u = 60, P1 = [o2x + 2 * u, o2y - u], P2 = [o2x + u, o2y - 2 * u], rr = Math.sqrt(5) * u;
    el.innerHTML += svg(id, [36, 440], [
      T(16, 54, '(가) 매핑: 보는 좌표계가 바뀐다', { c: 'b' }),
      L(o1x, o1y, 300, o1y, 'axis', 1.5, A(id, 'axis')), L(o1x, o1y, o1x, 74, 'axis', 1.5, A(id, 'axis')),
      L(o1x, o1y, o1x + 170 * Math.cos(a), o1y - 170 * Math.sin(a), 'c1', 2, A(id, 'c1')), L(o1x, o1y, o1x - 120 * Math.sin(a), o1y - 120 * Math.cos(a), 'c1', 2, A(id, 'c1')),
      T(296, o1y + 18, 'A의 축', { a: 'end', c: 'q', s: 12 }), T(o1x + 176 * Math.cos(a), o1y - 176 * Math.sin(a), 'B의 축', { c: 'b', s: 12 }),
      C(236, 96, 6, 'f-ink', 0), T(246, 90, '점 P', { c: 'b' }),
      T(316, 150, '점은 그대로다.', { s: 12.5 }), T(316, 170, 'A의 숫자로도,', { s: 12.5 }), T(316, 190, 'B의 숫자로도 적는다.', { s: 12.5 }),
      L(16, 250, 464, 250, 'grid', 1),
      T(16, 282, '(나) 연산자: 점이 움직인다', { c: 'b' }),
      L(o2x, o2y, 300, o2y, 'axis', 1.5, A(id, 'axis')), L(o2x, o2y, o2x, 300, 'axis', 1.5, A(id, 'axis')),
      T(296, o2y + 18, 'y', { a: 'end', c: 'q', s: 12 }), T(o2x + 8, 308, 'z', { c: 'q', s: 12 }),
      L(o2x, o2y, P1[0], P1[1], 'axis', 1.5, 'stroke-dasharray="4 4"'), L(o2x, o2y, P2[0], P2[1], 'c2', 1.5, 'stroke-dasharray="4 4"'),
      `<path d="M${P1[0] + 4} ${P1[1] - 14} A${rr} ${rr} 0 0 0 ${P2[0] + 14} ${P2[1] + 2}" fill="none" class="s-c2" stroke-width="2" ${A(id, 'c2')}/>`,
      C(P1[0], P1[1], 6, 'f-none s-ink'), C(P2[0], P2[1], 6, 'f-c2', 0),
      T(P1[0] + 12, P1[1] + 5, 'P₁ = (2, 1)'), T(P2[0], P2[1] - 14, 'P₂ = (1, 2)', { a: 'middle', c: 'b' }),
      T(316, 370, '좌표계는 하나다.', { s: 12.5 }), T(316, 390, 'R을 곱하면', { s: 12.5 }), T(316, 410, '점이 돌아간다.', { s: 12.5 }),
    ].join(''), '같은 행렬을 두 가지로 읽는다');
  };

  // 장별 그림 파일(assets/figs/chN.js)이 이 도구를 꺼내 쓴다.
  window.FIG = Object.assign(window.FIG || {}, FIG);
  window.FigKit = {
    D, f1, f2, defs, svg, T, L, A, AA, C, joint, link, arc, annulus, interactive, sub, matrix2,
    renderAll() {
      document.querySelectorAll('figure[data-fig]').forEach(el => {
        const f = window.FIG[el.dataset.fig], body = el.querySelector('.fig-body');
        if (!f) { body.textContent = '그림을 찾을 수 없음: ' + el.dataset.fig; return; }
        try { f(body); } catch (e) { body.textContent = '그림 오류: ' + e.message; console.error(e); }
      });
    },
  };
})();
