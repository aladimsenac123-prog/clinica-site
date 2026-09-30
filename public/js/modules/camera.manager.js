/**
 * Camera Lifecycle Manager
 */
class CameraManager {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.stream = null;
    this.isActive = false;
  }

  /**
   * Initializes webcam with ideal resolution for face detection
   */
  async start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Seu navegador não suporta acesso à webcam ou a conexão não é segura (HTTPS/Localhost).');
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      });

      this.video.srcObject = this.stream;

      return new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          this.isActive = true;
          this._syncCanvasSize();
          resolve(true);
        };
      });
    } catch (err) {
      console.error('[CameraManager] Error starting camera:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Permissão de acesso à câmera negada. Por favor, libere a câmera nas permissões do navegador.');
      }
      throw new Error(`Não foi possível inicializar a câmera: ${err.message}`);
    }
  }

  _syncCanvasSize() {
    if (this.canvas && this.video) {
      this.canvas.width = this.video.videoWidth || 640;
      this.canvas.height = this.video.videoHeight || 480;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isActive = false;
    if (this.canvas) {
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

window.CameraManager = CameraManager;
