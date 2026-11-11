const STEPS = 128;
const TABLE = new Float32Array(STEPS);
for (let index = 0; index < STEPS; index += 1) {
  TABLE[index] = Math.sin((index / STEPS) * Math.PI * 2);
}

/** Lookup sine from a phase measured in whole turns. No per-pixel Math.sin. */
export function sampleSin(turns) {
  const index = Math.floor(turns * STEPS) & (STEPS - 1);
  return TABLE[index];
}

/** Shared breeze used by the flower, grass, petals, and clouds. */
export function createWind() {
  const wind = {
    time: 0,
    dt: 0.016,
    value: 0,
    scale: 1,
    update(dt) {
      this.dt = dt;
      this.time += dt;
      const breeze = sampleSin(this.time * 0.055) * 0.62 + sampleSin(this.time * 0.017) * 0.38;
      this.value = breeze * this.scale;
    },
  };
  return wind;
}
