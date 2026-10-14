/**
 * Cybernetic Sci-Fi Sound Synthesizer via Web Audio API.
 * High-definition procedural audio engine - futuristic sci-fi sound design.
 */
class CyberAudioSynth {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private lastItemSoundTime: number = 0;

  private initContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.initContext();
      this.playChirp(880, 0.05);
    }
    return this.isMuted;
  }

  // Futuristic Quantum Vortex Suction (Sub-bass rumble + resonant hypersonic sweep)
  public playVacuumSuck() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Hypersonic descending saw
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.42);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.frequency.exponentialRampToValueAtTime(120, now + 0.42);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);

      // 2. Sub-bass warp pulse
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(130, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 0.45);

      subGain.gain.setValueAtTime(0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      sub.connect(subGain);
      subGain.connect(ctx.destination);

      sub.start(now);
      sub.stop(now + 0.46);
    } catch {
      // Ignore audio glitches
    }
  }

  // Product Aspirated Chime: Futuristic holographic quantum chime with dual detuning
  public playItemAspirated() {
    if (this.isMuted) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastItemSoundTime < 60) {
      return; // prevent audio buffer pileup during ultra-fast vacuuming
    }
    this.lastItemSoundTime = nowMs;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Futuristic frequencies (FM-like shimmer)
      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(1200, now);
      osc1.frequency.exponentialRampToValueAtTime(2400, now + 0.08);

      osc2.frequency.setValueAtTime(1800, now);
      osc2.frequency.exponentialRampToValueAtTime(3600, now + 0.12);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.19);
      osc2.stop(now + 0.19);
    } catch {
      // Ignore
    }
  }

  // Futuristic radar / category scanner sweep
  public playScanSweep() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.18);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // Ignore
    }
  }

  // Category Complete & Locked In Sound (Futuristic Power Chord)
  public playCategoryUnlocked() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.16);
        }, idx * 45);
      });
    } catch {
      // Ignore
    }
  }

  // Digital Matrix Chirp
  public playChirp(freq = 1200, duration = 0.04) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.setValueAtTime(freq * 1.5, now + duration / 2);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Ignore
    }
  }

  // High-Priority Attention Alert for Master Sweep Category Completion
  public playMasterSweepCategoryAlert(categoryName?: string, itemsCount?: number) {
    // 0. Trigger device vibration for smartphones in pockets or desks
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch {
        // ignore vibration permissions
      }
    }

    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      // 1. Crystal harmonic chime sequence (C5 -> E5 -> G5 -> C6 -> E6 bell harmonics with resonant shimmer)
      const bells = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      bells.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(freq, now);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq * 1.5, now); // Fifth harmonic shimmer

          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.58);
          osc2.stop(now + 0.58);
        }, idx * 65);
      });

      // 2. Synthetic vocal notification via Web Speech API (tells user which category finished even if in another room/tab)
      if (categoryName && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setTimeout(() => {
          try {
            window.speechSynthesis.cancel(); // clear queue
            const phrase = itemsCount && itemsCount > 0
              ? `Catégorie ${categoryName} terminée avec succès ! ${itemsCount} nouveaux articles scellés.`
              : `Catégorie ${categoryName} terminée avec succès.`;
            const utter = new SpeechSynthesisUtterance(phrase);
            utter.lang = 'fr-FR';
            utter.rate = 1.05;
            utter.pitch = 1.02;
            utter.volume = 0.95;
            window.speechSynthesis.speak(utter);
          } catch {
            // speech synthesis optional fallback
          }
        }, 420);
      }
    } catch {
      // Ignore audio glitches
    }
  }

  // Futuristic Completion Fanfare
  public playComplete() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const chords = [
      [523.25, 659.25, 783.99], // C Major
      [587.33, 739.99, 880.0],  // D Major
      [659.25, 830.61, 987.77], // E Major
      [1046.5, 1318.5, 1567.98], // High C shimmer
    ];

    chords.forEach((chord, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        chord.forEach((freq) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          osc.start(now);
          osc.stop(now + 0.3);
        });
      }, i * 90);
    });
  }
}

export const cyberAudio = new CyberAudioSynth();
