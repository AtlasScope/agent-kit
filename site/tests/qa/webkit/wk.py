#!/usr/bin/env python3
"""A tiny WebKit engine driver for the QA harness.

Playwright's own WebKit build can't be downloaded in every environment (the cloud sandbox blocks its
CDN), so this drives WebKitGTK, the Linux port of the same WebKit engine Safari uses, through
PyGObject. It is not Safari: no Apple font stack, no iOS UIKit chrome, no touch events, and
WebKitGTK's version may differ from shipping Safari. Reports must say so.

Protocol: one JSON object per line on stdin, one JSON reply per line on stdout.
  {"cmd": "open", "url": ..., "width": 393, "height": 852, "dark": false, "reduce": false, "init": "<js>"}
  {"cmd": "call", "body": "<async function body returning JSON-able>", "args": {...}}
  {"cmd": "shot", "path": "out.png", "full": true}
  {"cmd": "quit"}

Run it under a display: xvfb-run -a python3 wk.py. Set GDK_SCALE=2 for a 2x pixel ratio.
Needs: apt install python3-gi gir1.2-webkit2-4.1 gir1.2-gtk-3.0 xvfb
"""
import json
import sys

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import GLib, Gtk, WebKit2  # noqa: E402

state = {"win": None, "view": None}


def reply(obj):
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def wait(predicate, timeout_ms):
    """Spin the GTK main loop until predicate() is true or the timeout passes."""
    deadline = GLib.get_monotonic_time() + timeout_ms * 1000
    ctx = GLib.MainContext.default()
    while not predicate() and GLib.get_monotonic_time() < deadline:
        ctx.iteration(True) if ctx.pending() else GLib.usleep(5000)
    return predicate()


def settle(ms):
    deadline = GLib.get_monotonic_time() + ms * 1000
    ctx = GLib.MainContext.default()
    while GLib.get_monotonic_time() < deadline:
        while ctx.pending():
            ctx.iteration(False)
        GLib.usleep(5000)


def do_open(msg):
    if state["win"]:
        state["win"].destroy()
    settings = Gtk.Settings.get_default()
    # WebKitGTK maps these GTK settings to prefers-color-scheme and prefers-reduced-motion.
    settings.set_property("gtk-application-prefer-dark-theme", bool(msg.get("dark")))
    settings.set_property("gtk-enable-animations", not msg.get("reduce"))
    ucm = WebKit2.UserContentManager()
    if msg.get("init"):
        ucm.add_script(WebKit2.UserScript(msg["init"], WebKit2.UserContentInjectedFrames.TOP_FRAME,
                                          WebKit2.UserScriptInjectionTime.START, None, None))
    view = WebKit2.WebView.new_with_user_content_manager(ucm)
    view.get_settings().set_property("enable-developer-extras", True)
    view.get_settings().set_property("javascript-can-access-clipboard", True)
    win = Gtk.OffscreenWindow()
    win.set_default_size(msg.get("width", 1280), msg.get("height", 800))
    view.set_size_request(msg.get("width", 1280), msg.get("height", 800))
    win.add(view)
    win.show_all()
    done = {"v": False, "err": None}

    def on_change(_v, ev):
        if ev == WebKit2.LoadEvent.FINISHED:
            done["v"] = True

    def on_fail(_v, _ev, uri, err):
        done["err"] = f"{uri}: {err.message}"
        done["v"] = True
        return False

    view.connect("load-changed", on_change)
    view.connect("load-failed", on_fail)
    view.load_uri(msg["url"])
    ok = wait(lambda: done["v"], msg.get("timeout", 30000))
    settle(msg.get("settle", 800))
    state.update(win=win, view=view)
    reply({"ok": ok and not done["err"], "error": done["err"]})


def do_call(msg):
    view = state["view"]
    box = {"done": False}

    def cb(v, res, _data=None):
        try:
            val = v.call_async_javascript_function_finish(res)
            box["value"] = val.to_string() if val and not val.is_undefined() else "null"
        except GLib.Error as e:
            box["error"] = e.message
        box["done"] = True

    body = "return JSON.stringify(await (async () => {" + msg["body"] + "})());"
    args = GLib.Variant("a{sv}", {k: GLib.Variant("s", json.dumps(v)) for k, v in (msg.get("args") or {}).items()})
    # Arguments arrive as JSON strings; the body parses what it needs with JSON.parse.
    view.call_async_javascript_function(body, -1, args, None, None, None, cb, None)
    wait(lambda: box["done"], msg.get("timeout", 30000))
    if "error" in box:
        reply({"ok": False, "error": box["error"]})
    elif not box["done"]:
        reply({"ok": False, "error": "timeout"})
    else:
        reply({"ok": True, "value": json.loads(box["value"]) if box["value"] not in (None, "null") else None})


def do_shot(msg):
    view = state["view"]
    box = {"done": False}
    region = WebKit2.SnapshotRegion.FULL_DOCUMENT if msg.get("full", True) else WebKit2.SnapshotRegion.VISIBLE

    def cb(v, res, _data=None):
        try:
            surf = v.get_snapshot_finish(res)
            surf.write_to_png(msg["path"])
        except GLib.Error as e:
            box["error"] = e.message
        box["done"] = True

    view.get_snapshot(region, WebKit2.SnapshotOptions.NONE, None, cb)
    wait(lambda: box["done"], 60000)
    reply({"ok": "error" not in box, "error": box.get("error")})


HANDLERS = {"open": do_open, "call": do_call, "shot": do_shot}

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    msg = json.loads(line)
    if msg.get("cmd") == "quit":
        reply({"ok": True})
        break
    try:
        HANDLERS[msg["cmd"]](msg)
    except Exception as e:  # report and keep serving
        reply({"ok": False, "error": f"{type(e).__name__}: {e}"})
