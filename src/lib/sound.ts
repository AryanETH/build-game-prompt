/*
  Lightweight WebAudio SoundManager to provide ambient soundscapes and simple
  game action SFX without external assets. Designed to be heuristic-driven and
  optionally bridged by postMessage events coming from the iframe content.
*/

export type SoundTheme = 'arcade' | 'space' | 'forest' | 'ocean' | 'spooky';

export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized = false;
  private ambientIntervalId: number | null = null;
  private theme: SoundTheme = 'arcade';
  private volume: number = 0.7; // 0..1

  init(): void {
    if (this.isInitialized) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    this.audioCtx = new Ctx();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.audioCtx.destination);
    this.isInitialized = true;
  }

  async resumeIfSuspended(): Promise<void> {
    if (!this.audioCtx) return;
    if (this.audioCtx.state !== 'running') {
      try { await this.audioCtx.resume(); } catch {}
    }
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) this.masterGain.gain.value = this.volume;
  }

  setTheme(theme: SoundTheme): void {
    this.theme = theme;
  }

  stopAmbient(): void {
    if (this.ambientIntervalId) {
      window.clearInterval(this.ambientIntervalId);
      this.ambientIntervalId = null;
    }
  }

  startAmbient(): void {
    if (!this.isInitialized) this.init();
    if (!this.audioCtx || !this.masterGain) return;
    this.stopAmbient();
    // Schedule lightweight ambient based on theme
    const schedule = () => {
      switch (this.theme) {
        case 'space':
          this.playDrone(110, 4, 'sine', 0.15);
          this.playBeep(880 + Math.random() * 440, 0.08, 'square', 0.12);
          break;
        case 'forest':
          if (Math.random() < 0.6) this.playChirp();
          this.playNoise(0.2, 2000, 0.05);
          break;
        case 'ocean':
          this.playNoise(0.6, 500, 0.08, 'lowpass');
          break;
        case 'spooky':
          this.playDrone(70 + Math.random() * 20, 3, 'triangle', 0.12);
          break;
        case 'arcade':
        default:
          if (Math.random() < 0.5) this.playBeep(440 * (1 + Math.random()), 0.06, 'square', 0.10);
          break;
      }
    };
    schedule();
    this.ambientIntervalId = window.setInterval(schedule, 900);
  }

  playEffect(name: string): void {
    switch (name) {
      case 'jump':
        this.playBeep(660, 0.08, 'square', 0.2);
        break;
      case 'shoot':
        this.playBeep(1200, 0.04, 'sawtooth', 0.2);
        break;
      case 'hit':
        this.playNoise(0.12, 800, 0.2);
        break;
      case 'coin':
        this.playArpeggio([880, 1175, 1567], 0.04, 'square', 0.18);
        break;
      default:
        this.playBeep(500 + Math.random() * 400, 0.05, 'square', 0.15);
    }
  }

  attachToIframeWindow(win: Window): void {
    // Resume on first interaction
    const unlock = async () => { this.init(); await this.resumeIfSuspended(); };
    win.addEventListener('pointerdown', unlock, { once: true, capture: true });
    win.addEventListener('keydown', unlock, { once: true, capture: true });

    // Heuristic mapping of common inputs to SFX
    win.addEventListener('keydown', (e: KeyboardEvent) => {
      const code = e.code || '';
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') this.playEffect('jump');
      if (code === 'KeyZ' || code === 'KeyX' || code === 'KeyJ' || code === 'KeyK') this.playEffect('shoot');
    });
    win.addEventListener('pointerdown', () => this.playEffect('shoot'));

    // Bridge for explicit messages from game code
    const onMessage = (event: MessageEvent) => {
      const data = (event && event.data) || {};
      if (!data || typeof data !== 'object') return;
      if (data.type === 'game:action' && typeof data.action === 'string') {
        this.playEffect(data.action);
      }
      if (data.type === 'game:ambient' && typeof data.enabled === 'boolean') {
        if (data.enabled) this.startAmbient(); else this.stopAmbient();
      }
      if (data.type === 'game:volume' && typeof data.volume === 'number') {
        this.setVolume(Math.max(0, Math.min(1, data.volume)));
      }
    };
    win.addEventListener('message', onMessage);
  }

  // Internal helpers
  private playBeep(freq: number, duration: number, type: OscillatorType, gain = 0.15) {
    if (!this.isInitialized) this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(this.masterGain);
    const now = this.audioCtx.currentTime;
    osc.start(now);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.stop(now + duration + 0.02);
  }

  private playNoise(duration: number, cutoffHz = 1000, gain = 0.1, filterType: BiquadFilterType = 'highpass') {
    if (!this.isInitialized) this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.audioCtx.createBufferSource();
    src.buffer = buffer;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = cutoffHz;
    const g = this.audioCtx.createGain();
    g.gain.value = gain;
    src.connect(filter).connect(g).connect(this.masterGain);
    const now = this.audioCtx.currentTime;
    src.start(now);
    src.stop(now + duration + 0.02);
  }

  private playDrone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.1) {
    if (!this.isInitialized) this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = 0.0001;
    osc.connect(g).connect(this.masterGain);
    const now = this.audioCtx.currentTime;
    osc.start(now);
    g.gain.exponentialRampToValueAtTime(gain, now + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.stop(now + duration + 0.05);
  }

  private playChirp() {
    this.playBeep(1200 + Math.random() * 1200, 0.05, 'sine', 0.12);
  }

  private playArpeggio(freqs: number[], stepDur: number, type: OscillatorType, gain = 0.15) {
    freqs.forEach((f, i) => setTimeout(() => this.playBeep(f, stepDur, type, gain), i * (stepDur * 1000 + 10)));
  }
}
