"""src/*.md 를 docs/*.html 로 만든다.

사용:
  uv run --no-project --with markdown python build.py          # 전부
  uv run --no-project --with markdown python build.py ch5      # ch5와 index만

원고 문법(마크다운에 몇 가지를 더했다):
- 첫 줄 `# N장. 제목`, 둘째 줄 `<!-- card: 강의 N강 · 한 줄 설명 -->` (목차 카드에 쓴다)
- ```latex ... ``` 블록 → KaTeX로 그리는 수식
- @fig <그림 id> | <제목> | <캡션> | <설명(없어도 됨)> → 그림 (docs/assets/figures.js, docs/assets/figs/<장>.js)
- index.md 의 `@toc` 줄 → 모든 장의 카드
"""
import html
import re
import sys
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
SRC, OUT = ROOT / "src", ROOT / "docs"

TEMPLATE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="스탠퍼드 CS223A 로봇공학 입문을 그림과 직접 움직여 보는 그림으로 혼자 공부하는 한국어 정리">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<header class="top">{nav}</header>
<main>
{body}
{bottom}
<footer>스탠퍼드 CS223A(Oussama Khatib, 2008)를 듣고 한국어로 새로 쓴 독학 정리다. 스탠퍼드 공식 자료가 아니다.
강의 자료는 <a href="https://see.stanford.edu/Course/CS223A">Stanford Engineering Everywhere</a>가 Creative Commons Attribution 3.0으로 공개했다.</footer>
</main>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script>
document.querySelectorAll('.math').forEach(el => {{
  try {{ katex.render(el.dataset.tex, el, {{displayMode: true, throwOnError: false, strict: false}}); }}
  catch (e) {{ el.textContent = el.dataset.tex; }}
}});
</script>
<script src="assets/figures.js"></script>
{figs}<script>FigKit.renderAll();</script>
</body>
</html>
"""


def chapters() -> list[dict]:
    out = []
    for p in sorted(SRC.glob("ch*.md"), key=lambda p: int(re.search(r"\d+", p.stem).group())):
        text = p.read_text(encoding="utf-8")
        title = re.search(r"^# (.+)$", text, re.M).group(1).strip()
        card = re.search(r"<!-- card: (.*?) -->", text)
        out.append({"name": p.stem, "title": title, "card": card.group(1) if card else ""})
    return out


def build_body(src: str) -> str:
    blocks = {}

    def keep(html_text: str) -> str:
        key = f"BLOCKKEEP{len(blocks)}X"
        blocks[key] = html_text
        return f"\n\n{key}\n\n"

    src = re.sub(
        r"```latex\n(.*?)\n```",
        lambda m: keep(f'<div class="math" data-tex="{html.escape(m.group(1), quote=True)}"></div>'),
        src,
        flags=re.S,
    )

    def fig(m: re.Match) -> str:
        parts = [p.strip() for p in m.group(1).split("|")]
        fid, title, caption = parts[0], parts[1], parts[2]
        note = parts[3] if len(parts) > 3 else ""
        return keep(
            f'<figure data-fig="{fid}"><div class="fig-title">{title}</div><div class="fig-body"></div>'
            + (f'<div class="fig-note">{note}</div>' if note else "")
            + f"<figcaption>{caption}</figcaption></figure>"
        )

    src = re.sub(r"^@fig (.+)$", fig, src, flags=re.M)
    body = markdown.markdown(src, extensions=["tables", "fenced_code", "sane_lists"])
    for key, value in blocks.items():
        body = body.replace(f"<p>{key}</p>", value).replace(key, value)
    return body


def toc(chs: list[dict]) -> str:
    cards = []
    for c in chs:
        cards.append(f'<a class="card" href="{c["name"]}.html"><b>{c["title"]}</b><span>{c["card"]}</span></a>')
    return "\n".join(cards)


def build(name: str, chs: list[dict]) -> None:
    src = (SRC / f"{name}.md").read_text(encoding="utf-8")
    if name == "index":
        src = src.replace("@toc", "\n\n" + "BLOCKTOC" + "\n\n")
        title = re.search(r"^# (.+)$", src, re.M).group(1).strip()
        body = build_body(src).replace("<p>BLOCKTOC</p>", toc(chs))
        nav, bottom = '<a href="./">처음</a>', ""
    else:
        i = [c["name"] for c in chs].index(name)
        prev = chs[i - 1] if i > 0 else None
        nxt = chs[i + 1] if i + 1 < len(chs) else None
        title = chs[i]["title"]
        body = build_body(src)
        nav = '<a href="./">처음</a>' + (f'<a href="{prev["name"]}.html">← 이전 장</a>' if prev else "") + (
            f'<a href="{nxt["name"]}.html">다음 장 →</a>' if nxt else "")
        bottom = '<div class="chapter-nav">' + (
            f'<a href="{prev["name"]}.html">← {prev["title"]}</a>' if prev else '<a href="./">← 처음으로</a>') + (
            f'<a href="{nxt["name"]}.html">{nxt["title"]} →</a>' if nxt else '<a href="./">처음으로 →</a>') + "</div>"
    figs = f'<script src="assets/figs/{name}.js"></script>\n' if (OUT / "assets" / "figs" / f"{name}.js").exists() else ""
    page = TEMPLATE.format(title=title, nav=nav, body=body, bottom=bottom, figs=figs)
    (OUT / f"{name}.html").write_text(page, encoding="utf-8")
    print("만듦:", f"docs/{name}.html")


def main() -> None:
    chs = chapters()
    want = sys.argv[1:] or [c["name"] for c in chs]
    for name in dict.fromkeys(want + ["index"]):
        build(name, chs)


if __name__ == "__main__":
    main()
