/** Only a protocol handshake test double; NOT an Object Pool implementation. */
import { createInterface } from 'node:readline';
const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
const data = { name: 'Test Star', type: 'star', color: '#5dcaff', size: 1.2 };
const events = [
  { type: 'acquire', poolSlotId: '7', generation: 1, data },
  { type: 'release', poolSlotId: '7', generation: 1 },
  { type: 'acquire', poolSlotId: '7', generation: 2, data: { ...data, name: 'Reborn' } },
];
let next = 0;
rl.on('line', line => {
  const event = JSON.parse(line);
  if (event.type === 'init' || event.type === 'ack') {
    if (next < events.length) process.stdout.write(JSON.stringify(events[next++]) + '\n');
    else process.exit(0);
  }
});
