let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3): void {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playSessionStart(): void {
  playTone(440, 0.15, "sine", 0.25);
  setTimeout(() => playTone(554, 0.15, "sine", 0.25), 150);
  setTimeout(() => playTone(659, 0.3, "sine", 0.3), 300);
}

export function playSessionEnd(): void {
  playTone(659, 0.15, "sine", 0.3);
  setTimeout(() => playTone(554, 0.15, "sine", 0.3), 150);
  setTimeout(() => playTone(440, 0.15, "sine", 0.3), 300);
  setTimeout(() => playTone(330, 0.4, "sine", 0.35), 450);
}

export function playViolationAlert(): void {
  playTone(880, 0.1, "square", 0.2);
  setTimeout(() => playTone(660, 0.1, "square", 0.2), 120);
  setTimeout(() => playTone(880, 0.2, "square", 0.2), 240);
}

export function playBreakStart(): void {
  playTone(528, 0.2, "sine", 0.2);
  setTimeout(() => playTone(660, 0.3, "sine", 0.25), 200);
}

export function playTick(): void {
  playTone(1000, 0.05, "sine", 0.05);
}
