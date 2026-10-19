// 9장 그림: 카메라가 주는 숫자, 핀홀 카메라, 스테레오 깊이와 오차, 짝 찾기, 시차 지도, 특징점, 추적
(function () {
  const { D, f1, svg, T, L, A, AA, C, interactive, sub } = FigKit;
  const FIG = window.FIG;

  // 컵 (앞에서 본 모양): 가운데 x, 바닥 y, 위 폭 w, 높이 h
  const cupFront = (cx, by, w, h, cls = 'f-none s-ink', sw = 1.5) => {
    const t = by - h, wb = w * 0.8;
    return `<path d="M${cx - w / 2} ${t}L${cx - wb / 2} ${by}L${cx + wb / 2} ${by}L${cx + w / 2} ${t}Z" class="${cls}" stroke-width="${sw}" stroke-linejoin="round"/>` +
      `<ellipse cx="${cx}" cy="${t}" rx="${w / 2}" ry="${Math.max(1, w * 0.13)}" class="${cls}" stroke-width="${sw}"/>`;
  };
  const rect = (x, y, w, h, cls, sw = 1.25, more = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}" stroke-width="${sw}" ${more}/>`;
  const poly = (pts, cls, sw = 1.25, more = '') => `<path d="M${pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L')}Z" class="${cls}" stroke-width="${sw}" ${more}/>`;

  // 그림 9-1 카메라가 주는 것: 숫자 격자
  FIG.fig9_1 = el => {
    const id = 'f91', fx = 30, fy = 92, fw = 192, fh = 144, gx = 262, gy = 76, cs = 30;
    const vals = [
      [214, 216, 152, 93, 90, 91],
      [213, 217, 149, 92, 89, 90],
      [215, 214, 155, 90, 91, 88],
      [212, 216, 151, 91, 92, 90],
      [214, 213, 150, 93, 88, 89],
      [216, 215, 153, 90, 90, 92],
    ];
    const ccx = 112, cby = 216, cw = 64, ch = 82, ct = cby - ch;
    const zx = 132, zy = 140, zs = 22;
    const cells = [];
    vals.forEach((row, i) => row.forEach((v, j) => {
      const x = gx + j * cs, y = gy + i * cs;
      cells.push(rect(x, y, cs, cs, (j < 2 ? 'f-tint' : 'f-none') + ' s-grid', 1));
      cells.push(T(x + cs / 2, y + cs / 2 + 5, v, { a: 'middle', s: 13 }));
    }));
    el.innerHTML += svg(id, [36, 270], [
      T(16, 56, '(가) 사람이 보는 것', { c: 'b' }), T(250, 56, '(나) 카메라가 주는 것', { c: 'b' }),
      // 영상 틀과 픽셀 좌표
      rect(fx, fy + 106, fw, fh - 106, 'f-tint s-none', 0),
      L(fx, fy + 106, fx + fw, fy + 106, 'axis', 1),
      `<path d="M${ccx - cw / 2 + 2} ${ct + 18}C${ccx - cw / 2 - 24} ${ct + 18} ${ccx - cw / 2 - 24} ${ct + 54} ${ccx - cw / 2 + 6} ${ct + 56}" fill="none" class="s-ink" stroke-width="1.5"/>`,
      cupFront(ccx, cby, cw, ch, 'f-none s-ink', 1.5),
      rect(fx, fy, fw, fh, 'f-none s-axis', 1.5),
      L(fx, fy - 10, fx + 92, fy - 10, 'ink', 1.25, A(id, 'ink')), T(fx + 100, fy - 5, 'u', { c: 'b', s: 13 }),
      L(fx - 10, fy, fx - 10, fy + 70, 'ink', 1.25, A(id, 'ink')), T(fx - 10, fy + 88, 'v', { a: 'middle', c: 'b', s: 13 }),
      T(fx - 4, fy - 18, '(0, 0)', { c: 'q', s: 12.5 }),
      T(fx + fw, fy + fh + 18, '(639, 479)', { a: 'end', c: 'q', s: 12.5 }),
      T(fx + fw / 2, fy + fh + 40, '640 × 480 = 숫자 307,200개', { a: 'middle', s: 12.5 }),
      // 확대
      rect(zx, zy, zs, zs, 'f-none s-c1', 2),
      L(zx + zs, zy, gx, gy, 'c1', 1, 'stroke-dasharray="3 3"'), L(zx + zs, zy + zs, gx, gy + 6 * cs, 'c1', 1, 'stroke-dasharray="3 3"'),
      cells.join(''),
      rect(gx, gy, 6 * cs, 6 * cs, 'f-none s-c1', 2),
      L(gx + 2.5 * cs, gy - 4, gx + 2.5 * cs, gy + 6 * cs + 4, 'c1', 1.5, 'stroke-dasharray="4 3"'),
      T(gx + cs, gy + 6 * cs + 20, '컵', { a: 'middle', s: 12.5 }), T(gx + 2.5 * cs, gy + 6 * cs + 20, '모서리', { a: 'middle', c: 'f-c1 b', s: 12.5 }), T(gx + 4.5 * cs, gy + 6 * cs + 20, '벽', { a: 'middle', s: 12.5 }),
      T(gx + 3 * cs, gy + 6 * cs + 42, '숫자 = 밝기 (0 검정 ~ 255 흰색)', { a: 'middle', c: 'q', s: 12.5 }),
    ].join(''), '사람은 컵을 보지만 카메라는 밝기 숫자 격자를 준다');
  };

  // 그림 9-2 핀홀 카메라 (슬라이더)
  FIG.fig9_2 = el => interactive(el, {
    state: { Z: 50, f: 500 },
    sliders: [
      { key: 'Z', label: '컵까지 거리 Z', min: 20, max: 100, step: 1, unit: ' cm' },
      { key: 'f', label: '초점 거리 f', min: 200, max: 1000, step: 10, unit: ' px' },
    ],
    draw: ({ Z, f }) => {
      const id = 'f92', ay = 146, px0 = 150, k = 0.12, s = 2.8, H = 10, W = 8;
      const Fd = k * f, half = k * 240, slope = H / Z;
      const hpx = f * H / Z, wpx = f * W / Z;
      const cx = px0 + s * Z, ctop = ay - s * H, cd = s * W;
      const back = Math.min(Fd, half / slope), over = hpx > 240;
      const img = Math.min(Fd * slope, half);
      // 찍힌 영상 (0.3배)
      const vs = 0.3, vx = 180, vy = 236, vw = 640 * vs, vh = 480 * vs, vcx = vx + vw / 2, vcy = vy + vh / 2;
      const ih = hpx * vs, iw = wpx * vs, shown = Math.min(ih, vh / 2);
      return svg(id, [84, 300], [
        // 광축
        L(px0 - Fd - 8, ay, 466, ay, 'axis', 1, 'stroke-dasharray="5 4"'),
        T(px0 + 8, ay + 18, '바늘구멍', { s: 12.5 }), T(px0 + 86, ay + 18, '광축', { c: 'q', s: 12.5 }),
        // 상자 카메라: 앞면에 구멍, 뒷면이 센서
        L(px0 - Fd, ay - half, px0, ay - half, 'ink', 1.5), L(px0 - Fd, ay + half, px0, ay + half, 'ink', 1.5),
        L(px0, ay - half, px0, ay - 3, 'ink', 1.5), L(px0, ay + 3, px0, ay + half, 'ink', 1.5),
        L(px0 - Fd, ay - half, px0 - Fd, ay + half, 'c1', 3.5),
        L(px0 - Fd, ay - half - 9, px0, ay - half - 9, 'axis', 1.25, AA(id, 'axis')), T(px0 - Fd / 2, ay - half - 15, 'f', { a: 'middle', c: 'b', s: 13 }),
        // 컵 (옆에서 본 모양)
        `<path d="M${cx} ${ctop}L${cx + 2} ${ay}L${cx + cd - 2} ${ay}L${cx + cd} ${ctop}Z" class="f-tint s-ink" stroke-width="1.5" stroke-linejoin="round"/>`,
        T(cx + cd / 2, ctop - 9, '10 cm', { a: 'middle', c: 'q', s: 12.5 }),
        // 광선: 컵 꼭대기 → 구멍 → 센서
        L(cx, ctop, px0, ay, 'c2', 1.5), L(px0, ay, px0 - back, ay + back * slope, 'c2', 1.5),
        L(px0 - Fd, ay, px0 - Fd, ay + img, 'c2', 3.5, 'stroke-linecap="round"'),
        T(px0 - Fd - 7, ay + img / 2 + 5, 'h', { a: 'end', c: 'b', s: 13 }),
        // 거리 Z
        L(px0 + 2, ay + 38, cx - 2, ay + 38, 'axis', 1.25, AA(id, 'axis')),
        T((px0 + cx) / 2, ay + 56, 'Z = ' + Z + ' cm', { a: 'middle', c: 'b', s: 13 }),
        // 찍힌 영상
        `<clipPath id="${id}-clip"><rect x="${vx}" y="${vy}" width="${vw}" height="${vh}"/></clipPath>`,
        rect(vx, vy, vw, vh, 'f-none s-axis', 1.5),
        L(vx, vcy, vx + vw, vcy, 'grid', 1), L(vcx, vy, vcx, vy + vh, 'grid', 1),
        `<g clip-path="url(#${id}-clip)">${cupFront(vcx, vcy, iw, ih, 'f-tint s-ink', 1.25)}</g>`,
        T(vx - 10, vcy - 4, '찍힌 영상', { a: 'end', c: 'b', s: 13 }), T(vx - 10, vcy + 14, '640 × 480', { a: 'end', c: 'q', s: 12.5 }),
        L(vx + vw + 12, vcy, vx + vw + 12, vcy - shown, 'c2', 1.5, shown > 12 ? AA(id, 'c2') : ''),
        T(vx + vw + 20, vcy - shown / 2 + 5, 'h', { c: 'b', s: 13 }),
        over ? T(vcx, vy - 8, '컵 위쪽이 화면 밖', { a: 'middle', c: 'f-c2 b', s: 12.5 }) : '',
      ].join(''), '바늘구멍을 지난 빛이 뒷면에 거꾸로 상을 맺는다. 멀수록 상이 작다');
    },
    readout: ({ Z, f }) => {
      const h = f * 10 / Z, fov = 2 * Math.atan(240 / f) / D;
      return `<div><b>영상 속 컵 높이</b> h = f × H ÷ Z = ${f} × 10 ÷ ${Z} = <b>${f1(h)} 픽셀</b></div>` +
        `<div><span class="q">화면 세로(480 픽셀)의 ${Math.round(h / 480 * 100)}% · 세로 시야각 ${f1(fov)}°</span></div>` +
        (h > 240 ? `<div><b class="c2">컵 위쪽이 화면 밖으로 나갔다.</b> 컵 바닥이 화면 가운데라 h가 240 픽셀을 넘으면 잘린다.</div>` : '');
    },
  });

  // 그림 9-3 카메라 좌표계 {C}와 원근 투영
  FIG.fig9_3 = el => {
    const id = 'f93', ox = 84, oy = 262, u = 70, za = 86.6, zb = 50;
    const P3 = ([X, Y, Z]) => [ox + u * X + za * Z, oy + u * Y - zb * Z];
    const pw = 0.8, ph = 0.5, Pw = [1, -1, 2.8], pp = [Pw[0] / Pw[2], Pw[1] / Pw[2], 1];
    const plane = [[-pw, -ph, 1], [pw, -ph, 1], [pw, ph, 1], [-pw, ph, 1]].map(P3);
    const O = P3([0, 0, 0]), Pc = P3(Pw), pc = P3(pp), cen = P3([0, 0, 1]), Az = P3([0, 0, Pw[2]]), zEnd = P3([0, 0, 3]);
    el.innerHTML += svg(id, [28, 306], [
      poly(plane, 'f-c1 s-c1', 1.5, 'fill-opacity="0.08"'),
      L(O[0], O[1], zEnd[0], zEnd[1], 'ink', 1.5, A(id, 'ink')),
      L(O[0], O[1], O[0] + 62, O[1], 'ink', 1.5, A(id, 'ink')), L(O[0], O[1], O[0], O[1] + 60, 'ink', 1.5, A(id, 'ink')),
      T(O[0] + 68, O[1] + 5, sub('x', 'C'), { c: 'b', s: 13 }), T(O[0] + 8, O[1] + 62, sub('y', 'C'), { c: 'b', s: 13 }),
      T(zEnd[0] + 6, zEnd[1] + 18, sub('z', 'C') + ' (광축)', { c: 'b', s: 13 }),
      T(O[0] - 8, O[1] + 5, 'O', { a: 'end', c: 'b', s: 13 }),
      // 같은 모양의 두 어긋남: 영상면에서 (u, v), 깊이 Z에서 (X, Y)
      L(cen[0], cen[1], pc[0], pc[1], 'c2', 1.25, 'stroke-dasharray="3 3"'),
      L(Az[0], Az[1], Pc[0], Pc[1], 'c2', 1.25, 'stroke-dasharray="3 3"'),
      L(O[0], O[1], Pc[0], Pc[1], 'c2', 2),
      C(cen[0], cen[1], 3.5, 'f-ink', 0), C(Az[0], Az[1], 3, 'f-axis', 0),
      C(pc[0], pc[1], 5, 'f-c2', 0), C(Pc[0], Pc[1], 6, 'f-c2', 0), C(O[0], O[1], 4, 'f-ink', 0),
      T(Pc[0] - 10, Pc[1] - 6, 'P = (X, Y, Z)', { a: 'end', c: 'b', s: 13 }),
      T(pc[0] + 2, pc[1] - 17, 'p = (u, v)', { a: 'end', c: 'b', s: 13 }),
      T(cen[0] + 8, cen[1] + 18, '중심', { c: 'q', s: 12.5 }),
      T(plane[2][0] + 8, plane[2][1] - 10, '영상면 (Z = f)', { c: 'f-c1 b', s: 13 }),
    ].join(''), '카메라 좌표계와 원근 투영: 점 P와 바늘구멍을 잇는 선이 영상면과 만나는 곳이 p다');
  };

  // 그림 9-4 스테레오 (슬라이더)
  FIG.fig9_4 = el => interactive(el, {
    state: { b: 6, Z: 50 },
    sliders: [
      { key: 'b', label: '기선 b', min: 4, max: 30, step: 1, unit: ' cm' },
      { key: 'Z', label: '점까지 깊이 Z', min: 20, max: 300, step: 5, unit: ' cm' },
    ],
    draw: ({ b, Z }) => {
      const id = 'f94', f = 500, sx = 6, sz = 0.85, cx = 240, cy = 300, rx = 44;
      const yZ = z => cy - sz * z;
      const xl = cx - sx * b / 2, xr = cx + sx * b / 2, Py = yZ(Z);
      const xL = f * (b / 2) / Z, xR = -xL, d = xL - xR, out = xL > 320;
      const Zn = f * b / (d + 1), Zf = Math.min(f * b / (d - 1), 316);
      const ticks = [0, 50, 100, 150, 200, 250, 300].map(z => L(rx - 4, yZ(z), rx + 4, yZ(z), 'axis', 1) + T(rx - 8, yZ(z) + 4, z, { a: 'end', c: 'q', s: 12.5 })).join('');
      const sc = 0.5, s0 = 262, yl = 346, yr = 400, sh = 22;
      const mL = s0 + sc * xL, mR = s0 + sc * xR, gap = mL - mR;
      const strip = (y, name, cls, m) => rect(s0 - 160, y, 320, sh, 'f-tint s-axis', 1.25) + L(s0, y, s0, y + sh, 'axis', 1, 'stroke-dasharray="2 3"') +
        T(s0 - 168, y + sh / 2 + 5, name, { a: 'end', c: 'b', s: 13 }) +
        (out ? T(s0, y + sh / 2 + 5, '점이 화면 밖', { a: 'middle', c: 'f-c2 b', s: 12.5 }) : C(m, y + sh / 2, 5.5, cls, 0));
      return svg(id, [12, 418], [
        L(rx, cy, rx, yZ(300) - 6, 'axis', 1.25), ticks, T(rx, yZ(300) - 14, 'Z (cm)', { a: 'middle', c: 'q', s: 12.5 }),
        L(rx + 6, Py, cx - 10, Py, 'axis', 1, 'stroke-dasharray="3 4"'),
        `<rect x="${cx - 5}" y="${yZ(Zf).toFixed(1)}" width="10" height="${(yZ(Zn) - yZ(Zf)).toFixed(1)}" rx="4" class="f-ink" fill-opacity="0.2"/>`,
        L(xl, cy, cx, Py, 'c1', 1.75), L(xr, cy, cx, Py, 'c2', 1.75),
        rect(xl - 8, cy - 5, 16, 10, 'f-c1 s-c1', 1.5, 'fill-opacity="0.3" rx="2"'), rect(xr - 8, cy - 5, 16, 10, 'f-c2 s-c2', 1.5, 'fill-opacity="0.3" rx="2"'),
        T(xl - 14, cy + 5, '왼쪽 카메라', { a: 'end', s: 12.5 }), T(xr + 14, cy + 5, '오른쪽 카메라', { s: 12.5 }),
        L(xl, cy + 16, xr, cy + 16, 'axis', 1.25, AA(id, 'axis')), T(cx, cy + 32, 'b = ' + b + ' cm', { a: 'middle', c: 'b', s: 13 }),
        C(cx, Py, 6, 'f-ink', 0), T(cx + 12, Py + 5, 'P', { c: 'b', s: 13 }),
        strip(yl, '왼쪽 영상', 'f-c1', mL), strip(yr, '오른쪽 영상', 'f-c2', mR),
        out ? '' : L(mL, yl, mL, yr + sh, 'c1', 1, 'stroke-dasharray="3 3"') + L(mR, yl, mR, yr + sh, 'c2', 1, 'stroke-dasharray="3 3"') +
          L(mR, yl + sh + 22, mL, yl + sh + 22, 'ink', 1.25, gap > 16 ? AA(id, 'ink') : '') +
          (mL + 92 < 474 ? T(mL + 8, yl + sh + 27, 'd = ' + f1(d) + ' px', { c: 'b', s: 13 }) : T(mR - 8, yl + sh + 27, 'd = ' + f1(d) + ' px', { a: 'end', c: 'b', s: 13 })),
      ].join(''), '두 카메라에서 본 점의 자리 차이가 시차 d이고, 시차가 깊이를 정한다');
    },
    readout: ({ b, Z }) => {
      const f = 500, xL = f * (b / 2) / Z, d = 2 * xL, Zn = f * b / (d + 1), Zf = f * b / (d - 1);
      const sg = v => (v > 0 ? '+' : '') + f1(v), e = v => (v < 0.1 ? v.toFixed(2) : f1(v));
      return `<div>왼쪽 영상 x<sub>L</sub> = ${sg(xL)} px · 오른쪽 영상 x<sub>R</sub> = ${sg(-xL)} px <span class="q">(영상 중심에서 잰 값, f = 500 px)</span></div>` +
        `<div><b>시차</b> d = x<sub>L</sub> − x<sub>R</sub> = <b>${f1(d)} px</b></div>` +
        `<div><b>깊이</b> Z = f b ÷ d = 500 × ${b} ÷ ${f1(d)} = <b>${f1(Z)} cm</b></div>` +
        `<div>시차를 1 px 틀리면 깊이는 <b>${f1(Zn)} ~ ${f1(Zf)} cm</b> <span class="q">(−${e(Z - Zn)} / +${e(Zf - Z)} cm, 그림의 회색 막대)</span></div>` +
        (xL > 320 ? `<div><b class="c2">점이 두 영상 밖으로 나갔다.</b> 기선이 길면 가까운 점을 두 카메라가 함께 보지 못한다.</div>` : '');
    },
  });

  // 그림 9-5 깊이 칸: 픽셀 경계선이 만드는 마름모
  FIG.fig9_5 = el => {
    const id = 'f95', xl = 200, xr = 280, by = 384, dl = 0.1, top = 52, base = xr - xl;
    const rays = [];
    for (let k = -12; k <= 12; k++) {
      rays.push(L(xl, by, xl + k * dl * (by - top), top, 'c1', 0.9, 'stroke-opacity="0.45"'));
      rays.push(L(xr, by, xr + k * dl * (by - top), top, 'c2', 0.9, 'stroke-opacity="0.45"'));
    }
    // 가운데 줄의 칸: 위 꼭짓점 n = 2k, 옆 꼭짓점 n = 2k + 1, 아래 꼭짓점 n = 2k + 2 (n = 두 픽셀 번호의 차)
    const zn = n => base / (n * dl);
    const cell = k => {
      const zt = zn(2 * k), zm = zn(2 * k + 1), zb = zn(2 * k + 2);
      const xa = xl + (k + 1) * dl * zm, xb = xl + k * dl * zm;
      return [[240, by - zt], [xa, by - zm], [240, by - zb], [xb, by - zm]];
    };
    const cells = [1, 2, 3, 4, 5, 6, 7, 8].map((k, i) => poly(cell(k), 'f-ink s-ink', 1, `fill-opacity="${i % 2 ? 0.32 : 0.12}" stroke-opacity="0.6"`)).join('');
    const c2 = cell(2), c6 = cell(6);
    el.innerHTML += svg(id, [44, 372], [
      `<clipPath id="${id}-clip"><rect x="104" y="${top}" width="272" height="${by - top}"/></clipPath>`,
      `<g clip-path="url(#${id}-clip)">${rays.join('')}${cells}</g>`,
      rect(xl - 9, by - 4, 18, 12, 'f-c1 s-c1', 1.5, 'fill-opacity="0.3" rx="2"'), rect(xr - 9, by - 4, 18, 12, 'f-c2 s-c2', 1.5, 'fill-opacity="0.3" rx="2"'),
      T(xl - 16, by + 8, '왼쪽 카메라', { a: 'end', s: 12.5 }), T(xr + 16, by + 8, '오른쪽 카메라', { s: 12.5 }),
      // 이름표
      L(c2[1][0] + 4, c2[1][1], 384, c2[1][1] - 14, 'ink', 1), T(388, c2[1][1] - 18, '먼 곳:', { c: 'b', s: 13 }), T(388, c2[1][1], '한 칸이 길다', { s: 12.5 }),
      L(c6[1][0] + 4, c6[1][1], 384, c6[1][1] - 26, 'ink', 1), T(388, c6[1][1] - 30, '가까운 곳:', { c: 'b', s: 13 }), T(388, c6[1][1] - 12, '한 칸이 얕다', { s: 12.5 }),
      T(16, 180, '선 하나가', { c: 'q', s: 12.5 }), T(16, 198, '픽셀 경계', { c: 'q', s: 12.5 }), T(16, 216, '하나다.', { c: 'q', s: 12.5 }),
      T(16, 254, '칸 안의 점은', { c: 'q', s: 12.5 }), T(16, 272, '모두 같은', { c: 'q', s: 12.5 }), T(16, 290, '두 픽셀에', { c: 'q', s: 12.5 }), T(16, 308, '찍힌다.', { c: 'q', s: 12.5 }),
    ].join(''), '두 카메라의 픽셀 경계선이 마름모 칸을 만들고, 칸은 멀수록 길어진다');
  };

  // 그림 9-6 같은 줄 따라 창 맞추기 (슬라이더)
  const ROW_L = [70, 72, 75, 110, 180, 200, 140, 90, 85, 160, 210, 120, 60, 65, 150, 190];
  const ROW_R = [182, 198, 141, 92, 84, 163, 207, 121, 62, 64, 152, 188, 175, 120, 80, 78];
  const C0 = 10, HW = 2;
  const sad = d => { let s = 0; for (let j = -HW; j <= HW; j++) s += Math.abs(ROW_L[C0 + j] - ROW_R[C0 + j - d]); return s; };
  const SADS = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(sad), BEST = SADS.indexOf(Math.min(...SADS));
  FIG.fig9_6 = el => interactive(el, {
    state: { d: 1 },
    sliders: [{ key: 'd', label: '밀어 본 칸 수 d', min: 0, max: 8, step: 1, unit: ' 칸' }],
    draw: ({ d }) => {
      const id = 'f96', x0 = 48, cw = 26, yL = 78, yR = 176, ch = 28;
      const row = (vals, y) => vals.map((v, j) => rect(x0 + j * cw, y, cw, ch, 'f-none s-grid', 1) + T(x0 + j * cw + cw / 2, y + ch / 2 + 5, v, { a: 'middle', s: 12.5 })).join('');
      const lw = x0 + (C0 - HW) * cw, rw = x0 + (C0 - HW - d) * cw, ww = (2 * HW + 1) * cw;
      const diffs = [];
      for (let j = -HW; j <= HW; j++) diffs.push(T(x0 + (C0 + j - d) * cw + cw / 2, yR + ch + 20, Math.abs(ROW_L[C0 + j] - ROW_R[C0 + j - d]), { a: 'middle', c: 'b', s: 12.5 }));
      const bx = i => 160 + i * 32, base = 356, hs = 82 / 460;
      const bars = SADS.map((v, i) => {
        const h = Math.max(2, v * hs), cur = i === d;
        return `<rect x="${bx(i)}" y="${(base - h).toFixed(1)}" width="24" height="${h.toFixed(1)}" rx="2" class="${cur ? 'f-c2' : 'f-axis'}" fill-opacity="${cur ? 0.85 : 0.5}"/>` +
          T(bx(i) + 12, base + 18, i, { a: 'middle', c: cur ? 'b' : 'q', s: 12.5 }) +
          (cur ? T(bx(i) + 12, base - h - 6, v, { a: 'middle', c: 'b', s: 12.5 }) : i === BEST ? T(bx(i) + 12, base - h - 6, '최소', { a: 'middle', c: 'q', s: 12.5 }) : '');
      }).join('');
      return svg(id, [52, 332], [
        T(x0, yL - 10, '왼쪽 영상의 한 줄', { c: 'b', s: 13 }), row(ROW_L, yL),
        [...Array(16).keys()].map(j => T(x0 + j * cw + cw / 2, yL + ch + 16, j, { a: 'middle', c: 'q', s: 12.5 })).join(''),
        T(x0, yR - 10, '오른쪽 영상의 같은 줄', { c: 'b', s: 13 }), row(ROW_R, yR),
        rect(lw - 2, yL - 2, ww + 4, ch + 4, 'f-c1 s-c1', 2.5, 'fill-opacity="0.1" rx="3"'),
        rect(rw - 2, yR - 2, ww + 4, ch + 4, 'f-c2 s-c2', 2.5, 'fill-opacity="0.1" rx="3"'),
        T(lw + ww + 8, yL - 10, '창', { c: 'f-c1 b', s: 13 }),
        d > 0 ? L(lw + ww / 2, 140, rw + ww / 2 + 4, 140, 'c2', 1.5, A(id, 'c2')) : '',
        T(lw + ww / 2 + 8, 145, 'd = ' + d, { c: 'b', s: 13 }),
        T(x0 - 6, yR + ch + 20, '차이', { a: 'end', c: 'q', s: 12.5 }), diffs.join(''),
        T(16, 292, 'SAD', { c: 'b', s: 13 }), T(16, 310, '(차이의 합)', { c: 'q', s: 12.5 }),
        L(152, base, 448, base, 'axis', 1.25), bars, T(148, base + 18, 'd', { a: 'end', c: 'q', s: 12.5 }),
      ].join(''), '오른쪽 영상의 같은 줄에서 창을 밀어 가며 차이의 합이 가장 작은 곳을 찾는다');
    },
    readout: ({ d }) => {
      const terms = [];
      for (let j = -HW; j <= HW; j++) terms.push(`|${ROW_L[C0 + j]} − ${ROW_R[C0 + j - d]}|`);
      return `<div>d = ${d}: SAD = ${terms.join(' + ')} = <b>${SADS[d]}</b></div>` +
        `<div>${d === BEST ? `<b>가장 작다.</b> 왼쪽 열 ${C0}의 짝은 오른쪽 열 ${C0 - d}이고, 시차는 d = ${d} 픽셀이다.` : `<span class="q">가장 작은 값은 d = ${BEST}에서 ${SADS[BEST]}이다.</span>`}</div>`;
    },
  });

  // 그림 9-7 시차 지도
  FIG.fig9_7 = el => {
    const id = 'f97', cs = 10, nc = 20, nr = 15, ax = 20, bx = 260, y1 = 70, y2 = 266;
    const floor = r => 4 * (r - 6);
    // 칸마다 시차. null = 짝을 못 찾음
    const disp = (r, c) => {
      if (c >= 3 && c <= 6 && r >= 8 && r <= 12) return floor(12);      // 컵
      if (c >= 13 && c <= 17 && r >= 4 && r <= 10) return floor(10);   // 상자
      if (c >= 8 && c <= 11 && r >= 1 && r <= 3) return 3;             // 벽의 포스터
      if (r <= 6) return null;                                          // 흰 벽: 무늬가 없다
      if ((c === 2 && r >= 8 && r <= 12) || (c === 12 && r >= 7 && r <= 10)) return null;  // 가림
      return floor(r);
    };
    const op = d => (0.1 + 0.85 * (d - 3) / 29).toFixed(2);
    const map = (x0, y0, noFloor) => {
      const b = [];
      for (let r = 0; r < nr; r++) for (let c = 0; c < nc; c++) {
        const d = disp(r, c);
        if (d === null || (noFloor && r >= 7 && d === floor(r))) continue;   // 바닥 평면과 시차가 같으면 지운다
        b.push(`<rect x="${x0 + c * cs}" y="${y0 + r * cs}" width="${cs}" height="${cs}" class="f-c1" fill-opacity="${op(d)}"/>`);
      }
      return b.join('') + rect(x0, y0, nc * cs, nr * cs, 'f-none s-axis', 1.25);
    };
    const X = c => ax + c * cs, Y = r => y1 + r * cs;
    const legend = [...Array(10).keys()].map(i => `<rect x="${20 + i * 20}" y="290" width="20" height="14" class="f-c1" fill-opacity="${(0.1 + 0.85 * i / 9).toFixed(2)}"/>`).join('');
    el.innerHTML += svg(id, [46, 382], [
      T(ax, 62, '(가) 왼쪽 영상', { c: 'b' }), T(bx, 62, '(나) 시차 지도', { c: 'b' }),
      // 장면
      rect(X(0), Y(6.5), nc * cs, (nr - 6.5) * cs, 'f-tint s-none', 0), L(X(0), Y(6.5), X(20), Y(6.5), 'axis', 1),
      rect(X(8), Y(1), 4 * cs, 3 * cs, 'f-none s-ink', 1.25),
      L(X(8) + 6, Y(1) + 8, X(12) - 6, Y(1) + 8, 'ink', 1), L(X(8) + 6, Y(1) + 15, X(12) - 12, Y(1) + 15, 'ink', 1), C(X(10), Y(3) + 1, 4, 'f-none s-ink', 1),
      rect(X(13), Y(4), 5 * cs, 7 * cs, 'f-axis s-ink', 1.25, 'fill-opacity="0.3"'), L(X(13) + 8, Y(5), X(18) - 8, Y(5), 'ink', 1), L(X(13) + 8, Y(5) + 7, X(18) - 14, Y(5) + 7, 'ink', 1),
      cupFront(X(5), Y(13), 4 * cs, 4.4 * cs, 'f-axis s-ink', 1.25).replace(/class="f-axis s-ink"/g, 'class="f-axis s-ink" fill-opacity="0.3"'),
      T(X(1), Y(3) + 4, '흰 벽', { c: 'q', s: 12.5 }), T(X(10), Y(5) + 2, '포스터', { a: 'middle', c: 'q', s: 12.5 }),
      T(X(15.5), Y(12.5) + 4, '상자', { a: 'middle', s: 12.5 }), T(X(9), Y(14) + 3, '바닥', { a: 'middle', c: 'q', s: 12.5 }), T(X(5), Y(7.5) + 2, '컵', { a: 'middle', s: 12.5 }),
      rect(X(0), Y(0), nc * cs, nr * cs, 'f-none s-axis', 1.25),
      // 지도 두 장
      map(bx, y1, false),
      L(bx + 100, y1 + nr * cs + 4, bx + 100, y2 - 28, 'ink', 1.5, A(id, 'ink')), T(bx + 110, y1 + nr * cs + 16, '바닥 평면을 빼면', { c: 'q', s: 12.5 }),
      T(bx, y2 - 8, '(다) 남은 것 = 장애물', { c: 'b' }),
      map(bx, y2, true),
      // 범례
      T(20, 278, '진할수록 가깝다 (시차가 크다)', { c: 'b', s: 13 }), legend,
      T(20, 322, '멀다', { c: 'q', s: 12.5 }), T(220, 322, '가깝다', { a: 'end', c: 'q', s: 12.5 }),
      rect(20, 342, 14, 14, 'f-none s-axis', 1.25), T(42, 354, '빈칸: 짝을 못 찾은 곳', { s: 12.5 }),
      T(42, 372, '(무늬 없는 벽, 가려진 곳)', { c: 'q', s: 12.5 }),
      T(20, 404, '바닥은 아래로 갈수록', { c: 'q', s: 12.5 }), T(20, 422, '고르게 진해지는 평면이다.', { c: 'q', s: 12.5 }),
    ].join(''), '시차 지도는 가까운 곳일수록 진하게 칠한다. 바닥 평면을 빼면 장애물만 남는다');
  };

  // 그림 9-8 특징점: 꼭짓점이 좋은 까닭, 두 보기 사이의 짝
  FIG.fig9_8 = el => {
    const id = 'f98', py = 72, ps = 84, cxs = [80, 240, 400];
    const kinds = [
      { name: '평평한 곳', desc: '어디로 밀어도 같다', fill: [[0, 0, ps, ps]], diff: [0, 0, 0, 0] },
      { name: '모서리선', desc: '선을 따라 밀면 같다', fill: [[0, ps / 2, ps, ps / 2]], diff: [0, 1, 0, 1] },
      { name: '꼭짓점', desc: '어디로 밀어도 바뀐다', fill: [[0, ps / 2, ps / 2, ps / 2]], diff: [1, 1, 1, 1] },
    ];
    const dirs = [[1, 0], [0, -1], [-1, 0], [0, 1]];
    const top = kinds.map((k, i) => {
      const x0 = cxs[i] - ps / 2, cx = cxs[i], cy = py + ps / 2;
      return rect(x0, py, ps, ps, 'f-none s-axis', 1.25) +
        k.fill.map(([x, y, w, h]) => rect(x0 + x, py + y, w, h, 'f-axis s-none', 0, 'fill-opacity="0.5"')).join('') +
        rect(cx - 14, cy - 14, 28, 28, 'f-none s-c1', 2) +
        dirs.map(([dx, dy], j) => L(cx + dx * 16, cy + dy * 16, cx + dx * 34, cy + dy * 34, k.diff[j] ? 'c2' : 'axis', 2, A(id, k.diff[j] ? 'c2' : 'axis'))).join('') +
        T(cx, py + ps + 20, k.name, { a: 'middle', c: 'b', s: 14 }) + T(cx, py + ps + 38, k.desc, { a: 'middle', s: 12.5 });
    }).join('');
    // 두 보기: 책 표지 (가로 120, 세로 88)와 특징점 [u, v, 크기, 방향°]
    const feats = [[-60, -44, 7, 135], [60, -44, 7, 45], [60, 44, 7, -45], [-28, -12, 15, 200], [28, -20, 8, 90], [12, 14, 6, 210], [44, 14, 6, -30], [-60, 44, 7, -135]];
    const view = (cx, cy, s, phi) => {
      const c = Math.cos(phi * D), sn = Math.sin(phi * D);
      return (u, v) => [cx + s * (u * c - v * sn), cy + s * (u * sn + v * c)];
    };
    const V1 = view(116, 340, 1, 0), V2 = view(360, 340, 0.78, -25);
    const book = (V, s) => poly([[-60, -44], [60, -44], [60, 44], [-60, 44]].map(p => V(...p)), 'f-tint s-axis', 1.5) +
      C(...V(-28, -12), 13 * s, 'f-axis s-axis', 1.25).replace('/>', ' fill-opacity="0.45"/>') +
      poly([[28, -20], [44, 14], [12, 14]].map(p => V(...p)), 'f-none s-ink', 1.5) +
      L(...V(-48, 30), ...V(0, 30), 'ink', 2.5) + L(...V(-48, 37), ...V(-14, 37), 'ink', 1.5);
    const mark = (V, s, [u, vv, r, th]) => {
      const p = V(u, vv), q = V(u + r * Math.cos(th * D), vv - r * Math.sin(th * D));
      return C(p[0], p[1], r * s, 'f-none s-ink', 1.5) + L(p[0], p[1], q[0], q[1], 'ink', 1.5);
    };
    const links = feats.slice(0, 6).map(([u, v]) => { const a = V1(u, v), b = V2(u, v); return L(a[0], a[1], b[0], b[1], 'c1', 1.25, 'stroke-opacity="0.75"'); }).join('');
    const wa = V1(44, 14), wb = V2(60, -44);
    el.innerHTML += svg(id, [40, 400], [
      T(16, 58, '(가) 좋은 특징점: 작은 창을 밀어 본다', { c: 'b' }), top,
      T(240, 230, '회색 화살표: 밀어도 같아 보인다 · 주황: 달라 보인다', { a: 'middle', c: 'q', s: 12.5 }),
      L(16, 244, 464, 244, 'grid', 1),
      T(16, 268, '(나) 두 보기에서 짝 맞추기', { c: 'b' }),
      book(V1, 1), book(V2, 0.78), links,
      L(wa[0], wa[1], wb[0], wb[1], 'c2', 1.5, 'stroke-dasharray="5 4"'),
      feats.map(f => mark(V1, 1, f)).join(''), feats.map(f => mark(V2, 0.78, f)).join(''),
      T((wa[0] + wb[0]) / 2 + 6, (wa[1] + wb[1]) / 2 - 10, '틀린 짝', { a: 'middle', c: 'f-c2 b', s: 12.5 }),
      T(116, 424, '보기 1', { a: 'middle', c: 'b', s: 13 }), T(360, 424, '보기 2: 돌리고 줄였다', { a: 'middle', c: 'b', s: 13 }),
    ].join(''), '꼭짓점은 어느 쪽으로 밀어도 달라져 자리가 하나로 정해진다. 두 보기의 특징점을 기술자로 맞춘다');
  };

  // 그림 9-9 추적 고리
  FIG.fig9_9 = el => {
    const id = 'f99', fw = 140, fh = 90, pos = [[24, 64], [316, 64], [316, 244], [24, 244]];
    const face = (cx, cy, r, rot = 0, cls = 'ink', sw = 1.5) => {
      const c = Math.cos(rot * D), s = Math.sin(rot * D), R = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
      const e1 = R(-0.38 * r, -0.2 * r), e2 = R(0.38 * r, -0.2 * r), m1 = R(-0.4 * r, 0.3 * r), m2 = R(0.4 * r, 0.3 * r), mc = R(0, 0.62 * r);
      return C(cx, cy, r, `f-none s-${cls}`, sw) + C(e1[0], e1[1], r * 0.1, `f-${cls}`, 0) + C(e2[0], e2[1], r * 0.1, `f-${cls}`, 0) +
        `<path d="M${m1[0].toFixed(1)} ${m1[1].toFixed(1)}Q${mc[0].toFixed(1)} ${mc[1].toFixed(1)} ${m2[0].toFixed(1)} ${m2[1].toFixed(1)}" fill="none" class="s-${cls}" stroke-width="${sw}"/>`;
    };
    const box = (cx, cy, h, rot, cls, more = '', sw = 1.75) => {
      const c = Math.cos(rot * D), s = Math.sin(rot * D);
      return poly([[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]), `f-none s-${cls}`, sw, more);
    };
    const frames = pos.map(([x, y]) => rect(x, y, fw, fh, 'f-none s-axis', 1.5, 'rx="4"')).join('');
    const [p1, p2, p3, p4] = pos;
    const lab = ([x, y], t, d) => T(x + fw / 2, y + fh + 20, t, { a: 'middle', c: 'b', s: 14 }) + T(x + fw / 2, y + fh + 38, d, { a: 'middle', s: 12.5 });
    // ① 지난 자리와 짐작한 자리
    const f1x = p1[0] + 48, f1y = p1[1] + 46;
    // ②, ④ 새 영상: 얼굴이 오른쪽 아래로 가며 12° 돌았다
    const nx = 66, ny = 50, nrot = 12;
    const s3 = p3[0] + 14, t3 = p3[1] + 14;
    el.innerHTML += svg(id, [44, 344], [
      frames,
      // ①
      face(f1x, f1y, 18), box(f1x, f1y, 24, 0, 'axis'), box(f1x + 26, f1y, 24, 0, 'c1', 'stroke-dasharray="4 3"'),
      L(f1x + 4, f1y + 34, f1x + 22, f1y + 34, 'c1', 1.5, A(id, 'c1')),
      // ②
      face(p2[0] + nx, p2[1] + ny, 18, nrot), rect(p2[0] + 74 - 38, p2[1] + 46 - 36, 76, 72, 'f-c1 s-c1', 1.25, 'fill-opacity="0.07" stroke-dasharray="2 3"'),
      box(p2[0] + 74, p2[1] + 46, 24, 0, 'c1', 'stroke-dasharray="4 3"'),
      // ③ 본보기와 세운 조각
      rect(s3, t3, 44, 44, 'f-none s-axis', 1.25), face(s3 + 22, t3 + 22, 15),
      T(s3 + 61, t3 + 27, '−', { a: 'middle', c: 'b', s: 16 }),
      rect(s3 + 78, t3, 44, 44, 'f-none s-c1', 1.5), face(s3 + 78 + 25, t3 + 25, 15, 5),
      T(s3 + 22, t3 + 64, '본보기', { a: 'middle', c: 'q', s: 12.5 }), T(s3 + 100, t3 + 64, '세운 조각', { a: 'middle', c: 'q', s: 12.5 }),
      // ④
      box(p4[0] + 74, p4[1] + 46, 24, 0, 'c1', 'stroke-dasharray="4 3" stroke-opacity="0.5"', 1.25),
      face(p4[0] + nx, p4[1] + ny, 18, nrot), box(p4[0] + nx, p4[1] + ny, 24, nrot, 'c2', '', 2),
      // 고리 화살표
      L(p1[0] + fw + 8, p1[1] + 36, p2[0] - 8, p2[1] + 36, 'ink', 1.75, A(id, 'ink')), T(240, p1[1] + 28, '새 영상', { a: 'middle', c: 'q', s: 12.5 }),
      `<path d="M${p2[0] - 8} ${p2[1] + fh - 4}Q${p2[0] - 48} 199 ${p3[0] - 8} ${p3[1] + 4}" fill="none" class="s-ink" stroke-width="1.75" ${A(id, 'ink')}/>`,
      L(p3[0] - 8, p3[1] + 54, p4[0] + fw + 8, p4[1] + 54, 'ink', 1.75, A(id, 'ink')),
      `<path d="M${p4[0] + fw + 8} ${p4[1] + 4}Q${p4[0] + fw + 48} 199 ${p1[0] + fw + 8} ${p1[1] + fh - 4}" fill="none" class="s-ink" stroke-width="1.75" ${A(id, 'ink')}/>`,
      T(240, 196, '영상', { a: 'middle', c: 'q', s: 12.5 }), T(240, 214, '한 장마다', { a: 'middle', c: 'q', s: 12.5 }), T(240, 232, '한 바퀴', { a: 'middle', c: 'b', s: 13 }),
      lab(p1, '① 예측', '지난 움직임으로 짐작한다'), lab(p2, '② 찾기', '근처를 잘라 바로 세운다'),
      lab(p3, '③ 맞추기', '본보기와 어긋남을 잰다'), lab(p4, '④ 고치기', '어긋남만큼 자세를 고친다'),
    ].join(''), '추적은 예측, 찾기, 맞추기, 고치기를 영상마다 되풀이하는 고리다');
  };
})();
