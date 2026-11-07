"""Tests for the Viewport Proof scripts. Run: python3 -m unittest discover skills/viewport-proof/tests

The geometry test needs node plus an existing Playwright install on NODE_PATH
(e.g. NODE_PATH=<project>/node_modules); it is skipped otherwise.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))
import build_proof_sheet as bps  # noqa: E402

PNG_1PX = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000"
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082"
)


def base_proof(**over):
    proof = {
        "title": "Pricing page",
        "verdict": "not production ready",
        "summary": "The filter drawer covers the results on phones.",
        "target": {"url": "http://localhost:3000/pricing", "branch": "feat/x", "commit": "abc1234"},
        "coverage": "Targeted",
        "issues": [{"severity": "blocker", "title": "Drawer covers results", "where": {"route": "/pricing", "state": "filters open", "viewport": "390x844"},
                    "element": "aside.filters", "detail": "No way to close <it>.", "fix": "Add a close control.", "frame": "shots/a.png"}],
        "frames": [{"route": "/pricing", "state": "filters open", "viewport": "390x844", "path": "shots/a.png", "geometry": {"fail": 1, "warn": 0}},
                   {"route": "/pricing", "state": "filters open", "viewport": "1440x900"}],
        "checks": {"behavior": "fail: drawer cannot close", "consistency": "pass"},
        "not_checked": ["Safari"],
    }
    proof.update(over)
    return proof


class ProofSheetTests(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp())
        (self.dir / "shots").mkdir()
        (self.dir / "shots" / "a.png").write_bytes(PNG_1PX)

    def tearDown(self):
        shutil.rmtree(self.dir)

    def build(self, proof):
        src = self.dir / "proof.json"
        src.write_text(json.dumps(proof))
        code = bps.main(["x", str(src)])
        return code, (self.dir / "index.html")

    def test_builds_escaped_page_with_verdict_issues_and_unsaved_note(self):
        code, out = self.build(base_proof())
        self.assertEqual(code, 0)
        page = out.read_text()
        self.assertIn("Not production ready", page)
        self.assertIn("No way to close &lt;it&gt;.", page)
        self.assertIn("shots/a.png", page)
        self.assertIn("1 of 2 frames were inspected in the session", page)
        self.assertIn("prefers-color-scheme:dark", page)
        self.assertIn("<title>Pricing page</title>", page)

    def test_ready_verdict_with_material_issue_is_refused(self):
        proof = base_proof(verdict="production ready")
        proof["issues"][0]["severity"] = "material"
        code, out = self.build(proof)
        self.assertEqual(code, 1)
        self.assertFalse(out.exists())

    def test_minor_verdict_with_blocker_is_refused(self):
        code, _ = self.build(base_proof(verdict="minor fixes required"))
        self.assertEqual(code, 1)

    def test_minor_verdict_without_issues_is_refused(self):
        code, _ = self.build(base_proof(verdict="minor fixes required", issues=[]))
        self.assertEqual(code, 1)

    def test_ready_verdict_with_only_minor_issue_builds(self):
        proof = base_proof(verdict="production ready")
        proof["issues"][0]["severity"] = "minor"
        code, _ = self.build(proof)
        self.assertEqual(code, 0)

    def test_no_frames_is_refused(self):
        code, _ = self.build(base_proof(frames=[]))
        self.assertEqual(code, 1)

    def test_missing_or_escaping_frame_path_is_refused(self):
        proof = base_proof()
        proof["frames"][0]["path"] = "shots/missing.png"
        self.assertEqual(self.build(proof)[0], 1)
        proof = base_proof()
        proof["frames"][0]["path"] = "../outside.png"
        self.assertEqual(self.build(proof)[0], 1)

    def test_unknown_verdict_is_refused(self):
        self.assertEqual(self.build(base_proof(verdict="looks good"))[0], 1)

    def test_publish_files_lists_each_image_once(self):
        proof = base_proof()
        bps.validate(proof, self.dir)
        self.assertEqual(bps.publish_files(proof), ["shots/a.png"])


def playwright_node_path():
    node = shutil.which("node")
    if not node:
        return None
    probe = "try{require.resolve('playwright')}catch{require.resolve('@playwright/test')}"
    ok = subprocess.run([node, "-e", probe], env=os.environ.copy(), capture_output=True).returncode == 0
    return node if ok else None


class GeometryCheckTests(unittest.TestCase):
    def test_script_parses(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        res = subprocess.run([node, "--check", str(SCRIPTS / "geometry_check.js")], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, res.stderr)

    def run_fixture(self, *args):
        node = playwright_node_path()
        if not node:
            self.skipTest("Playwright not reachable on NODE_PATH")
        res = subprocess.run([node, str(HERE / "run_geometry_fixture.cjs"), *args], capture_output=True, text=True, timeout=120)
        self.assertEqual(res.returncode, 0, res.stderr)
        return json.loads(res.stdout)

    def test_defect_fixture_reports_each_planted_defect(self):
        result = self.run_fixture("geometry-defects.html", "390", "844")
        found = {(f["check"], f["selector"]) for f in result["findings"]}
        for expected in [("viewport-meta", None), ("element-outside-viewport", "#wide"), ("clipped-text", "#clip"),
                         ("clipped-text", "#ellipsis"), ("small-target", "#tiny"), ("broken-image", "#broken"),
                         ("distorted-image", "#stretch"), ("horizontal-scroller", "#scanner"), ("fixed-coverage", None)]:
            self.assertIn(expected, found)
        self.assertNotIn("#inline-link", {f["selector"] for f in result["findings"]})
        severity = {(f["check"], f["selector"]): f["severity"] for f in result["findings"]}
        self.assertEqual(severity[("clipped-text", "#ellipsis")], "info")
        self.assertEqual(severity[("horizontal-scroller", "#scanner")], "info")

    def test_clean_fixture_has_no_failures_on_touch_phone_or_desktop(self):
        for args in (("geometry-clean.html", "390", "844", "touch"), ("geometry-clean.html", "1440", "900")):
            result = self.run_fixture(*args)
            self.assertEqual(result["summary"]["fail"], 0, result["findings"])
            self.assertEqual(result["summary"]["warn"], 0, result["findings"])


if __name__ == "__main__":
    unittest.main()
