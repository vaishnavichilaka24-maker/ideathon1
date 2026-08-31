import { SoundscapeType } from '../types';

class SoundscapeSynth {
  private ctx: AudioContext | null = null;
  private currentType: SoundscapeType = 'off';
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public stop() {
    if (this.activeNodes.length > 0 && this.masterGain && this.ctx) {
      // Gentle fade out
      this.masterGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.2);
      setTimeout(() => {
        this.activeNodes.forEach((n) => {
          try {
            if (n.stop) n.stop();
            if (n.disconnect) n.disconnect();
          } catch {}
        });
        this.activeNodes = [];
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
      }, 250);
    }
    this.currentType = 'off';
  }

  public play(type: SoundscapeType) {
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (type === 'off') {
      this.stop();
      return;
    }

    if (this.currentType === type) {
      return;
    }

    // Stop current soundscape
    this.stop();

    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.currentType = type;

      if (type === '432hz') {
        this.start432Hz();
      } else if (type === 'theta') {
        this.startBinauralTheta();
      } else if (type === 'ocean') {
        this.startOceanSurf();
      } else if (type === 'rain') {
        this.startRainResonance();
      }
    }, 280);
  }

  private start432Hz() {
    if (!this.ctx || !this.masterGain) return;

    const fundamental = 432;
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamental, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(fundamental / 2, this.ctx.currentTime); // 216 Hz sub

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(fundamental * 1.5, this.ctx.currentTime); // 648 Hz harmonic

    const gain1 = this.ctx.createGain();
    gain1.gain.setValueAtTime(0.35, this.ctx.currentTime);

    const gain2 = this.ctx.createGain();
    gain2.gain.setValueAtTime(0.25, this.ctx.currentTime);

    const gain3 = this.ctx.createGain();
    gain3.gain.setValueAtTime(0.08, this.ctx.currentTime);

    // Warm low-pass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);

    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(filter);
    gain2.connect(filter);
    gain3.connect(filter);

    filter.connect(this.masterGain);

    osc1.start();
    osc2.start();
    osc3.start();

    this.activeNodes.push(osc1, osc2, osc3, filter, gain1, gain2, gain3);
  }

  private startBinauralTheta() {
    if (!this.ctx || !this.masterGain) return;

    const baseFreq = 136.1; // OM earth frequency
    const beatFreq = 5.5; // Theta relaxation wave

    // Left Ear
    const oscL = this.ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    // Right Ear
    const oscR = this.ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(baseFreq + beatFreq, this.ctx.currentTime);

    const merger = this.ctx.createChannelMerger(2);
    const gainL = this.ctx.createGain();
    gainL.gain.setValueAtTime(0.3, this.ctx.currentTime);
    const gainR = this.ctx.createGain();
    gainR.gain.setValueAtTime(0.3, this.ctx.currentTime);

    oscL.connect(gainL);
    oscR.connect(gainR);

    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);

    merger.connect(this.masterGain);

    oscL.start();
    oscR.start();

    this.activeNodes.push(oscL, oscR, gainL, gainR, merger);
  }

  private startOceanSurf() {
    if (!this.ctx || !this.masterGain) return;

    // Buffer for brown/pink noise
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise approximation
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Ocean swell LFO
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 second wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();

    this.activeNodes.push(whiteNoise, lfo, filter, lfoGain, noiseGain);
  }

  private startRainResonance() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const rainSource = this.ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const rainGain = this.ctx.createGain();
    rainGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    rainSource.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    rainSource.start();

    this.activeNodes.push(rainSource, filter, rainGain);
  }
}

export const soundscapeSynth = new SoundscapeSynth();
