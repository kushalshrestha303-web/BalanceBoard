import test from 'node:test';
import assert from 'node:assert/strict';
import { StepDetector } from './stepDetector.js';

// Simulates a phone in a pocket: gravity plus a vertical bounce at the given cadence, sampled at 50 Hz.
function walk(detector, { stepsPerSecond, seconds, amplitude = 3, noise = 0.15, seed = 1 }) {
  let random = seed;
  const jitter = () => { random = (random * 16807) % 2147483647; return (random / 2147483647 - 0.5) * 2 * noise; };
  for (let t = 0; t < seconds * 1000; t += 20) {
    const bounce = amplitude * Math.max(0, Math.sin(2 * Math.PI * stepsPerSecond * t / 1000));
    detector.push(0.3 + jitter(), 9.81 + bounce + jitter(), 0.5 + jitter(), t);
  }
  return detector.steps;
}

test('counts steps at walking and running cadence within 5%', () => {
  for (const cadence of [1.8, 2.5]) {
    const steps = walk(new StepDetector(), { stepsPerSecond: cadence, seconds: 60 });
    const expected = cadence * 60;
    assert.ok(Math.abs(steps - expected) / expected < 0.05, `${cadence}/s: counted ${steps}, expected ~${expected}`);
  }
});

test('ignores a phone lying still and small hand tremor', () => {
  assert.equal(walk(new StepDetector(), { stepsPerSecond: 2, seconds: 30, amplitude: 0 }), 0);
  assert.equal(walk(new StepDetector(), { stepsPerSecond: 8, seconds: 30, amplitude: 0.8 }), 0);
});

test('never exceeds the physical cadence limit', () => {
  const steps = walk(new StepDetector(), { stepsPerSecond: 10, seconds: 10, amplitude: 6 });
  assert.ok(steps <= 34, `counted ${steps}`);
});

test('ignores invalid samples', () => {
  const d = new StepDetector();
  assert.equal(d.push(null, NaN, 1, 0), false);
  assert.equal(d.steps, 0);
});
