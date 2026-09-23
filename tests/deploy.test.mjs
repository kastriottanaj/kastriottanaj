import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const previous = '1234567890abcdef';
const source = readFileSync(new URL('../deploy/deploy.sh', import.meta.url), 'utf8');
const install = 'npm ci --no-audit --no-fund';
const build = 'npm run build';
const csp = 'npm run check:csp';
const restart = 'sudo systemctl restart kastriottanaj';
const active = 'systemctl is-active --quiet kastriottanaj';
const resetPrevious = `git reset --hard ${previous}`;

// Run the actual script with only its fixed filesystem paths redirected into
// a temporary directory. Every deployment command is intercepted; these tests
// never access a checkout, package registry, system service, or network.
function deploy(t, { failures = {}, healthCode = '400' } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'deploy-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bin = join(directory, 'bin');
  mkdirSync(bin);
  const envFile = join(directory, 'production.env');
  writeFileSync(envFile, 'PUBLIC_DEPLOY_TEST=production-value\n');
  const script = join(directory, 'deploy.sh');
  writeFileSync(script, source
    .replace('APP_ROOT="/var/www/kastriottanaj/current"', `APP_ROOT="${directory}"`)
    .replaceAll('/etc/kastriottanaj/env', envFile)
    .replaceAll('/etc/caddy/Caddyfile', join(directory, 'absent-Caddyfile')));

  const mock = `#!${process.execPath}
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
const command = [basename(process.argv[1]), ...process.argv.slice(2)].join(' ');
const stateFile = join(process.env.DEPLOY_TEST_DIRECTORY, 'state.json');
const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
state[command] = (state[command] ?? 0) + 1;
writeFileSync(stateFile, JSON.stringify(state));
appendFileSync(join(process.env.DEPLOY_TEST_DIRECTORY, 'calls.jsonl'), JSON.stringify({
  command, publicValue: process.env.PUBLIC_DEPLOY_TEST,
}) + '\\n');
const failures = JSON.parse(process.env.DEPLOY_TEST_FAILURES);
if ((failures[command] ?? []).includes(state[command])) process.exit(1);
if (command === 'git rev-parse HEAD') console.log('${previous}');
if (command === 'git rev-parse --short HEAD') console.log('abcdef01');
if (command.startsWith('curl ')) process.stdout.write(process.env.DEPLOY_TEST_HEALTH_CODE);
`;
  // .mjs makes the mocked executables independent of the host's package type.
  writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
  for (const command of ['git', 'npm', 'sudo', 'systemctl', 'curl', 'sleep']) {
    writeFileSync(join(bin, command), mock, { mode: 0o755 });
  }
  const result = spawnSync('bash', [script], {
    env: {
      ...process.env,
      PATH: `${bin}:${process.env.PATH}`,
      DEPLOY_BRANCH: 'main',
      DEPLOY_TEST_DIRECTORY: directory,
      DEPLOY_TEST_FAILURES: JSON.stringify(failures),
      DEPLOY_TEST_HEALTH_CODE: healthCode,
    },
    encoding: 'utf8',
    timeout: 15_000,
  });
  assert.ifError(result.error);
  const calls = readFileSync(join(directory, 'calls.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  return { ...result, calls, commands: calls.map(({ command }) => command) };
}

test('deployment validates its production build before restarting', (t) => {
  const result = deploy(t);
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.commands.indexOf(build) < result.commands.indexOf(csp));
  assert.ok(result.commands.indexOf(csp) < result.commands.indexOf(restart));
  assert.ok(!result.commands.includes(resetPrevious));
  assert.ok(result.calls.filter(({ command }) => command.startsWith('npm '))
    .every(({ publicValue }) => publicValue === 'production-value'));
});

for (const failedCommand of ['git reset --hard origin/main', install, build, csp, restart, active]) {
  test(`deployment rolls back after ${failedCommand} fails`, (t) => {
    const result = deploy(t, { failures: { [failedCommand]: [1] } });
    assert.equal(result.status, 1);
    const rollbackIndex = result.commands.indexOf(resetPrevious);
    assert.ok(rollbackIndex >= 0, result.stdout);
    assert.deepEqual(result.commands.slice(rollbackIndex), [
      resetPrevious, install, build, csp, restart, 'sleep 2', active,
    ]);
    assert.match(result.stdout, /!! rolled back\./);
    assert.ok(result.calls.slice(rollbackIndex).filter(({ command }) => command.startsWith('npm '))
      .every(({ publicValue }) => publicValue === 'production-value'));
    if ([install, build, csp].includes(failedCommand)) {
      assert.ok(!result.commands.slice(0, rollbackIndex).includes(restart));
    }
  });
}

test('an unhealthy API response triggers rollback', (t) => {
  const result = deploy(t, { healthCode: '500' });
  assert.equal(result.status, 1);
  assert.ok(result.commands.includes(resetPrevious));
  assert.match(result.stdout, /unexpected API response: HTTP 500/);
  assert.match(result.stdout, /!! rolled back\./);
});

test('failed rollback stops once and reports that manual recovery is needed', (t) => {
  const result = deploy(t, { failures: { [install]: [1, 2] } });
  assert.equal(result.status, 1);
  assert.equal(result.commands.filter((command) => command === resetPrevious).length, 1);
  assert.ok(!result.commands.includes(build));
  assert.ok(!result.commands.includes(restart));
  assert.match(result.stderr, /rollback failed — manual recovery required/);
  assert.doesNotMatch(result.stdout, /!! rolled back\./);
});

test('a failed rollback restart is not reported as successful recovery', (t) => {
  const result = deploy(t, { failures: { [restart]: [1, 2] } });
  assert.equal(result.status, 1);
  assert.equal(result.commands.filter((command) => command === resetPrevious).length, 1);
  assert.match(result.stderr, /rollback failed — manual recovery required/);
  assert.doesNotMatch(result.stdout, /!! rolled back\./);
});

test('fetch exhaustion fails without changing the checkout or restarting', (t) => {
  const result = deploy(t, { failures: { 'git fetch --prune origin': [1, 2, 3, 4, 5] } });
  assert.equal(result.status, 1);
  assert.ok(!result.commands.some((command) => command.startsWith('git reset')));
  assert.ok(!result.commands.includes(install));
  assert.ok(!result.commands.includes(restart));
});
