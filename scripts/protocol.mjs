/** Galaxy Expansion v1: offline verifier for ONE participant's JSONL stream.
 * The server remains authoritative. This module does not prove object identity.
 */
export const MAX_LINE_BYTES = 8000;
const SLOT_RE = /^[a-zA-Z0-9_-]{1,48}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const TYPES = new Set(['seed', 'star', 'planet']);

export function validateMessage(message) {
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return 'Message must be a JSON object';
  }
  if (message.type === 'reset') return null;
  if (message.type !== 'acquire' && message.type !== 'release') {
    return 'type must be acquire, release, or reset';
  }
  const slot = message.poolSlotId;
  if ((typeof slot !== 'string' && !Number.isSafeInteger(slot)) ||
      !SLOT_RE.test(String(slot))) {
    return 'Invalid poolSlotId (1..48 ASCII letters, digits, _ or -)';
  }
  if (!Number.isSafeInteger(message.generation) || message.generation < 1) {
    return 'generation must be a positive safe integer';
  }
  if (message.type === 'acquire') {
    const d = message.data;
    if (!d || typeof d !== 'object' || Array.isArray(d)) return 'Missing data object';
    if (typeof d.name !== 'string' || d.name.trim().length === 0 || d.name.length > 40) {
      return 'name must contain 1..40 characters and not be blank';
    }
    if (!TYPES.has(d.type)) return 'data.type must be seed, star, or planet';
    if (typeof d.color !== 'string' || !COLOR_RE.test(d.color)) {
      return 'data.color must be #RRGGBB';
    }
    if (typeof d.size !== 'number' || !Number.isFinite(d.size) || d.size < 0.3 || d.size > 3.5) {
      return 'data.size must be a finite number from 0.3 to 3.5';
    }
  }
  return null;
}

export class TranscriptValidator {
  constructor() {
    this.slots = new Map();
    this.events = 0;
    this.acquired = 0;
    this.released = 0;
    this.reused = 0;
    this.resets = 0;
  }

  accept(message) {
    const problem = validateMessage(message);
    if (problem) throw new Error(problem);
    const type = message.type;
    if (type === 'reset') {
      this.slots.clear();
      this.resets++;
      this.events++;
      return type;
    }
    const slotId = String(message.poolSlotId);
    const old = this.slots.get(slotId);
    if (type === 'acquire') {
      if (old?.active) throw new Error(`Slot ${slotId} is already active`);
      if (old && message.generation !== old.generation + 1) {
        throw new Error(`Reused slot ${slotId} needs generation ${old.generation + 1}`);
      }
      if (!old && message.generation !== 1) {
        throw new Error(`New slot ${slotId} must start with generation 1`);
      }
      if (!old && this.slots.size >= 500) {
        throw new Error('Participant slot limit (500) exceeded');
      }
      this.slots.set(slotId, { active: true, generation: message.generation });
      this.acquired++;
      if (old) this.reused++;
    } else {
      if (!old?.active) throw new Error(`Slot ${slotId} is not active`);
      if (old.generation !== message.generation) {
        throw new Error(`Stale release for slot ${slotId}: expected generation ${old.generation}`);
      }
      this.slots.set(slotId, { ...old, active: false });
      this.released++;
    }
    this.events++;
    return type;
  }

  acceptLine(line, number = null) {
    const context = number == null ? 'JSONL' : `Line ${number}`;
    if (Buffer.byteLength(line, 'utf8') > MAX_LINE_BYTES) {
      throw new Error(`${context}: line exceeds ${MAX_LINE_BYTES} UTF-8 bytes`);
    }
    if (!line.trim()) throw new Error(`${context}: empty stdout line is not a JSON message`);
    let parsed;
    try { parsed = JSON.parse(line); }
    catch (error) { throw new Error(`${context}: invalid JSON: ${error.message}`); }
    try { return this.accept(parsed); }
    catch (error) { throw new Error(`${context}: ${error.message}`); }
  }

  summary({ requireReuse = true } = {}) {
    if (requireReuse && (this.acquired < 2 || this.released < 1 || this.reused < 1)) {
      throw new Error('Need at least one Acquire -> Release -> Acquire reuse cycle');
    }
    return {
      events: this.events,
      acquired: this.acquired,
      released: this.released,
      reused: this.reused,
      resets: this.resets,
      active: [...this.slots.values()].filter(s => s.active).length,
      pooledSlots: this.slots.size,
    };
  }
}

export function validateTranscript(text, options = {}) {
  const verifier = new TranscriptValidator();
  const lines = text.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  for (let i = 0; i < lines.length; i++) verifier.acceptLine(lines[i], i + 1);
  return verifier.summary(options);
}
