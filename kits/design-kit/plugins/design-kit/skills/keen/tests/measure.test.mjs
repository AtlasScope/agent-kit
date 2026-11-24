import test from "node:test";
import assert from "node:assert/strict";
import { contrast, luminance, needed, over, pageScript } from "../scripts/measure.mjs";

test("black on white is 21 to 1 and a colour against itself is 1 to 1", () => {
  assert.equal(Math.round(contrast([0, 0, 0], [255, 255, 255])), 21);
  assert.equal(contrast([120, 120, 120], [120, 120, 120]), 1);
  assert.equal(contrast([0, 0, 0], [255, 255, 255]), contrast([255, 255, 255], [0, 0, 0]));
});

test("the grey that just passes on white passes, and the next lighter one fails", () => {
  // #767676 on white is the well-known lightest grey that reaches 4.5 to 1.
  assert.ok(contrast([118, 118, 118], [255, 255, 255]) >= 4.5);
  assert.ok(contrast([119, 119, 119], [255, 255, 255]) < 4.5);
});

test("luminance runs from 0 for black to 1 for white", () => {
  assert.equal(luminance([0, 0, 0]), 0);
  assert.ok(Math.abs(luminance([255, 255, 255]) - 1) < 1e-9);
});

test("a half-clear black over white is mid grey", () => {
  assert.deepEqual(over([0, 0, 0, 0.5], [255, 255, 255]), [127.5, 127.5, 127.5]);
  assert.deepEqual(over([10, 20, 30, 1], [255, 255, 255]), [10, 20, 30]);
});

test("large text needs 3 to 1 and everything else 4.5 to 1", () => {
  assert.equal(needed(16, 400), 4.5);
  assert.equal(needed(24, 400), 3);
  assert.equal(needed(19, 700), 3);
  assert.equal(needed(19, 400), 4.5);
  assert.equal(needed(18, 700), 4.5);
});

test("the page script is one expression that parses and carries its own maths", () => {
  const script = pageScript();
  assert.doesNotThrow(() => new Function(`return ${script.replace(/\}\)\(\)\s*$/, "})")}`));
  for (const name of ["function luminance", "function contrast", "function over", "function needed", "function measurePage"]) assert.ok(script.includes(name), name);
});
