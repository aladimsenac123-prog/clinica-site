/**
 * Biometric HUD Canvas Renderer & Audio Synthesizer
 */
class HudRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.audioCtx = null;
  }

  _initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
  }

  playBeep(frequency = 880, type = 'sine', duration = 0.15) {
    try {
      this._initAudio();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  playSuccessSound() {
    this.playBeep(587.33, 'sine', 0.1); // D5
    setTimeout(() => this.playBeep(880, 'sine', 0.2), 110); // A5
  }

  playErrorSound() {
    this.playBeep(220, 'sawtooth', 0.25);
  }

  clear() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Draws cyberpunk/clinical style biometric frame and landmarks
   */
  drawBiometricHUD(detection, label = '', state = 'tracking') {
    if (!this.ctx || !detection) return;
    this.clear();

    const box = detection.detection.box;
    const ctx = this.ctx;

    // Color definitions
    let primaryColor = '#14b8a6'; // teal
    let glowColor = 'rgba(94, 234, 212, 0.4)';

    if (state === 'success') {
      primaryColor = '#10b981';
      glowColor = 'rgba(16, 185, 129, 0.6)';
    } else if (state === 'denied' || state === 'spoof') {
      primaryColor = '#ef4444';
      glowColor = 'rgba(239, 68, 68, 0.6)';
    }

    ctx.save();
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;

    const x = box.x;
    const y = box.y;
    const w = box.width;
    const h = box.height;
    const cornerLength = Math.min(24, w / 4);

    // Corner targeting lines
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(x, y + cornerLength);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerLength, y);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLength, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cornerLength);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(x, y + h - cornerLength);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cornerLength, y + h);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(x + w - cornerLength, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cornerLength);
    ctx.stroke();

    // Draw 68 Facial Landmarks
    if (detection.landmarks) {
      const positions = detection.landmarks.positions;
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 8;

      positions.forEach((pt, index) => {
        // Highlight eyes and nose
        const isKeyPoint = index === 30 || index === 36 || index === 45 || index === 48 || index === 54;
        const radius = isKeyPoint ? 3 : 1.8;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Label tag
    if (label) {
      ctx.restore();
      ctx.save();
      ctx.font = '600 13px Inter, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const pad = 10;

      ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x + (w - textWidth - pad * 2) / 2, y - 35, textWidth + pad * 2, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = primaryColor;
      ctx.fillText(label, x + (w - textWidth) / 2, y - 18);
    }

    ctx.restore();
  }
}

window.HudRenderer = HudRenderer;
