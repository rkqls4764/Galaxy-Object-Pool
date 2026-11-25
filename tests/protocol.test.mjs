import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { TranscriptValidator, validateMessage, validateTranscript } from '../scripts/protocol.mjs';

const star = (slot = '7', generation = 1, overrides = {}) => ({
  type: 'acquire', poolSlotId: slot, generation,
  data: { name: 'Aurora', type: 'star', color: '#5dcaff', size: 1.2, ...overrides },
});
const release = (slot = '7', generation = 1) => ({ type: 'release', poolSlotId: slot, generation });

test('example transcript passes full cycle', () => {
  const sample = readFileSync(new URL('../contracts/sample-events.jsonl', import.meta.url), 'utf8');
  const result = validateTranscript(sample);
  assert.equal(result.acquired, 2);
  assert.equal(result.released, 2);
  assert.equal(result.reused, 1);
  assert.equal(result.active, 0);
});

test('fixture CLI reports success', () => {
  const out = execFileSync(process.execPath, [
    'scripts/verify-protocol.mjs', '--fixture', 'contracts/sample-events.jsonl'
  ], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.match(out, /PASS: 4 events/);
});

test('process CLI performs init and ack handshake', () => {
  const out = execFileSync(process.execPath, [
    'scripts/verify-protocol.mjs', '--', process.execPath, 'tests/fixtures/mock-producer.mjs'
  ], { cwd: new URL('..', import.meta.url), encoding: 'utf8', timeout: 10000 });
  assert.match(out, /1 reuse/);
});

test('rejects duplicate acquire of an active slot', () => {
  const v = new TranscriptValidator();
  v.accept(star());
  assert.throws(() => v.accept(star()), /already active/);
});

test('rejects stale release generation', () => {
  const v = new TranscriptValidator();
  v.accept(star());
  assert.throws(() => v.accept(release('7', 2)), /Stale release/);
});

test('rejects reacquire without generation increment', () => {
  const v = new TranscriptValidator();
  v.accept(star());
  v.accept(release());
  assert.throws(() => v.accept(star('7', 1)), /needs generation 2/);
});

test('accepts reused slot with incremented generation', () => {
  const v = new TranscriptValidator();
  v.accept(star());
  v.accept(release());
  v.accept(star('7', 2, { color: '#a78bfa' }));
  assert.equal(v.summary().reused, 1);
});

test('reset allows fresh generation one', () => {
  const v = new TranscriptValidator();
  v.accept(star());
  v.accept({ type: 'reset' });
  v.accept(star());
  assert.equal(v.summary({ requireReuse: false }).resets, 1);
});

test('validates type, color, size and name', () => {
  assert.match(validateMessage(star('7', 1, { type: 'comet' })), /data.type/);
  assert.match(validateMessage(star('7', 1, { color: 'red' })), /data.color/);
  assert.match(validateMessage(star('7', 1, { size: 99 })), /data.size/);
  assert.match(validateMessage(star('7', 1, { name: '   ' })), /name/);
  assert.equal(validateMessage(star()), null);
});

test('requires complete reuse cycle, not just valid JSON', () => {
  const v = new TranscriptValidator();
  v.accept(star());
  assert.throws(() => v.summary(), /reuse cycle/);
});

test('rejects non JSON and oversized stdout', () => {
  const v = new TranscriptValidator();
  assert.throws(() => v.acceptLine('debug log', 1), /invalid JSON/);
  assert.throws(() => v.acceptLine('z'.repeat(8001), 2), /exceeds 8000/);
});

test('accepts numeric slot ID, rejects unsafe numeric slot ID', () => {
  assert.equal(validateMessage(star(7)), null);
  assert.match(validateMessage(star(2 ** 54)), /poolSlotId/);
});
