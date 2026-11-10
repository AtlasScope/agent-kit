"""Builds every AtlasScope identity file from geometry.py.

Run:  python3 design/atlasscope/source/build.py
Needs Python with fontTools, skia-pathops and Pillow (pip install fonttools skia-pathops pillow),
and site/node_modules (for sharp, which renders the PNGs).
All lettering is written as outlines, so no output depends on an installed font.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import geometry as G

INK, WHITE, SLATE, MUTED = "#0B0C12", "#FFFFFF", "#151821", "#A3A6AD"
TONES = (("ink", INK), ("white", WHITE))
jobs = []
f = G.f


def write(rel, svg, png=()):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(svg + "\n")
    for out, width in png:
        full = os.path.join(ROOT, out)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        jobs.append([path, full, width])


def svg(w, h, body, title=None, bg=None):
    t = f"<title>{title}</title>" if title else ""
    r = f'<rect width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
            f"{t}{r}{body}</svg>")


def path(d, fill, extra=""):
    return f'<path fill="{fill}" {extra}d="{d}"/>'


# ---- Measurements shared by every logo -----------------------------------------------------
ITEMS, WM_W = G.wordmark()
ASC = G.glyph("l")[3][3]            # top of the l
DESC = -G.glyph("p")[3][1]          # depth of the p
X = G.CAP / 2                       # clear-space unit: half the cap height
AVATAR = 0.54                       # symbol width as a share of a square avatar


def variant(small):
    return G.TINY if small == "tiny" else G.SMALL if small else {}


def sym_box(small=False):
    m = G.symbol_metrics(**variant(small))
    return m, m["right"] - m["left"], m["top"] - m["bottom"]


def symbol_at(x, y, w, small=False):
    """Symbol path with its box's top-left at (x, y) and box width w. Returns (d, height)."""
    m, bw, bh = sym_box(small)
    s = w / bw
    d, _ = G.symbol_path(x - m["left"] * s, y + m["top"] * s, s, **variant(small))
    return d, bh * s


# Lockup: the symbol's A is exactly as tall as the wordmark's A and stands on the same baseline.
# The horizon band hangs below the baseline. The space between symbol and word is 1.1 X.
M0, SB_W, SB_H = sym_box()
LOCK_S = G.CAP / G.S_H
LOCK_DEPTH = max(DESC, -M0["bottom"] * LOCK_S)      # how far the lockup reaches below the baseline
LOCK_GAP = X * 1.1


def lockup(x, y, s, fill):
    """Horizontal lockup. (x, y) is the top-left of its ink box at scale s. Returns (body, w, h)."""
    top = ASC                                   # ink box top is the l ascender
    sw = SB_W * LOCK_S
    d1, _ = symbol_at(x, y + (top - G.CAP) * s, sw * s)
    d2, ww = G.wordmark_path(x + (sw + LOCK_GAP) * s, y + top * s, s)
    return path(d1 + d2, fill), (sw + LOCK_GAP) * s + ww, (top + LOCK_DEPTH) * s


def wordmark_only(x, y, s, fill):
    d, ww = G.wordmark_path(x, y + ASC * s, s)
    return path(d, fill), ww, (ASC + DESC) * s


# ---- Logo masters --------------------------------------------------------------------------
def logos():
    for tone, fill in TONES:
        # tight masters: the view box is the ink box
        body, w, h = lockup(0, 0, 1, fill)
        write(f"svg/atlasscope-lockup-{tone}.svg", svg(w, h, body, "AtlasScope"))
        body, w, h = wordmark_only(0, 0, 1, fill)
        write(f"svg/atlasscope-wordmark-{tone}.svg", svg(w, h, body, "AtlasScope"))
        for small in (False, True):
            d, h = symbol_at(0, 0, 1000, small)
            name = f"svg/atlasscope-symbol{'-small' if small else ''}-{tone}.svg"
            write(name, svg(1000, h, path(d, fill), "AtlasScope"))
        # padded versions with the clear space built in, and PNGs from those
        body, w, h = lockup(X, X, 1, fill)
        write(f"svg/padded/atlasscope-lockup-{tone}.svg", svg(w + 2 * X, h + 2 * X, body, "AtlasScope"),
              [(f"png/atlasscope-lockup-{tone}-{px}.png", px) for px in (600, 1200, 2400)])
        body, w, h = wordmark_only(X, X, 1, fill)
        write(f"svg/padded/atlasscope-wordmark-{tone}.svg", svg(w + 2 * X, h + 2 * X, body, "AtlasScope"),
              [(f"png/atlasscope-wordmark-{tone}-{px}.png", px) for px in (500, 1000, 2000)])
        pad = 1000 * 0.18
        d, h = symbol_at(pad, pad, 1000)
        write(f"svg/padded/atlasscope-symbol-{tone}.svg", svg(1000 + 2 * pad, h + 2 * pad, path(d, fill), "AtlasScope"),
              [(f"png/atlasscope-symbol-{tone}-{px}.png", px) for px in (256, 512, 1024)])
    # one-colour files that take the colour of the surrounding text, for use inline on the web
    body, w, h = lockup(0, 0, 1, "currentColor")
    write("svg/atlasscope-lockup-currentcolor.svg", svg(w, h, body, "AtlasScope"))
    d, h = symbol_at(0, 0, 1000)
    write("svg/atlasscope-symbol-currentcolor.svg", svg(1000, h, path(d, "currentColor"), "AtlasScope"))


# ---- Icons ---------------------------------------------------------------------------------
def tile(size, fill_ratio, small=False, radius=0.225, bg=INK, fg=WHITE, edge=False, snap=False):
    """Square tile with the symbol centred, nudged up so the pointed top does not look low."""
    m, bw, bh = sym_box(small)
    w = size * fill_ratio
    h = bh * w / bw
    x = (size - w) / 2
    y = (size - h) / 2 - size * 0.02
    if snap:
        # put the top of the gap on a whole pixel so the gap and band stay crisp at favicon sizes
        s_ = w / bw
        y += round(y + m["top"] * s_) - (y + m["top"] * s_)
    d, _ = symbol_at(x, y, w, small)
    r = size * radius
    body = f'<rect width="{f(size)}" height="{f(size)}" rx="{f(r)}" fill="{bg}"/>'
    if edge:
        i = size * 0.004
        body += (f'<rect x="{f(i)}" y="{f(i)}" width="{f(size - 2 * i)}" height="{f(size - 2 * i)}" rx="{f(r - i)}" '
                 f'fill="none" stroke="#FFFFFF" stroke-opacity=".14" stroke-width="{f(2 * i)}"/>')
    return svg(size, size, body + path(d, fg), "AtlasScope")


def icons():
    # Favicons use the small drawing. 16 px drops the tile's rounded corners less aggressively.
    # The small drawing's gap is 14 units, so a scale of 1/14, 2/14 or 3/14 px per unit gives a gap
    # of exactly 1, 2 or 3 px.
    bw = sym_box(True)[1]
    write("icons/favicon.svg", tile(32, bw * 2 / 14 / 32, small=True, radius=0.2, snap=True))
    for px, k, v in ((16, 1, "tiny"), (32, 2, True), (48, 3, True)):
        write(f"icons/src/favicon-{px}.svg", tile(px, sym_box(v)[1] * k / 14 / px, small=v, radius=0.2, snap=True),
              [(f"icons/favicon-{px}.png", px)])
    write("icons/src/app-icon.svg", tile(1024, 0.60, edge=True),
          [(f"icons/app-icon-{px}.png", px) for px in (64, 128, 192, 256, 512, 1024)])
    write("icons/src/app-icon-light.svg", tile(1024, 0.60, bg=WHITE, fg=INK),
          [("icons/app-icon-light-512.png", 512), ("icons/app-icon-light-1024.png", 1024)])
    # iOS and Android round the corners themselves, so these are full squares.
    write("icons/src/apple-touch-icon.svg", tile(1024, 0.60, radius=0), [("icons/apple-touch-icon.png", 180)])
    write("icons/src/maskable.svg", tile(1024, 0.46, radius=0),
          [("icons/maskable-192.png", 192), ("icons/maskable-512.png", 512)])
    # Avatars are cropped to a circle by GitHub, X and others; the symbol stays inside that circle.
    write("social/src/avatar-dark.svg", tile(1024, AVATAR, radius=0),
          [("social/avatar-dark-400.png", 400), ("social/avatar-dark-1024.png", 1024)])
    write("social/src/avatar-light.svg", tile(1024, AVATAR, radius=0, bg=WHITE, fg=INK),
          [("social/avatar-light-400.png", 400), ("social/avatar-light-1024.png", 1024)])


# ---- Share images --------------------------------------------------------------------------
def social():
    for name, w, h in (("social-preview-1280x640", 1280, 640), ("og-1200x630", 1200, 630)):
        _, lw, lh = lockup(0, 0, 1, WHITE)
        s = w * 0.52 / lw
        body, lw, lh = lockup((w - lw * s) / 2, (h - lh * s) / 2, s, WHITE)
        write(f"social/src/{name}.svg", svg(w, h, body, "AtlasScope", bg=INK), [(f"social/{name}.png", w)])
    # Link preview for the Agent Kit site: the product name leads, the AtlasScope lockup signs it.
    w, h = 1200, 630
    title_cap, by_cap, gap = 104, 30, 72
    title, tw = G.text_path("Agent Kit", 0, 0, title_cap, 600, track=-12)
    _, lw, _ = lockup(0, 0, 1, WHITE)
    s = by_cap / G.CAP
    _, bw = G.text_path("by", 0, 0, by_cap, 500)
    by_gap = X * 1.1 * s
    row_w = bw + by_gap + lw * s
    top = (h - (title_cap + gap + by_cap)) / 2
    base1, base2 = top + title_cap, top + title_cap + gap + by_cap
    body = path(G.text_path("Agent Kit", w / 2, base1, title_cap, 600, track=-12, anchor="middle")[0], WHITE)
    x0 = (w - row_w) / 2
    body += path(G.text_path("by", x0, base2, by_cap, 500)[0], MUTED)
    body += lockup(x0 + bw + by_gap, base2 - ASC * s, s, WHITE)[0]
    write("social/src/og-agent-kit-1200x630.svg", svg(w, h, body, "Agent Kit by AtlasScope", bg=INK),
          [("social/og-agent-kit-1200x630.png", w)])


# ---- Application mock-ups ------------------------------------------------------------------
def header(x, y, w, h, bg, fg, sub, lock_cap, mobile=False):
    """A plain site header: lockup at the left, a few links or a menu icon at the right."""
    body = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{bg}"/>'
    s = lock_cap / G.CAP
    _, lw, lh = lockup(0, 0, s, fg)
    pad = 20 if mobile else 40
    base_top = y + h / 2 - (ASC - G.CAP / 2) * s      # centre the cap height in the bar
    lk, _, _ = lockup(x + pad, base_top, s, fg)
    body += lk
    base = base_top + ASC * s
    if mobile:
        for i in range(3):
            body += f'<rect x="{x + w - pad - 20}" y="{f(y + h / 2 - 7 + i * 6)}" width="20" height="1.6" fill="{fg}"/>'
    else:
        cx = x + w - pad
        d, bw = G.text_path("Get Agent Kit", 0, 0, 9.4, 600)
        bw2 = bw + 34
        body += f'<rect x="{f(cx - bw2)}" y="{f(y + h / 2 - 17)}" width="{f(bw2)}" height="34" rx="17" fill="{fg}"/>'
        d, _ = G.text_path("Get Agent Kit", cx - bw2 + 17, y + h / 2 + 4.7, 9.4, 600)
        body += path(d, bg)
        cx -= bw2 + 34
        for label in ("About", "Writing", "Projects"):
            d, tw = G.text_path(label, cx, y + h / 2 + 4.7, 9.4, 500, anchor="end")
            body += path(d, sub)
            cx -= tw + 30
    return body


def applications():
    # optical centre of the lockup between ascender and descender, used to centre it in a header
    G.ASC_MID = (ASC + DESC) / 2
    W, H = 1600, 1560
    cap = lambda t, x, y: path(G.text_path(t.upper(), x, y, 8, 600, track=160)[0], "#7B7F88")
    body = ""
    y = 60
    body += cap("Desktop header, dark and light, wordmark 16 px cap height", 60, y)
    body += header(60, y + 22, 1480, 72, INK, WHITE, "#B9BCC4", 16)
    body += f'<rect x="60.5" y="{y + 118.5}" width="1479" height="71" fill="{WHITE}" stroke="#E4E5E8"/>'
    body += header(61, y + 119, 1478, 70, WHITE, INK, "#50545C", 16).replace(f'<rect x="61" y="{y + 119}" width="1478" height="70" fill="{WHITE}"/>', "")
    y += 250
    body += cap("Mobile header, 390 px wide, wordmark 14 px cap height", 60, y)
    body += header(60, y + 22, 390, 60, INK, WHITE, "#B9BCC4", 14, mobile=True)
    body += f'<rect x="490.5" y="{y + 22.5}" width="389" height="59" fill="{WHITE}" stroke="#E4E5E8"/>'
    body += header(491, y + 23, 388, 58, WHITE, INK, "#50545C", 14, mobile=True).replace(f'<rect x="491" y="{y + 23}" width="388" height="58" fill="{WHITE}"/>', "")
    body += cap("Symbol-only header for very narrow spaces", 920, y)
    body += f'<rect x="920" y="{y + 22}" width="200" height="60" fill="{INK}"/>'
    d, sh = symbol_at(940, 0, 30)
    d, _ = symbol_at(940, y + 52 - sh / 2, 30)
    body += path(d, WHITE)
    y += 150
    body += cap("GitHub avatar, cropped to a circle as GitHub shows it", 60, y)
    x = 60
    for px, bg, fg in ((200, INK, WHITE), (96, INK, WHITE), (40, INK, WHITE), (20, INK, WHITE), (200, WHITE, INK), (40, WHITE, INK), (20, WHITE, INK)):
        m, bw, bh = sym_box()
        w = px * AVATAR
        hh = bh * w / bw
        d, _ = symbol_at(x + (px - w) / 2, y + 24 + (px - hh) / 2 - px * 0.02, w)
        ring = ' stroke="#E4E5E8"' if bg == WHITE else ""
        body += f'<circle cx="{x + px / 2}" cy="{y + 24 + px / 2}" r="{px / 2}" fill="{bg}"{ring}/>' + path(d, fg)
        x += px + 36
    body += cap("App icon, 180, 120, 60 and 32 px", 960, y)
    x = 960
    for px in (180, 120, 60, 32):
        small = px <= 32
        inner = tile(px, 0.72 if small else 0.60, small=small, radius=0.2 if small else 0.225, edge=not small)
        inner = inner[inner.index(">") + 1:-6].replace("<title>AtlasScope</title>", "")
        body += f'<g transform="translate({x} {y + 24})">{inner}</g>'
        x += px + 30
    y += 290
    body += cap("Social preview, 1280 x 640, shown at half size", 60, y)
    _, lw, lh = lockup(0, 0, 1, WHITE)
    s = 640 * 0.52 / lw
    body += f'<rect x="60" y="{y + 22}" width="640" height="320" fill="{INK}"/>'
    body += lockup(60 + (640 - lw * s) / 2, y + 22 + (320 - lh * s) / 2, s, WHITE)[0]
    body += cap("Beside a project: Agent Kit keeps its own name and mark", 760, y)
    body += f'<rect x="760" y="{y + 22}" width="780" height="320" fill="{SLATE}"/>'
    d, tw = G.text_path("Agent Kit", 820, y + 190, 44, 650, track=-18)
    body += path(d, WHITE)
    d, bw = G.text_path("BY", 822, y + 246, 9, 600, track=260)
    body += path(d, MUTED)
    s2 = 13 / G.CAP
    lk, lw2, _ = lockup(822 + bw + 12, y + 246 - ASC * s2 + 2, s2, WHITE)
    body += lk
    y += 400
    body += cap("Wordmark and lockup at real sizes: 12, 14, 16, 20, 24 px cap height", 60, y)
    for row, (bg, fg) in enumerate(((WHITE, INK), (INK, WHITE))):
        ry = y + 22 + row * 150
        body += f'<rect x="60" y="{ry}" width="1480" height="150" fill="{bg}"' + (' stroke="#E4E5E8"' if bg == WHITE else "") + "/>"
        x = 90
        for c in (12, 14, 16, 20, 24):
            s = c / G.CAP
            lk, lw, _ = lockup(x, ry + 30, s, fg)
            body += lk
            d, ww = G.wordmark_path(x, ry + 120, s)
            body += path(d, fg)
            x += max(lw, ww) + 50
    write("applications/src/applications.svg", svg(W, H, body, bg="#F4F4F5"), [("applications/applications.png", 3200)])


# ---- Specification sheet -------------------------------------------------------------------
def spec_sheet():
    W, H = 1600, 1180
    cap = lambda t, x, y, c="#7B7F88": path(G.text_path(t.upper(), x, y, 8, 600, track=160)[0], c)
    body = cap("AtlasScope identity, construction and clear space", 60, 60)
    # lockup with guides
    s = 0.118
    _, lw, lh = lockup(0, 0, s, INK)
    ox, oy = 110, 150
    xs = X * s
    body += f'<rect x="{ox - xs}" y="{oy - xs}" width="{f(lw + 2 * xs)}" height="{f(lh + 2 * xs)}" fill="none" stroke="#C8CAD0" stroke-dasharray="4 4"/>'
    for gy, label in ((oy + (ASC - G.CAP) * s, "cap line"), (oy + (ASC - G.glyph("o")[3][3]) * s, "x-height"), (oy + ASC * s, "baseline")):
        body += f'<line x1="{ox - xs}" x2="{f(ox + lw + xs)}" y1="{f(gy)}" y2="{f(gy)}" stroke="#E0603A" stroke-width=".6"/>'
        body += path(G.text_path(label, ox + lw + xs + 10, gy + 3, 7.5, 500)[0], "#E0603A")
    body += lockup(ox, oy, s, INK)[0]
    for cx_, cy_ in ((ox - xs, oy - xs), (ox + lw, oy - xs), (ox - xs, oy + lh), (ox + lw, oy + lh)):
        body += f'<rect x="{f(cx_)}" y="{f(cy_)}" width="{f(xs)}" height="{f(xs)}" fill="#E0603A" fill-opacity=".12"/>'
        body += path(G.text_path("X", cx_ + xs / 2, cy_ + xs / 2 + 4, 8, 600, anchor="middle")[0], "#E0603A")
    # symbol construction
    sx, sy, ss = 1250, 330, 2.3
    m = G.symbol_metrics()
    d, _ = G.symbol_path(sx, sy, ss)
    body += '<clipPath id="c"><rect x="960" y="70" width="580" height="400"/></clipPath><g clip-path="url(#c)">'
    for r in (m["r_foot"], m["ro"], m["ri"]):
        body += f'<circle cx="{sx}" cy="{f(sy - m["cy"] * ss)}" r="{f(r * ss)}" fill="none" stroke="#E0603A" stroke-width=".6"/>'
    body += "</g>"
    body += path(d, INK, 'fill-opacity=".92" ')
    body += f'<line x1="{sx}" x2="{sx}" y1="80" y2="460" stroke="#E0603A" stroke-width=".6" stroke-dasharray="3 3"/>'
    notes = [f"leg slope {f(G.TAN)} (24.2 deg from vertical)", f"leg {f(G.S_STROKE)}  flat top {f(G.S_APEX)}  height 100",
             f"band {f(G.S_BAND)} (same as leg)  gap {f(G.S_GAP)}  outer radius {f(G.S_R)}", "feet, gap and band share one centre"]
    for i, n in enumerate(notes):
        body += path(G.text_path(n, 980, 490 + i * 18, 7.5, 500)[0], "#50545C")
    # wordmark on dark and light, symbol versions
    y = 560
    body += cap("Versions", 60, y)
    cells = [(60, INK, WHITE), (800, WHITE, INK)]
    for cx_, bg, fg in cells:
        body += f'<rect x="{cx_}" y="{y + 22}" width="740" height="540" fill="{bg}"' + (' stroke="#E4E5E8"' if bg == WHITE else "") + "/>"
        s = 0.085
        body += lockup(cx_ + 60, y + 70, s, fg)[0]
        body += wordmark_only(cx_ + 60, y + 230, s, fg)[0]
        d, _ = symbol_at(cx_ + 60, y + 375, 105)
        body += path(d, fg)
        d, _ = symbol_at(cx_ + 260, y + 410, 60, True)
        body += path(d, fg)
        d, _ = symbol_at(cx_ + 370, y + 425, 30, True)
        body += path(d, fg)
        sub = "#8A8E97" if bg == INK else "#7B7F88"
        for ty, label in ((y + 190, "Primary lockup"), (y + 330, "Wordmark"), (y + 530, "Symbol, and the small drawing for 32 px and below")):
            body += path(G.text_path(label, cx_ + 60, ty, 7.5, 500)[0], sub)
    write("spec/src/spec-sheet.svg", svg(W, H, body, bg="#FAFAFA"), [("spec/spec-sheet.png", 3200)])


def main():
    logos()
    icons()
    social()
    applications()
    spec_sheet()
    subprocess.run(["node", os.path.join(HERE, "render.mjs"), "-"], input=json.dumps(jobs).encode(), check=True)
    from PIL import Image
    ims = [Image.open(os.path.join(ROOT, f"icons/favicon-{px}.png")).convert("RGBA") for px in (16, 32, 48)]
    ims[2].save(os.path.join(ROOT, "icons/favicon.ico"), format="ICO", append_images=ims[:2], sizes=[(48, 48), (32, 32), (16, 16)])
    print(f"wrote {len(jobs)} PNGs; lockup scale {LOCK_S:.3f}, symbol leg at lockup scale {G.S_STROKE * LOCK_S:.1f}, depth {LOCK_DEPTH:.0f}, wordmark A leg {G.A_STROKE}")


if __name__ == "__main__":
    main()
