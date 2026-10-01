/**
 * BioHealth Biometrics Engine (face-api.js wrapper)
 * Failsafe implementation with lazy auto-load and universal global exposure
 */
(function (global) {
  'use strict';

  const CDN_MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';
  const LOCAL_MODELS_URL = '/models';

  const FaceDetectorEngine = {
    modelsLoaded: false,
    loadingPromise: null,
    detectorOptions: null,

    /**
     * Pre-loads the neural network weights from local assets or CDN
     */
    async loadModels(onProgress = null) {
      if (this.modelsLoaded) return true;
      if (this.loadingPromise) return this.loadingPromise;

      this.loadingPromise = (async () => {
        // Wait for faceapi global if script is still downloading
        let waitAttempts = 0;
        while (typeof global.faceapi === 'undefined' && waitAttempts < 40) {
          await new Promise(r => setTimeout(r, 100));
          waitAttempts++;
        }

        if (typeof global.faceapi === 'undefined') {
          console.error('[FaceDetectorEngine] faceapi is not defined');
          throw new Error('A biblioteca de inteligência artificial (face-api) não pôde ser carregada.');
        }

        const fa = global.faceapi;

        // Try local assets first
        try {
          if (onProgress) onProgress('Carregando detector neural facial...');
          await fa.nets.ssdMobilenetv1.loadFromUri(LOCAL_MODELS_URL);

          if (onProgress) onProgress('Carregando mapeador de marcos anatômicos...');
          await fa.nets.faceLandmark68Net.loadFromUri(LOCAL_MODELS_URL);

          if (onProgress) onProgress('Carregando extrator biométrico 128D...');
          await fa.nets.faceRecognitionNet.loadFromUri(LOCAL_MODELS_URL);

          this.detectorOptions = new fa.SsdMobilenetv1Options({ minConfidence: 0.5 });
          this.modelsLoaded = true;
          if (onProgress) onProgress('Modelos neurais prontos.');
          return true;
        } catch (localErr) {
          console.warn('[FaceDetectorEngine] Modelos locais indisponíveis. Carregando via CDN global...', localErr);

          // Fallback to jsdelivr CDN
          try {
            if (onProgress) onProgress('Sincronizando modelos biométricos via CDN...');
            await fa.nets.ssdMobilenetv1.loadFromUri(CDN_MODELS_URL);
            await fa.nets.faceLandmark68Net.loadFromUri(CDN_MODELS_URL);
            await fa.nets.faceRecognitionNet.loadFromUri(CDN_MODELS_URL);

            this.detectorOptions = new fa.SsdMobilenetv1Options({ minConfidence: 0.5 });
            this.modelsLoaded = true;
            if (onProgress) onProgress('Modelos biométricos prontos.');
            return true;
          } catch (cdnErr) {
            console.error('[FaceDetectorEngine] Falha ao carregar modelos:', cdnErr);
            throw new Error('Não foi possível carregar os pesos neurais biométricos. Verifique sua conexão com a internet.');
          }
        }
      })();

      return this.loadingPromise;
    },

    /**
     * Detects a single face with 68 landmarks and 128D descriptor
     * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input 
     */
    async detectSingleFaceWithDescriptor(input) {
      if (!this.modelsLoaded) {
        await this.loadModels();
      }

      const fa = global.faceapi;
      if (!fa) {
        throw new Error('face-api.js não está disponível.');
      }

      if (!this.detectorOptions) {
        this.detectorOptions = new fa.SsdMobilenetv1Options({ minConfidence: 0.5 });
      }

      const detection = await fa
        .detectSingleFace(input, this.detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection;
    },

    /**
     * Extracts array of 128 float numbers from detection object
     */
    extractDescriptorArray(detection) {
      if (!detection || !detection.descriptor) return null;
      return Array.from(detection.descriptor);
    }
  };

  // Expose directly to window and global scope
  global.FaceDetectorEngine = FaceDetectorEngine;
  if (typeof window !== 'undefined') {
    window.FaceDetectorEngine = FaceDetectorEngine;
  }

})(typeof window !== 'undefined' ? window : this);
