/**
 * Face Detection & Biometrics Engine (face-api.js wrapper)
 */
class FaceDetectorEngine {
  constructor() {
    this.modelsLoaded = false;
    this.modelsPath = '/models';
    this.detectorOptions = null;
  }

  /**
   * Pre-loads the neural network weights
   */
  async loadModels(onProgress = null) {
    if (this.modelsLoaded) return true;

    try {
      if (onProgress) onProgress('Carregando detector neural SSD MobileNet...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelsPath);

      if (onProgress) onProgress('Carregando mapeador de 68 marcos anatômicos...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath);

      if (onProgress) onProgress('Carregando extrator de embeddings biométricos (128D)...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsPath);

      this.detectorOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      this.modelsLoaded = true;
      if (onProgress) onProgress('Modelos neurais prontos.');
      return true;
    } catch (err) {
      console.error('[FaceDetectorEngine] Error loading models:', err);
      throw new Error(`Falha ao carregar modelos neurais: ${err.message}`);
    }
  }

  /**
   * Detects a single face and extracts bounding box, landmarks and descriptor
   * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input 
   */
  async detectSingleFaceWithDescriptor(input) {
    if (!this.modelsLoaded) await this.loadModels();

    const detection = await faceapi
      .detectSingleFace(input, this.detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection;
  }

  /**
   * Extracts raw descriptor array (Array of 128 numbers) from detection
   * @param {object} detection 
   * @returns {number[]|null}
   */
  extractDescriptorArray(detection) {
    if (!detection || !detection.descriptor) return null;
    return Array.from(detection.descriptor);
  }
}

window.FaceDetectorEngine = new FaceDetectorEngine();
