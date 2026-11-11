/**
 * Soft night bed, silent until the sound button is pressed.
 * Tones are synthesized. No audio files are loaded.
 */
export function createSound() {
  let context = null;
  let master = null;
  let muted = true;
  let paused = false;

  function tone(frequency, duration, delay, type, gainValue) {
    if (!context || muted || paused) {
      return;
    }
    const now = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function ensure() {
    if (context) {
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const length = context.sampleRate * 2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      previous = previous * 0.97 + white * 0.03;
      data[index] = previous * 3;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;
    const wind = context.createGain();
    wind.gain.value = 0.035;
    noise.connect(filter);
    filter.connect(wind);
    wind.connect(master);
    noise.start();

    const drone = context.createGain();
    drone.gain.value = 0.02;
    drone.connect(master);
    for (const frequency of [220, 329.63]) {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      voice.gain.value = frequency < 300 ? 0.55 : 0.28;
      oscillator.connect(voice);
      voice.connect(drone);
      oscillator.start();
    }
  }

  function apply() {
    if (!master || !context) {
      return;
    }
    const level = !muted && !paused ? 1 : 0;
    master.gain.setTargetAtTime(level, context.currentTime, 0.06);
  }

  return {
    get muted() {
      return muted;
    },
    async toggle() {
      ensure();
      if (context.state === "suspended") {
        await context.resume();
      }
      muted = !muted;
      apply();
      return !muted;
    },
    setPaused(value) {
      paused = value;
      apply();
    },
    chime() {
      tone(523.25, 0.22, 0, "sine", 0.05);
      tone(659.25, 0.34, 0.05, "sine", 0.035);
    },
    tick() {
      tone(880, 0.12, 0, "sine", 0.04);
    },
    moon() {
      tone(392, 0.4, 0, "sine", 0.04);
      tone(523.25, 0.55, 0.08, "sine", 0.028);
    },
    shoot() {
      if (!context || muted || paused) {
        return;
      }
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(1400, now);
      oscillator.frequency.exponentialRampToValueAtTime(280, now + 0.45);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.03, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + 0.5);
    },
  };
}
