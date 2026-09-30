/**
 * Liveness & Anti-Spoofing Detection Engine
 * Mitigates static photo presentation attacks (Printed photo / smartphone screen spoofing)
 */
class LivenessDetector {
  constructor() {
    this.blinkCount = 0;
    this.eyeClosedFrames = 0;
    this.lastPositions = [];
    this.movementScore = 0;
    this.livenessPassed = false;
    this.consecutiveStaticFrames = 0;
    this.isBlinking = false;
  }

  reset() {
    this.blinkCount = 0;
    this.eyeClosedFrames = 0;
    this.lastPositions = [];
    this.movementScore = 0;
    this.livenessPassed = false;
    this.consecutiveStaticFrames = 0;
    this.isBlinking = false;
  }

  /**
   * Calculates distance between two 2D points
   */
  _euclidean2D(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  /**
   * Eye Aspect Ratio (EAR) based on Soukupová and Čech (2016)
   * @param {Array<{x: number, y: number}>} eyePoints - 6 landmark points
   */
  calculateEAR(eyePoints) {
    if (!eyePoints || eyePoints.length < 6) return 0.3;

    // Vertical distances
    const v1 = this._euclidean2D(eyePoints[1], eyePoints[5]);
    const v2 = this._euclidean2D(eyePoints[2], eyePoints[4]);
    // Horizontal distance
    const h = this._euclidean2D(eyePoints[0], eyePoints[3]);

    if (h === 0) return 0.3;
    return (v1 + v2) / (2.0 * h);
  }

  /**
   * Evaluates a frame for liveness (Blink detection + Micro-movements)
   * @param {object} detection - face-api detection with landmarks
   * @returns {{passed: boolean, ear: number, blinkCount: number, message: string, score: number}}
   */
  evaluate(detection) {
    if (!detection || !detection.landmarks) {
      return {
        passed: false,
        ear: 0,
        blinkCount: this.blinkCount,
        message: 'Aguardando detecção de face...',
        score: 0
      };
    }

    const landmarks = detection.landmarks.positions;
    // Left eye landmarks (indices 36 to 41)
    const leftEye = landmarks.slice(36, 42);
    // Right eye landmarks (indices 42 to 47)
    const rightEye = landmarks.slice(42, 48);

    const leftEAR = this.calculateEAR(leftEye);
    const rightEAR = this.calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    // Blink threshold: EAR < 0.22 indicates closed eye
    const EAR_THRESHOLD = 0.22;

    if (avgEAR < EAR_THRESHOLD) {
      this.eyeClosedFrames++;
      this.isBlinking = true;
    } else {
      if (this.isBlinking && this.eyeClosedFrames >= 1 && this.eyeClosedFrames <= 8) {
        // Valid physiological blink detected!
        this.blinkCount++;
      }
      this.eyeClosedFrames = 0;
      this.isBlinking = false;
    }

    // Micro-motion tracking (Nose tip landmark index 30)
    const noseTip = landmarks[30];
    this.lastPositions.push(noseTip);
    if (this.lastPositions.length > 20) this.lastPositions.shift();

    if (this.lastPositions.length >= 10) {
      let totalVariance = 0;
      for (let i = 1; i < this.lastPositions.length; i++) {
        totalVariance += this._euclidean2D(this.lastPositions[i], this.lastPositions[i - 1]);
      }
      this.movementScore = totalVariance / this.lastPositions.length;
    }

    // Determine liveness:
    // User passes if at least 1 blink is registered OR natural physiological micro-movement is consistent
    const hasBlinked = this.blinkCount >= 1;
    const hasNaturalMovement = this.movementScore > 0.4 && this.movementScore < 15.0;

    if (hasBlinked || (hasNaturalMovement && this.lastPositions.length >= 15)) {
      this.livenessPassed = true;
    }

    const score = this.livenessPassed ? (hasBlinked ? 0.98 : 0.88) : 0.45;

    let message = 'Pisque os olhos diante da câmera para validar a prova de vida';
    if (this.livenessPassed) {
      message = '✓ Prova de Vida Aprovada (Humano Real)';
    } else if (this.isBlinking) {
      message = 'Piscada detectada... processando';
    }

    return {
      passed: this.livenessPassed,
      ear: parseFloat(avgEAR.toFixed(3)),
      blinkCount: this.blinkCount,
      movementScore: parseFloat(this.movementScore.toFixed(2)),
      message,
      score
    };
  }
}

window.LivenessDetector = LivenessDetector;
