// Counts walking/running steps from accelerometer samples (DeviceMotionEvent).
//
// Each sample's acceleration magnitude (including gravity) is compared with a slowly moving
// baseline (an exponential moving average, which tracks gravity and phone orientation).
// A step is a rise above the baseline by RISE m/s² that later falls back below FALL m/s²
// (hysteresis stops one bouncy step being counted twice), at least MIN_STEP_MS after the
// previous step — about 3.3 steps per second, faster than sprinting cadence.
export const RISE = 1.6;
export const FALL = 0.4;
export const MIN_STEP_MS = 300;
const BASELINE_WEIGHT = 0.08;

export class StepDetector {
  constructor() {
    this.reset();
  }

  reset() {
    this.steps = 0;
    this.baseline = null;
    this.armed = true;
    this.lastStepAt = -Infinity;
  }

  // x, y, z in m/s²; time in ms. Returns true when this sample completes a step.
  push(x, y, z, time) {
    if (![x, y, z, time].every(Number.isFinite)) return false;
    const magnitude = Math.hypot(x, y, z);
    if (this.baseline === null) {
      this.baseline = magnitude;
      return false;
    }
    this.baseline += (magnitude - this.baseline) * BASELINE_WEIGHT;
    const delta = magnitude - this.baseline;
    if (this.armed && delta > RISE && time - this.lastStepAt >= MIN_STEP_MS) {
      this.armed = false;
      this.lastStepAt = time;
      this.steps++;
      return true;
    }
    if (!this.armed && delta < FALL) this.armed = true;
    return false;
  }
}
