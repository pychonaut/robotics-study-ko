"""한 장을 만들고 크롬으로 열어 그림이 다 그려졌는지 보고, 화면을 잘라 찍는다.

사용: uv run --no-project --with markdown --with pillow python tools/check.py ch5
결과: 그림마다 OK/문제, 그리고 /tmp/robotics-shots/ch5/part*.png (폭 560px)
"""
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def main() -> None:
    name = sys.argv[1]
    subprocess.run([sys.executable, "-I", str(ROOT / "build.py"), name], check=True, cwd=ROOT)
    figs_js = ROOT / "docs" / "assets" / "figs" / f"{name}.js"
    if figs_js.exists():
        r = subprocess.run(["node", "--check", str(figs_js)], capture_output=True, text=True)
        print("node --check:", "OK" if r.returncode == 0 else r.stderr)
    url = (ROOT / "docs" / f"{name}.html").as_uri()
    dom = subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--virtual-time-budget=10000", "--dump-dom", url],
        capture_output=True, text=True, timeout=120,
    ).stdout
    figures = re.findall(r'<figure data-fig="([^"]+)">(.*?)</figure>', dom, re.S)
    bad = 0
    for fid, inner in figures:
        ok = "<svg" in inner and "그림 오류" not in inner and "찾을 수 없음" not in inner
        bad += not ok
        msg = re.search(r"(그림 오류[^<]*|그림을 찾을 수 없음[^<]*)", inner)
        print(f"  {fid}: {'OK' if ok else '문제 ' + (msg.group(1) if msg else '(svg 없음)')}")
    print(f"그림 {len(figures)}개, 문제 {bad}개")
    katex_err = dom.count('class="katex-error"')
    print("수식 오류:", katex_err)
    out = Path("/tmp/robotics-shots") / name
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()
    full = out / "full.png"
    subprocess.run(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=560,30000",
         "--virtual-time-budget=10000", f"--screenshot={full}", url],
        capture_output=True, timeout=180,
    )
    im = Image.open(full).convert("RGB")
    w, h = im.size
    px = im.load()
    bg = px[w - 2, h - 2]
    bottom = h
    for y in range(h - 1, 0, -20):
        if any(abs(sum(px[x, y]) - sum(bg)) > 30 for x in range(0, w, 10)):
            bottom = y + 40
            break
    parts = []
    for i, top in enumerate(range(0, bottom, 1800)):
        p = out / f"part{i:02d}.png"
        im.crop((0, top, w, min(top + 1800, bottom))).save(p)
        parts.append(str(p))
    full.unlink()
    print("화면 조각:", *parts, sep="\n  ")


if __name__ == "__main__":
    main()
