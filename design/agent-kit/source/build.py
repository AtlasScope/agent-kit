"""Builds the Agent Kit mark and lockup. Lettering and constants come from the AtlasScope identity.

Run:  python3 design/agent-kit/source/build.py
Needs the same setup as the AtlasScope builder: fontTools, skia-pathops, Pillow and site/node_modules.
Agent Kit keeps its own name and mark. It shares AtlasScope's typeface, weight, ink and the
one-sided t, and carries a small "by AtlasScope" line. It does not use the crossbar-free A or Orbit.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ATLAS = os.path.join(os.path.dirname(ROOT), "atlasscope", "source")
sys.path.insert(0, ATLAS)
import geometry as G

INK, WHITE, MUTED_DARK, MUTED_LIGHT = "#0B0C12", "#FFFFFF", "#A3A6AD", "#5A5E68"
f = G.f
jobs = []

# ---- The mark: one tile with two more beneath it, seen from above at an angle --------------
# Units match the lettering (cap height 700).
T_A = 460.0      # half width of a tile
T_B = 236.0      # half height of a tile's top face
T_T = 96.0       # thickness of each lower tile's visible edge
T_G = 62.0       # gap between tiles
MARK_W = 2 * T_A
MARK_H = 2 * T_B + 2 * (T_G + T_T)

# ---- The name ------------------------------------------------------------------------------
PAIRS = {"Ag": -6, "ge": 0, "en": 0, "nt": -2, "t ": 0, " K": 0, "Ki": -4, "it": 0}
SPACE = 215.0
GAP = 300.0      # between mark and name
BY_CAP = 104.0   # cap height of the "BY ATLASSCOPE" line
BY_TRACK = 330.0
BY_DROP = 410.0  # baseline of that line below the name's baseline


def mark(x, y, s):
    """Path for the mark with its box's top-left at (x, y)."""
    P = lambda px, py: f"{f(x + px * s)} {f(y + py * s)}"
    a, b, t, g = T_A, T_B, T_T, T_G
    d = f"M{P(0, b)}L{P(a, 0)}L{P(2 * a, b)}L{P(a, 2 * b)}Z"
    c = b + g
    for _ in range(2):
        d += f"M{P(0, c)}L{P(a, c + b)}L{P(2 * a, c)}L{P(2 * a, c + t)}L{P(a, c + b + t)}L{P(0, c + t)}Z"
        c += g + t
    return d


def name(x, y, s, text="Agent Kit"):
    """Path for the name; (x, y) is the left end of the baseline. Returns (d, width)."""
    d, cx = [], 0.0
    first = G.glyph(text[0])[3][0]
    cx -= first
    last = 0
    for i, ch in enumerate(text):
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if ch == " ":
            cx += SPACE
        else:
            d.append(G.letter_path(ch, x + cx * s, y, s))
            last = cx + G.glyph(ch)[3][2]
            cx += G.glyph(ch)[2] + G.TRACK
        cx += PAIRS.get(ch + nxt, 0)
    return "".join(d), last * s


ASC = G.glyph("K")[3][3]            # cap height, 700
DESC = -G.glyph("g")[3][1]


def lockup(x, y, s, fill, sub, byline=True):
    """Mark, name and optional byline. (x, y) is the top-left of the ink box."""
    top = (MARK_H - G.CAP) / 2 + 0          # mark is centred on the cap height
    base = y + (top + G.CAP) * s
    body = f'<path fill="{fill}" d="{mark(x, y, s)}"/>'
    nx = x + (MARK_W + GAP) * s
    d, w = name(nx, base, s)
    body += f'<path fill="{fill}" d="{d}"/>'
    h = max(MARK_H, top + G.CAP + DESC)
    if byline:
        d2, w2 = G.text_path("BY ATLASSCOPE", nx + 6 * s, base + BY_DROP * s, BY_CAP * s, 500, track=BY_TRACK)
        body += f'<path fill="{sub}" d="{d2}"/>'
        h = max(h, top + G.CAP + BY_DROP)
    return body, (MARK_W + GAP) * s + w, h * s


def svg(w, h, body, title="Agent Kit", bg=None):
    r = f'<rect width="{f(w)}" height="{f(h)}" fill="{bg}"/>' if bg else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" width="{f(w)}" height="{f(h)}">'
            f"<title>{title}</title>{r}{body}</svg>")


def write(rel, content, png=()):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w").write(content + "\n")
    for out, width in png:
        full = os.path.join(ROOT, out)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        jobs.append([path, full, width])


def tile(size, bg, fg, radius=0.225):
    w = size * 0.56
    s = w / MARK_W
    x, y = (size - w) / 2, (size - MARK_H * s) / 2
    return svg(size, size, f'<rect width="{size}" height="{size}" rx="{f(size * radius)}" fill="{bg}"/><path fill="{fg}" d="{mark(x, y, s)}"/>')


def main():
    X = G.CAP / 2
    for tone, fill, sub in (("ink", INK, MUTED_LIGHT), ("white", WHITE, MUTED_DARK)):
        write(f"svg/agent-kit-mark-{tone}.svg", svg(MARK_W, MARK_H, f'<path fill="{fill}" d="{mark(0, 0, 1)}"/>'))
        for by, tag in ((True, "lockup-byline"), (False, "lockup")):
            body, w, h = lockup(0, 0, 1, fill, sub, by)
            write(f"svg/agent-kit-{tag}-{tone}.svg", svg(w, h, body))
            body, w, h = lockup(X, X, 1, fill, sub, by)
            write(f"svg/padded/agent-kit-{tag}-{tone}.svg", svg(w + 2 * X, h + 2 * X, body),
                  [(f"png/agent-kit-{tag}-{tone}-{px}.png", px) for px in (600, 1200, 2400)])
        pad = MARK_W * 0.18
        write(f"svg/padded/agent-kit-mark-{tone}.svg",
              svg(MARK_W + 2 * pad, MARK_H + 2 * pad, f'<path fill="{fill}" d="{mark(pad, pad, 1)}"/>'),
              [(f"png/agent-kit-mark-{tone}-{px}.png", px) for px in (256, 512, 1024)])
    write("icons/src/app-icon.svg", tile(1024, INK, WHITE), [(f"icons/app-icon-{px}.png", px) for px in (64, 180, 512, 1024)])
    write("icons/favicon.svg", tile(32, INK, WHITE, 0.2), [(f"icons/favicon-{px}.png", px) for px in (16, 32, 48)])
    # review sheet
    W, H = 1600, 900
    body = f'<rect x="60" y="60" width="1480" height="380" fill="{INK}"/><rect x="60.5" y="460.5" width="1479" height="379" fill="{WHITE}" stroke="#E4E5E8"/>'
    for y0, fill, sub in ((60, WHITE, MUTED_DARK), (460, INK, MUTED_LIGHT)):
        s = 0.15
        b, w, h = lockup(120, y0 + 60, s, fill, sub)
        body += b
        x = 120
        for cap in (12, 16, 20, 28):
            sc = cap / G.CAP
            b, w, h = lockup(x, y0 + 290, sc, fill, sub, cap >= 20)
            body += b
            x += w + 60
        x = 1180
        for px in (120, 64, 32, 16):
            sc = px / MARK_W
            body += f'<path fill="{fill}" d="{mark(x, y0 + 70, sc)}"/>'
            x += px + 40
    write("sheet/src/agent-kit-sheet.svg", svg(W, H, body, bg="#F4F4F5"), [("sheet/agent-kit-sheet.png", 3200)])
    subprocess.run(["node", os.path.join(ATLAS, "render.mjs"), "-"], input=json.dumps(jobs).encode(), check=True)
    from PIL import Image
    ims = [Image.open(os.path.join(ROOT, f"icons/favicon-{px}.png")).convert("RGBA") for px in (16, 32, 48)]
    ims[2].save(os.path.join(ROOT, "icons/favicon.ico"), format="ICO", append_images=ims[:2], sizes=[(48, 48), (32, 32), (16, 16)])
    print(f"wrote {len(jobs)} PNGs")


if __name__ == "__main__":
    main()
