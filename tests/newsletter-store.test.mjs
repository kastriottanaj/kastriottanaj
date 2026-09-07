import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = mkdtempSync(join(tmpdir(), 'newsletter-audit-'));
process.env.LEADS_DB_PATH = join(directory, 'test.db');
const { subscribe, confirmSubscriber, unsubscribe } = await import('../src/lib/newsletter-store.mjs');
const { getDb } = await import('../src/lib/sqlite.mjs');

test('unsubscribe revokes pending confirmation; fresh opt-in still works', () => {
  try {
    const { confirmToken } = subscribe({ email: 'audit@example.com' });
    const row = getDb().prepare('SELECT unsubscribe_token FROM subscribers').get();
    assert.equal(unsubscribe(row.unsubscribe_token), 'audit@example.com');
    assert.equal(confirmSubscriber(confirmToken), null);
    getDb().exec("UPDATE subscribers SET confirm_sent_at = datetime('now', '-16 minutes')");
    const fresh = subscribe({ email: 'audit@example.com' });
    assert.notEqual(fresh.confirmToken, confirmToken);
    assert.equal(confirmSubscriber(confirmToken), null);
    assert.equal(confirmSubscriber(fresh.confirmToken).firstConfirmation, true);
    assert.equal(confirmSubscriber(fresh.confirmToken).firstConfirmation, false);
    const active = getDb().prepare('SELECT unsubscribe_token FROM subscribers').get();
    unsubscribe(active.unsubscribe_token);
    assert.equal(confirmSubscriber(fresh.confirmToken), null);
  } finally {
    getDb().close();
    rmSync(directory, { recursive: true, force: true });
  }
});
