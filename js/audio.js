/**
 * OBS Ölüm Sayacı - Dahili Web Audio API Ses Sentezleyici & Yöneticisi
 * Harici dosya bağımlılığı olmadan %100 her tarayıcıda çalışan kristal netliğinde sesler.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.customAudio = new Audio();
        this.soundVolume = 0.8;
    }

    initContext() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }

    play(soundType, customUrl = '') {
        try {
            this.initContext();

            if (soundType === 'none' || soundType === 'mute') return;

            if (soundType === 'custom' && customUrl) {
                this.customAudio.src = customUrl;
                this.customAudio.volume = this.soundVolume;
                this.customAudio.currentTime = 0;
                this.customAudio.play().catch(e => console.log("Custom sound play error:", e));
                return;
            }

            if (!this.ctx) return;

            switch (soundType) {
                case 'souls_death':
                case 'gong':
                    this.playSoulsGong();
                    break;
                case 'retro_death':
                case 'arcade':
                    this.playRetroDeath();
                    break;
                case 'minecraft_oof':
                case 'oof':
                    this.playOofSound();
                    break;
                case 'dramatic_boom':
                case 'boom':
                    this.playDramaticBoom();
                    break;
                case 'cyber_glitch':
                case 'glitch':
                    this.playCyberGlitch();
                    break;
                case 'bell_chime':
                case 'bell':
                    this.playBellChime();
                    break;
                default:
                    this.playSoulsGong();
                    break;
            }
        } catch (err) {
            console.warn("Sound play error:", err);
        }
    }

    // 1. Dark Souls Gothic Bell / Gong (Ağır çan ve derin yankı)
    playSoulsGong() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.soundVolume * 0.9, now);
        masterGain.connect(ctx.destination);

        // Derin Bas Vuruşu
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(75, now);
        bassOsc.frequency.exponentialRampToValueAtTime(30, now + 1.8);
        bassGain.gain.setValueAtTime(0.8, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
        bassOsc.connect(bassGain);
        bassGain.connect(masterGain);
        bassOsc.start(now);
        bassOsc.stop(now + 2.0);

        // Metalik Çan / Gong frekansları
        [220, 330, 440, 587, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 2.5);

            const initialGain = 0.35 / (idx + 1);
            gain.gain.setValueAtTime(initialGain, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2 + idx * 0.3);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 2.8);
        });
    }

    // 2. 8-Bit Retro Arcade Death (Klasik Mario / Arcade ölüm inişi)
    playRetroDeath() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.soundVolume * 0.7, now);
        masterGain.connect(ctx.destination);

        const notes = [440, 392, 349, 311, 261, 220, 174, 130];
        const stepTime = 0.08;

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            const startTime = now + idx * stepTime;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.4, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + stepTime);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(startTime);
            osc.stop(startTime + stepTime);
        });
    }

    // 3. Punch / Oof vuruşu
    playOofSound() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.soundVolume * 0.8, now);
        masterGain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // 4. Dramatic Sub Boom
    playDramaticBoom() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.soundVolume * 0.9, now);
        masterGain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 1.2);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.4);
    }

    // 5. Cyber Glitch / Sci-Fi Zap
    playCyberGlitch() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.soundVolume * 0.6, now);
        masterGain.connect(ctx.destination);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.1);
        osc.frequency.linearRampToValueAtTime(600, now + 0.18);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    // 6. Clean Bell / Chime
    playBellChime() {
        const ctx = this.ctx;
        const now = ctx.currentTime;
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.soundVolume * 0.7, now);
        masterGain.connect(ctx.destination);

        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            const startTime = now + idx * 0.05;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(startTime);
            osc.stop(startTime + 1.3);
        });
    }
}

// Global Sound Instance
window.soundManager = new SoundManager();
