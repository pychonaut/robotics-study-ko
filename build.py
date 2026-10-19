"""src/*.md 를 docs/*.html 로 만든다.

사용: uv run --with markdown python build.py

원고 문법(마크다운에 두 가지를 더했다):
- ```latex ... ``` 블록 → KaTeX로 그리는 수식
- @fig <그림 id> | <제목> | <캡션> | <설명(없어도 됨)> → docs/assets/figures.js 가 그리는 그림
"""
import html
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).parent
PAGES = [
    ("index", "종이 팔로 배우는 로봇공학 입문"),
    ("ch1", "1장. 로봇 팔은 무엇을 풀어야 하나"),
    ("ch2", "2장. 위치와 방향을 숫자로 적기"),
]
NAV = '<a href="./">처음</a><a href="ch1.html">1장</a><a href="ch2.html">2장</a>'

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
</body>
</html>
"""


def build_page(src: str) -> str:
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


def main() -> None:
    for name, title in PAGES:
        src = (ROOT / "src" / f"{name}.md").read_text(encoding="utf-8")
        page = TEMPLATE.format(title=title, nav=NAV, body=build_page(src))
        (ROOT / "docs" / f"{name}.html").write_text(page, encoding="utf-8")
        print("만듦:", f"docs/{name}.html")


if __name__ == "__main__":
    main()
