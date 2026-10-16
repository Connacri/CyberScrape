/**
 * CYBER-VACUUM // Procedural Sci-Fi Synthesizer via Web Audio API.
 * High-definition procedural audio engine - pure futuristic sci-fi sound design.
 * Features: FM synthesis, resonant filter sweeps, quantum vacuum vortices,
 * holographic tactile clicks, and crystal arpeggios.
 */
class CyberAudioSynth {
  private ctx: AudioContext | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = false;
  private lastItemSoundTime: number = 0;

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        // Master dynamics compressor to give that cinematic, punchy, sci-fi punch
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(6, this.ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.15, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.masterCompressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getDestination(): AudioNode | null {
    if (!this.ctx) return null;
    return this.masterCompressor || this.ctx.destination;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.initContext();
      this.playHoloTap();
    }
    return this.isMuted;
  }

  /**
   * Generates a brief burst of filtered white noise for plasma / air rush effects
   */
  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      // Brown/Pink filtered noise curve for warmer, deeper sci-fi air sound
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  /**
   * 1. Futuristic Quantum Vortex Suction
   * Combines sweeping plasma noise, descending sub-harmonic gravity drop,
   * and hypersonic resonant laser sweep.
   */
  public playVacuumSuck() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    try {
      const now = ctx.currentTime;

      // Layer A: Sweeping plasma wind / vortex air rush
      const noiseBuffer = this.createNoiseBuffer(ctx, 0.45);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2400, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(140, now + 0.42);
      noiseFilter.Q.setValueAtTime(6.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.28, now + 0.08);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(dest);
      noiseSource.start(now);
      noiseSource.stop(now + 0.46);

      // Layer B: Hypersonic descending sci-fi warp saw
      const saw = ctx.createOscillator();
      const sawFilter = ctx.createBiquadFilter();
      const sawGain = ctx.createGain();

      saw.type = 'sawtooth';
      saw.frequency.setValueAtTime(880, now);
      saw.frequency.exponentialRampToValueAtTime(65, now + 0.42);

      sawFilter.type = 'lowpass';
      sawFilter.frequency.setValueAtTime(2800, now);
      sawFilter.frequency.exponentialRampToValueAtTime(180, now + 0.42);
      sawFilter.Q.setValueAtTime(5.0, now);

      sawGain.gain.setValueAtTime(0.18, now);
      sawGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

      saw.connect(sawFilter);
      sawFilter.connect(sawGain);
      sawGain.connect(dest);

      saw.start(now);
      saw.stop(now + 0.45);

      // Layer C: Sub-bass 55Hz -> 28Hz gravity well drop
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(75, now);
      sub.frequency.exponentialRampToValueAtTime(28, now + 0.45);

      subGain.gain.setValueAtTime(0.35, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.46);

      sub.connect(subGain);
      subGain.connect(dest);

      sub.start(now);
      sub.stop(now + 0.47);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 2. Product Aspirated: Futuristic Holographic Quantum Chime
   * Crisp, ultra-clean sci-fi capture sound with crystal harmonic detune
   * and micro laser pop that feels addictive and instant.
   */
  public playItemAspirated() {
    if (this.isMuted) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastItemSoundTime < 45) {
      return; // prevent clipping pileup on high-speed sweeps
    }
    this.lastItemSoundTime = nowMs;

    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    try {
      const now = ctx.currentTime;

      // FM Carrier & Modulator for high-tech holographic texture
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const masterItemGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Frequencies: High crystalline cyber shimmer (A6 / 1760Hz range)
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(1760, now);
      carrier.frequency.exponentialRampToValueAtTime(2640, now + 0.04);
      carrier.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(880, now);
      modulator.frequency.linearRampToValueAtTime(3520, now + 0.08);

      modGain.gain.setValueAtTime(500, now);
      modGain.gain.exponentialRampToValueAtTime(10, now + 0.11);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.Q.setValueAtTime(3.5, now);

      masterItemGain.gain.setValueAtTime(0.18, now);
      masterItemGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      carrier.connect(filter);
      filter.connect(masterItemGain);
      masterItemGain.connect(dest);

      // Micro laser transient click on attack
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'triangle';
      click.frequency.setValueAtTime(4200, now);
      click.frequency.exponentialRampToValueAtTime(800, now + 0.02);

      clickGain.gain.setValueAtTime(0.15, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      click.connect(clickGain);
      clickGain.connect(dest);

      carrier.start(now);
      modulator.start(now);
      click.start(now);

      carrier.stop(now + 0.15);
      modulator.stop(now + 0.15);
      click.stop(now + 0.03);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 3. Futuristic Holographic Screen Tap / Click
   * Crisp micro tactile beep, sounds like touching a futuristic glass HUD
   */
  public playHoloTap(freq = 2400) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.015);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Audio fallback
    }
  }

  /**
   * Tactile click alias for holographic tap
   */
  public playClick(freq = 2400) {
    this.playHoloTap(freq);
  }


  /**
   * 4. Futuristic Tab / View Channel Switcher
   * Double frequency whoosh with cyber harmonic glissando
   */
  public playTabSwitch() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1100, now);
      osc1.frequency.exponentialRampToValueAtTime(2200, now + 0.07);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1650, now);
      osc2.frequency.exponentialRampToValueAtTime(3300, now + 0.07);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(900, now);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.1);
      osc2.stop(now + 0.1);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 5. Radar Scanner Sweep (Matrix Category Discovery)
   */
  public playScanSweep() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(1900, now + 0.16);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(5, now);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 6. Category Complete / Master Sweep Fanfare
   * Cyberpunk synth chord arpeggio with crystalline harmonics and synthetic vocal announce
   */
  public playMasterSweepCategoryAlert(categoryName?: string, itemsCount?: number) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150, 80, 350]);
      } catch {
        // ignore
      }
    }

    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    try {
      // Blade Runner / Cyberpunk power chord arpeggio (C5 - G5 - C6 - E6 - G6)
      const freqs = [523.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      freqs.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(freq, now);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq * 1.004, now); // subtle unison detune

          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.masterCompressor || this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.55);
          osc2.stop(now + 0.55);
        }, idx * 60);
      });

      // Synthetic cyber voice announcement via Web Speech API
      if (categoryName && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setTimeout(() => {
          try {
            window.speechSynthesis.cancel();
            const phrase =
              itemsCount && itemsCount > 0
                ? `Catégorie ${categoryName} aspirée et scellée avec succès. ${itemsCount} articles récoltés.`
                : `Catégorie ${categoryName} terminée avec succès.`;
            const utter = new SpeechSynthesisUtterance(phrase);
            utter.lang = 'fr-FR';
            utter.rate = 1.06;
            utter.pitch = 1.05;
            utter.volume = 0.95;
            window.speechSynthesis.speak(utter);
          } catch {
            // speech synthesis fallback
          }
        }, 420);
      }
    } catch {
      // Audio fallback
    }
  }

  /**
   * 7. Digital Matrix Chirp
   */
  public playChirp(freq = 1400, duration = 0.04) {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + duration);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 8. Category Unlocked Power Chime
   */
  public playCategoryUnlocked() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          osc.connect(gain);
          gain.connect(this.masterCompressor || this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.19);
        }, idx * 45);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * 9. Complete Fanfare (Major 9th Cyber Shimmer)
   */
  public playComplete() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.0],
      [659.25, 830.61, 987.77],
      [1046.5, 1318.51, 1567.98],
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
          gain.gain.setValueAtTime(0.09, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          gain.connect(this.masterCompressor || this.ctx!.destination);
          osc.start(now);
          osc.stop(now + 0.3);
        });
      }, i * 90);
    });
  }

  /**
   * 10. Item Disintegration / Deletion Swoosh
   */
  public playItemDeleted() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.22);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 11. Full Catalog Purged Sound
   */
  public playCatalogPurged() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.38);

      sub.type = 'triangle';
      sub.frequency.setValueAtTime(160, now);
      sub.frequency.exponentialRampToValueAtTime(25, now + 0.45);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      sub.connect(gain);
      gain.connect(dest);

      osc.start(now);
      sub.start(now);
      osc.stop(now + 0.46);
      sub.stop(now + 0.46);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 12. Futuristic Warp Laser Beam
   */
  public playWarpLaser() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(3200, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.16);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.16);
      filter.Q.setValueAtTime(6, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 13. Neural Matrix Pulse (Deep high-tech ping)
   */
  public playNeuralPulse() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 14. Price Drop Siren / Electronic Alert Chime
   */
  public playPriceAlert() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const freqs = [880, 1174.66, 1760];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.15, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.2);
      });
    } catch {
      // Audio fallback
    }
  }

  /**
   * 15. Sci-Fi Matrix Glitch Burst
   */
  public playMatrixGlitch() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.setValueAtTime(1800, now + 0.03);
      osc.frequency.setValueAtTime(450, now + 0.06);
      osc.frequency.setValueAtTime(3200, now + 0.09);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback
    }
  }

  /**
   * 16. Sub-Bass Lock Confirm (Deep tactile hit when saving to IndexedDB)
   */
  public playSubBassLock() {
    if (this.isMuted) return;
    const ctx = this.initContext();
    const dest = this.getDestination();
    if (!ctx || !dest) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fallback
    }
  }

  // ==============================================================
  // FRENCH FEMALE AI VOCAL SYNTHESIZER ("CYBER-VOIX FÉMININE")
  // ==============================================================
  public isVoiceEnabled: boolean = true;
  private frenchFemaleVoice: SpeechSynthesisVoice | null = null;
  private voiceLoaded: boolean = false;
  private lastSpokenTime: number = 0;

  public toggleVoice(): boolean {
    this.isVoiceEnabled = !this.isVoiceEnabled;
    if (this.isVoiceEnabled) {
      this.speakFrenchFemale("Assistant vocal cybernétique activé. Système prêt.", true);
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    return this.isVoiceEnabled;
  }

  private loadFrenchVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Prefer French female voices (Google français, Amélie, Audrey, Marie, Céline, Julie, Hortense, etc.)
    const frenchVoices = voices.filter(v => v.lang.startsWith('fr'));
    const femaleKeywords = ['femme', 'female', 'amelie', 'amélie', 'audrey', 'marie', 'céline', 'celine', 'julie', 'hortense', 'virginie', 'denise', 'google'];
    
    let preferred = frenchVoices.find(v => {
      const name = v.name.toLowerCase();
      return femaleKeywords.some(k => name.includes(k));
    });

    if (!preferred && frenchVoices.length > 0) {
      preferred = frenchVoices[0];
    }

    this.frenchFemaleVoice = preferred || null;
    this.voiceLoaded = true;
  }

  public speakFrenchFemale(text: string, force = false) {
    if (!this.isVoiceEnabled && !force) return;
    if (this.isMuted && !force) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    // Debounce non-forced speeches to avoid stacking
    if (!force && now - this.lastSpokenTime < 2800) {
      return;
    }
    this.lastSpokenTime = now;

    try {
      if (!this.voiceLoaded) {
        this.loadFrenchVoice();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => this.loadFrenchVoice();
        }
      }

      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'fr-FR';
      if (this.frenchFemaleVoice) {
        utter.voice = this.frenchFemaleVoice;
      }
      // Crisp, slightly elevated sci-fi pitch for a sleek female robot assistant
      utter.pitch = 1.18;
      utter.rate = 1.04;
      utter.volume = 0.95;

      window.speechSynthesis.speak(utter);
    } catch {
      // Speech synthesis unsupported or blocked
    }
  }

  public speakSystemReady() {
    this.speakFrenchFemale("Système Cyber-Vacuum activé. Base matricielle connectée.", true);
  }

  public speakScrapeStarted(target: string = "catalogue") {
    this.speakFrenchFemale(`Aspiration matricielle lancée. Scan haute performance en cours.`);
  }

  public speakBatchSaved(count: number, total: number) {
    this.speakFrenchFemale(`Lot sécurisé. ${count} nouveaux articles consolidés.`);
  }

  public speakCategoryCompleted(category: string, count: number) {
    this.speakFrenchFemale(`Catégorie ${category} terminée avec succès. ${count} articles archivés.`);
  }

  public speakBackgroundModeActive() {
    this.speakFrenchFemale(`Mode arrière-plan engagé. Aspiration continue active.`, true);
  }

  public speakPriceDropAlert(percent: number) {
    this.speakFrenchFemale(`Alerte tarifaire. Baisse de ${percent} pour cent détectée sur le marché.`);
  }

  public speakSupabaseSynced(count: number) {
    this.speakFrenchFemale(`Synchronisation Cloud Supabase validée pour ${count} produits.`);
  }

  public speakSortApplied(label: string) {
    this.speakFrenchFemale(`Tri ${label} appliqué.`);
  }
}

export const cyberAudio = new CyberAudioSynth();

