#!/usr/bin/env node
/** Verify a fixture or a finite participant program's stdout JSONL.
 * Usage:
 *   node scripts/verify-protocol.mjs --fixture contracts/sample-events.jsonl
 *   node scripts/verify-protocol.mjs -- python solution/main.py
 */
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { TranscriptValidator, validateTranscript } from './protocol.mjs';

function success(summary) {
  console.log(`PASS: ${summary.events} events, ${summary.acquired} acquire, ` +
    `${summary.released} release, ${summary.reused} reuse, ${summary.active} active`);
  console.log('NOTE: Protocol validity does NOT prove the same actual object instance was reused.');
}

async function verifyCommand(command, args) {
  const verifier = new TranscriptValidator();
  const problems = [];
  let lineNumber = 0;
  let timedOut = false;
  const timeoutMs = Math.min(60000, Math.max(1000, Number(process.env.GALAXY_VERIFY_TIMEOUT_MS) || 15000));
  const child = spawn(command, args, { shell: false, stdio: ['pipe', 'pipe', 'inherit'] });
  child.stdin.on('error', (error) => {
    if (error.code !== 'EPIPE' && error.code !== 'ERR_STREAM_DESTROYED') problems.push(`stdin: ${error.message}`);
  });
  const output = createInterface({ input: child.stdout, crlfDelay: Infinity });
  const outputClosed = new Promise(resolve => output.once('close', resolve));
  output.on('line', line => {
    lineNumber++;
    if (lineNumber > 2000) {
      problems.push('Too many messages (limit: 2000)');
      child.kill();
      return;
    }
    try {
      const action = verifier.acceptLine(line, lineNumber);
      if (child.stdin.writable) {
        child.stdin.write(JSON.stringify({ type: 'ack', action, revision: verifier.events }) + '\n');
      }
    } catch (error) {
      problems.push(error.message);
      if (child.stdin.writable) child.stdin.write(JSON.stringify({ type: 'error', message: error.message }) + '\n');
    }
  });
  const exited = new Promise(resolve => {
    child.once('error', error => {
      problems.push(`Cannot launch program: ${error.message}`);
    });
    child.once('close', (code, signal) => resolve({ code, signal }));
  });
  const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
  if (child.stdin.writable) {
    child.stdin.write(JSON.stringify({ type: 'init', participantId: 'contract-test' }) + '\n');
  }
  try {
    const result = await exited;
    await outputClosed;
    if (timedOut) problems.push(`Program did not finish within ${timeoutMs}ms`);
    if (result.code !== 0) problems.push(`Program exited with ${result.code ?? result.signal}`);
    if (problems.length) throw new Error(problems.slice(0, 12).join('\n'));
    return verifier.summary();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--fixture' && args.length === 2) {
    success(validateTranscript(await readFile(args[1], 'utf8')));
    return;
  }
  if (args[0] === '--' && args.length >= 2) {
    success(await verifyCommand(args[1], args.slice(2)));
    return;
  }
  console.error('Usage: node scripts/verify-protocol.mjs --fixture <file.jsonl>');
  console.error('   or: node scripts/verify-protocol.mjs -- <executable> [arguments...]');
  process.exitCode = 2;
}

main().catch(error => { console.error(`FAIL: ${error.message}`); process.exitCode = 1; });
