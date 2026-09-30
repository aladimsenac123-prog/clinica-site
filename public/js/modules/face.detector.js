/**
 * BioHealth Biometrics Engine (face-api.js wrapper)
 */
const FaceDetectorEngine = {
  modelsLoaded: false,
  modelsPath: '/models',
  detectorOptions: null,

  /**
   * Pre-loads the neural network weights from local assets with CDN fallback
   */
  async loadModels(onProgress = null) {
    if (this.modelsLoaded) return true;

    // Wait for faceapi global if still initializing
    let attempts = 0;
    while (typeof faceapi === 'undefined' && attempts < 20) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }

    if (typeof faceapi === 'undefined') {
      throw new Error('A biblioteca face-api não foi detectada. Verifique sua conexão ou recarregue a página.');
    }

    try {
      if (onProgress) onProgress('Carregando detector neural facial...');
      await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelsPath);

      if (onProgress) onProgress('Carregando mapeador de marcos anatômicos...');
      await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath);

      if (onProgress) onProgress('Carregando extrator biométrico 128D...');
      await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsPath);

      this.detectorOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
      this.modelsLoaded = true;
      if (onProgress) onProgress('Modelos neurais prontos.');
      return true;
    } catch (err) {
      console.warn('[FaceDetectorEngine] Erro carregando modelos locais, tentando fallback CDN...', err);
      try {
        if (onProgress) onProgress('Sincronizando modelos de alta precisão...');
        const cdnBase = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(cdnBase);
        await faceapi.nets.faceLandmark68Net.loadFromUri(cdnBase);
        await faceapi.nets.faceRecognitionNet.loadFromUri(cdnBase);

        this.detectorOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        this.modelsLoaded = true;
        if (onProgress) onProgress('Modelos neurais prontos via rede segura.');
        return true;
      } catch (cdnErr) {
        console.error('[FaceDetectorEngine] Falha geral no carregamento:', cdnErr);
        throw new Error(`Falha ao inicializar modelos biométricos: ${err.message}`);
      }
    }
  },

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
  },

  /**
   * Extracts raw descriptor array (Array of 128 numbers) from detection
   * @param {object} detection 
   * @returns {number[]|null}
   */
  extractDescriptorArray(detection) {
    if (!detection || !detection.descriptor) return null;
    return Array.from(detection.descriptor);
  }
};

// Export to window explicitly
window.FaceDetectorEngine = FaceDetectorEngine;
