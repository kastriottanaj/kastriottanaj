import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'newsletter-opt-in-'));
process.env.LEADS_DB_PATH = join(directory, 'test.db');
const store = await import('../src/lib/newsletter-store.mjs');
const { sendSubscriptionConfirmation } = await import('../src/lib/newsletter-opt-in.mjs');
const { getDb } = await import('../src/lib/sqlite.mjs');

test.after(() => {
  getDb().close();
  rmSync(directory, { recursive: true, force: true });
});

const notFound = { found: false, status: null, error: null };

// The store is real; only MailerLite and SMTP are faked. `calls` records what
// the visitor's submission caused to happen outside this process.
async function signUp(email, { configured = true, lookup = notFound, push = true, smtp = true } = {}) {
  const calls = [];
  const services = {
    markHandedOff: store.markHandedOff,
    releaseConfirmationAttempt: store.releaseConfirmationAttempt,
    mailerliteConfigured: () => configured,
    mailerliteOwnsOptIn: () => true,
    mailerliteTimestamp: () => '2026-09-23 12:00:00',
    findSubscriber: async () => (calls.push('lookup'), lookup),
    upsertSubscriber: async ({ status }) => (calls.push(`push ${status}`), { ok: push }),
    sendConfirmationEmail: async () => {
      calls.push('smtp');
      if (smtp instanceof Error) throw smtp;
      return smtp;
    },
  };
  const { outcome, confirmToken } = store.subscribe({ email, source: 'test' });
  const sent = await sendSubscriptionConfirmation({ email, source: 'test', ip: null, confirmToken }, services);
  return { outcome, confirmToken, sent, calls };
}

const row = (email) =>
  getDb().prepare('SELECT confirm_sent_at, mailerlite_at FROM subscribers WHERE email = ?').get(email);

test('an active MailerLite contact unknown locally is neither demoted nor mailed again', async () => {
  const email = 'active@example.com';
  const result = await signUp(email, { lookup: { found: true, status: 'active', error: null } });
  assert.equal(result.sent, true);
  assert.deepEqual(result.calls, ['lookup']);
  assert.notEqual(row(email).mailerlite_at, null);
  assert.notEqual(row(email).confirm_sent_at, null);
  // Marked as handed off, so a later export cannot push them as unconfirmed.
  assert.ok(!store.exportSubscribers({ statuses: ['pending'] }).some((s) => s.email === email));
});

test('a new address is handed to MailerLite as unconfirmed', async () => {
  const email = 'new@example.com';
  const result = await signUp(email);
  assert.equal(result.sent, true);
  assert.deepEqual(result.calls, ['lookup', 'push unconfirmed']);
  assert.notEqual(row(email).mailerlite_at, null);
});

test('a failed MailerLite push falls back to our own confirmation mail', async () => {
  const email = 'push-failed@example.com';
  const result = await signUp(email, { push: false });
  assert.equal(result.sent, true);
  assert.deepEqual(result.calls, ['lookup', 'push unconfirmed', 'smtp']);
  assert.equal(row(email).mailerlite_at, null);
});

test('a failed lookup leaves MailerLite untouched and mails directly', async () => {
  const result = await signUp('lookup-failed@example.com', {
    lookup: { found: false, status: null, error: 'network' },
  });
  assert.equal(result.sent, true);
  assert.deepEqual(result.calls, ['lookup', 'smtp']);
});

test('without MailerLite the confirmation goes out by SMTP alone', async () => {
  const result = await signUp('smtp-only@example.com', { configured: false });
  assert.equal(result.sent, true);
  assert.deepEqual(result.calls, ['smtp']);
});

test('failed delivery releases the cooldown so the visitor can retry at once', async () => {
  for (const smtp of [false, new Error('SMTP down')]) {
    const email = `retry-${smtp === false ? 'false' : 'throw'}@example.com`;
    const first = await signUp(email, { configured: false, smtp });
    assert.equal(first.sent, false);
    assert.equal(row(email).confirm_sent_at, null);

    const retry = await signUp(email, { configured: false });
    assert.equal(retry.outcome, 'resent');
    assert.notEqual(retry.confirmToken, first.confirmToken);
    assert.equal(retry.sent, true);
  }
});

test('a stale release cannot clear the cooldown of a newer request', async () => {
  const email = 'stale@example.com';
  const first = await signUp(email, { configured: false, smtp: false });
  await signUp(email, { configured: false });
  store.releaseConfirmationAttempt(email, first.confirmToken);
  assert.notEqual(row(email).confirm_sent_at, null);
  assert.equal(store.subscribe({ email }).outcome, 'cooldown');
});
