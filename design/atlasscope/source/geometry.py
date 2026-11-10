"""AtlasScope identity geometry. Every number that defines the logo lives in this file.

Units: the lettering uses Montserrat's own units, cap height 700, baseline at y = 0, y pointing up.
SVG output flips y. Run build.py to regenerate every asset.
"""
import math, os
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "fonts", "Montserrat-wght.ttf")

# ---- Shared constants --------------------------------------------------------------------
CAP = 700.0            # cap height of the lettering and of the wordmark A
TAN = 0.45             # leg slope, horizontal run per unit of height (24.2 degrees from vertical)
COS = 1 / math.sqrt(1 + TAN * TAN)

# ---- Wordmark ----------------------------------------------------------------------------
WGHT = 600             # Montserrat weight axis (SemiBold)
TRACK = -22            # added to every advance
A_STROKE = 131.0       # leg thickness of the wordmark A, measured square to the leg
A_APEX = 150.0         # width of the flat top
A_RSB = -6.0           # space after the A's right foot, before pair adjustments
# Pair adjustments, set by eye on the outlines. Positive opens, negative closes.
PAIRS = {"At": -32, "tl": 4, "la": 2, "as": -2, "sS": 4, "Sc": 2, "co": 0, "op": 2, "pe": 0}

# Letters other than the A that carry a small custom detail. Remove a name to switch it off.
#   t_right  the t's crossbar sits on the right of the stem only
#   tops     shallow angled cut on the tops of t and l, low at the left
#   p_foot   the same cut, turned half a circle, on the foot of the p
#   e_open   the e's bar stops short of the left side
CUSTOM = {"t_right", "tops", "p_foot"}
CUT_DROP = 46.0        # how far the angled cut falls across one stem

# ---- Orbit symbol ------------------------------------------------------------------------
# Drawn on its own grid: apex top at y = 100, horizon centre on the axis x = 0.
S_H = 100.0            # apex height above the foot circle's top point
S_STROKE = 21.0        # leg thickness, square to the leg
S_APEX = 23.0          # flat top width
S_R = 120.0            # outer radius of the horizon band
S_BAND = 21.0          # band thickness, equal to the leg
S_GAP = 12.0           # clear gap between the feet and the band
S_OVER = 10.0          # how far the band reaches past the outer foot corner, each side
# Small-size drawing, for 32 px and below: heavier legs, thicker band, wider gap.
SMALL = dict(stroke=25.0, band=24.0, gap=14.0, over=8.0)
# 16 px drawing: a flatter band, so the gap stays one clean pixel row.
TINY = dict(stroke=27.0, band=28.0, gap=14.0, over=5.0, r=260.0)


def f(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s == "-0" else s


# ---- Lettering ---------------------------------------------------------------------------
_fonts = {}


def font(wght=None):
    w = wght or WGHT
    if w not in _fonts:
        _fonts[w] = instantiateVariableFont(TTFont(FONT), {"wght": w})
    return _fonts[w]


def glyph(ch, wght=None):
    ft = font(wght)
    name = ft.getBestCmap()[ord(ch)]
    gs = ft.getGlyphSet()
    bp = BoundsPen(gs)
    gs[name].draw(bp)
    return gs, name, ft["hmtx"][name][0], bp.bounds


def glyph_path(ch, x, y, s, wght=None):
    """SVG path data for one letter with its origin at (x, y) in SVG space, scale s."""
    gs, name, adv, _ = glyph(ch, wght)
    pen = SVGPathPen(gs, ntos=f)
    gs[name].draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
    return pen.getCommands()


def _poly_path(pts):
    from pathops import Path
    p = Path()
    pen = p.getPen()
    pen.moveTo(pts[0])
    for q in pts[1:]:
        pen.lineTo(q)
    pen.closePath()
    return p


def letter_path(ch, x, y, s):
    """One wordmark letter, with the custom details in CUSTOM applied. Falls back to the plain outline."""
    todo = {"t": {"t_right", "tops"}, "l": {"tops"}, "p": {"p_foot"}, "e": {"e_open"}}.get(ch, set()) & CUSTOM
    if not todo:
        return glyph_path(ch, x, y, s)
    from pathops import Path, op, PathOp
    gs, name, adv, b = glyph(ch)
    stem = glyph("l")[3][2] - glyph("l")[3][0]
    p = Path()
    gs[name].draw(p.getPen(glyphSet=gs))
    cut = lambda pts: op(p, _poly_path(pts), PathOp.DIFFERENCE, fix_winding=True)
    if ch == "t":
        x0 = b[0] + 87.2                       # left edge of the t's stem
        if "t_right" in todo:
            p = cut([(b[0] - 5, 400), (x0, 400), (x0, 560), (b[0] - 5, 560)])
        if "tops" in todo:
            p = cut([(x0 - 2, b[3] + 5), (x0 + stem + 2, b[3] + 5), (x0 - 2, b[3] - CUT_DROP)])
    if ch == "l":
        p = cut([(b[0] - 2, b[3] + 5), (b[2] + 2, b[3] + 5), (b[0] - 2, b[3] - CUT_DROP)])
    if ch == "p":
        p = cut([(b[0] - 2, b[1] - 5), (b[0] + stem + 2, b[1] - 5), (b[0] + stem + 2, b[1] + CUT_DROP)])
    if ch == "e":
        p = cut([(b[0] + 122, 227), (b[0] + 122 + 78, 227), (b[0] + 122 + 78, 310), (b[0] + 122, 310)])
    pen = SVGPathPen(None, ntos=f)
    p.draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
    return pen.getCommands()


def wordmark_a(stroke=None, apex=None):
    """Crossbar-free A: flat top, flat feet, sharp inner notch. Returns (points, width), y up."""
    t = stroke or A_STROKE
    a = apex or A_APEX
    hw = t / COS                       # leg width measured along the baseline
    half = a / 2 + CAP * TAN           # half width at the baseline
    inner_y = CAP + (a / 2) / TAN - hw / TAN   # height of the inner notch
    cx = half
    pts = [(cx - a / 2, CAP), (cx + a / 2, CAP), (cx + half, 0), (cx + half - hw, 0),
           (cx, inner_y), (cx - half + hw, 0), (cx - half, 0)]
    return pts, 2 * half


def poly(pts, x, y, s):
    return "M" + "L".join(f"{f(x + px * s)} {f(y - py * s)}" for px, py in pts) + "Z"


def wordmark(text="AtlasScope"):
    """Lay the word out. Returns (list of (kind, char, x), width), in letter units from x = 0."""
    out, x = [], 0.0
    for i, ch in enumerate(text):
        nxt = text[i + 1] if i + 1 < len(text) else ""
        if i == 0 and ch == "A":
            _, w = wordmark_a()
            out.append(("A", ch, x))
            x += w + A_RSB
        else:
            _, _, adv, b = glyph(ch)
            if i == 0:
                x -= b[0]
            out.append(("g", ch, x))
            x += adv + TRACK
        x += PAIRS.get(ch + nxt, 0)
    # trim the trailing side bearing and tracking so the box ends on the last letter's ink
    kind, ch, lx = out[-1]
    _, _, adv, b = glyph(ch)
    return out, lx + b[2]


def wordmark_path(x, y, s, text="AtlasScope"):
    """One SVG path string for the whole word; (x, y) is the left end of the baseline."""
    items, w = wordmark(text)
    d = []
    for kind, ch, gx in items:
        if kind == "A":
            pts, _ = wordmark_a()
            d.append(poly(pts, x + gx * s, y, s))
        else:
            d.append(letter_path(ch, x + gx * s, y, s))
    return "".join(d), w * s


# ---- Orbit symbol ------------------------------------------------------------------------
def _hit(px, py, dx, dy, cy, r):
    """Where the line from (px, py) along (dx, dy) meets the circle centred (0, cy)."""
    ox, oy = px, py - cy
    a = dx * dx + dy * dy
    b = 2 * (ox * dx + oy * dy)
    c = ox * ox + oy * oy - r * r
    k = (-b - math.sqrt(b * b - 4 * a * c)) / (2 * a)
    return px + dx * k, py + dy * k


def symbol_metrics(stroke=None, band=None, gap=None, over=None, r=None):
    t = stroke or S_STROKE
    bd = band or S_BAND
    g = S_GAP if gap is None else gap
    ov = S_OVER if over is None else over
    R = r or S_R
    r_foot = R + g
    cy = -r_foot                               # foot circle touches y = 0 on the axis
    hw = t / COS
    foot_x, _ = _hit(S_APEX / 2, S_H, TAN, -1, cy, r_foot)
    sp = math.asin((foot_x + ov) / R)
    inner_y = S_H + (S_APEX / 2) / TAN - hw / TAN
    ro, ri = R, R - bd
    ex, ey = ro * math.sin(sp), cy + ro * math.cos(sp)
    ix, iy = ri * math.sin(sp), cy + ri * math.cos(sp)
    return dict(t=t, band=bd, gap=g, span=sp, r_foot=r_foot, cy=cy, hw=hw, inner_y=inner_y, ro=ro, ri=ri,
                left=-max(ex, ix), right=max(ex, ix), top=S_H, bottom=min(ey, iy))


def symbol_path(x, y, s, **kw):
    """SVG path data for Orbit. (x, y) is where the symbol grid origin lands in SVG space."""
    m = symbol_metrics(**kw)
    P = lambda px, py: f"{f(x + px * s)} {f(y - py * s)}"
    a2 = S_APEX / 2
    # legs: outer edge from the flat top, inner edge from the notch, both cut by the foot circle
    orx, ory = _hit(a2, S_H, TAN, -1, m["cy"], m["r_foot"])
    irx, iry = _hit(0, m["inner_y"], TAN, -1, m["cy"], m["r_foot"])
    rf = f(m["r_foot"] * s)
    d = (f"M{P(-a2, S_H)}L{P(a2, S_H)}L{P(orx, ory)}A{rf} {rf} 0 0 0 {P(irx, iry)}L{P(0, m['inner_y'])}"
         f"L{P(-irx, iry)}A{rf} {rf} 0 0 0 {P(-orx, ory)}Z")
    sp, cy, ro, ri = m["span"], m["cy"], m["ro"], m["ri"]
    ex, ey = ro * math.sin(sp), cy + ro * math.cos(sp)
    ix, iy = ri * math.sin(sp), cy + ri * math.cos(sp)
    d += (f"M{P(-ex, ey)}A{f(ro * s)} {f(ro * s)} 0 0 1 {P(ex, ey)}L{P(ix, iy)}"
          f"A{f(ri * s)} {f(ri * s)} 0 0 0 {P(-ix, iy)}Z")
    m["foot_x"] = orx
    return d, m


def text_path(text, x, y, size, wght=500, track=0.0, anchor="start"):
    """Plain Montserrat text as outlines, for mock-ups and captions. size is the cap height in px."""
    s = size / CAP
    adv = [glyph(c, wght)[2] + track for c in text]
    w = sum(adv) * s
    if anchor == "middle":
        x -= w / 2
    if anchor == "end":
        x -= w
    d = []
    for c, a in zip(text, adv):
        if c != " ":
            d.append(glyph_path(c, x, y, s, wght))
        x += a * s
    return "".join(d), w
