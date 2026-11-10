// The skill-folder installer used for Cursor (and optionally Codex): no Claude-only syntax survives, and
// it only removes what it created.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

test('install-skills writes portable skill folders and uninstalls only its own', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'ea-home-'));
  const dir = path.join(home, 'skills');
  fs.mkdirSync(path.join(dir, 'someone-elses-skill'), { recursive: true });
  const run = (...a) => execFileSync('node', ['plugins/experience-architecture/scripts/install-skills.mjs', '--dir', dir, ...a], { env: { ...process.env, HOME: home, USERPROFILE: home } });
  run();
  for (const s of ['diagnose', 'rethink', 'verify', 'walkthrough']) {
    const md = fs.readFileSync(path.join(dir, `experience-architecture-${s}`, 'SKILL.md'), 'utf8');
    assert.match(md, new RegExp(`^---\\nname: experience-architecture-${s}\\ndescription: ".+"\\n---\\n`));
    assert.ok(!md.includes('${CLAUDE_PLUGIN_ROOT}') && !md.includes('!`'), `${s} has no Claude-only syntax`);
    assert.ok(md.includes(path.join(home, '.experience-architecture', 'plugin').split(path.sep).join('/') + '/references/'));
  }
  assert.ok(fs.existsSync(path.join(home, '.experience-architecture', 'plugin', 'scripts', 'ea.mjs')));
  assert.ok(!fs.existsSync(path.join(home, '.experience-architecture', 'plugin', 'evals')));
  run('--uninstall');
  assert.deepEqual(fs.readdirSync(dir), ['someone-elses-skill']);
});
