/**
 * BioHealth Biometrics Engine (face-api.js wrapper)
 * Fully compatible with both static object and class invocations
 */
(function (root) {
  'use strict';

  const FaceEngine = {
    modelsLoaded: false,
    modelsPath: '/models',
    cdnPath: 'https://raw.githubusercontent.com/vladmandic/face-api/master/model',
    detectorOptions: null,

    /**
     * Pre-loads the neural network weights from local assets with CDN fallback
     */
    async loadModels(onProgress = null) {
      if (this.modelsLoaded) return true;

      // Ensure faceapi is present, polling for up to 3 seconds if script is still initializing
      let attempts = 0;
      while (typeof faceapi === 'undefined' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (typeof faceapi === 'undefined') {
        throw new Error('A biblioteca neural face-api não foi detectada no navegador. Verifique a conexão com a internet.');
      }

      // Try loading from local assets first
      try {
        if (onProgress) onProgress('Carregando detector neural SSD MobileNet...');
        await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelsPath);

        if (onProgress) onProgress('Carregando mapeador de 68 marcos anatômicos...');
        await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath);

        if (onProgress) onProgress('Carregando extrator biométrico 128D...');
        await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsPath);

        this.detectorOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
        this.modelsLoaded = true;
        if (onProgress) onProgress('Modelos neurais operacionais.');
        return true;
      } catch (localErr) {
        console.warn('[FaceDetectorEngine] Falha ao carregar modelos locais. Ativando fallback CDN...', localErr);
        
        // Fallback to high-speed CDN
        try {
          if (onProgress) onProgress('Sincronizando modelos biométricos via CDN...');
          await faceapi.nets.ssdMobilenetv1.loadFromUri(this.cdnPath);
          await faceapi.nets.faceLandmark68Net.loadFromUri(this.cdnPath);
          await faceapi.nets.faceRecognitionNet.loadFromUri(this.cdnPath);

          this.detectorOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
          this.modelsLoaded = true;
          if (onProgress) onProgress('Modelos neurais sincronizados.');
          return true;
        } catch (cdnErr) {
          console.error('[FaceDetectorEngine] Falha crítica de inicialização:', cdnErr);
          throw new Error('Não foi possível carregar os pesos das redes neurais biométricas. Verifique sua conexão.');
        }
      }
    },

    /**
     * Detects a single face and extracts landmarks and descriptor
     */
    async detectSingleFaceWithDescriptor(input) {
      if (!this.modelsLoaded) {
        await this.loadModels();
      }

      const detection = await faceapi
        .detectSingleFace(input, this.detectorOptions)
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection;
    },

    /**
     * Extracts raw descriptor array (128 floats)
     */
    extractDescriptorArray(detection) {
      if (!detection || !detection.descriptor) return null;
      return Array.from(detection.descriptor);
    }
  };

  // Bind to global window and export
  root.FaceDetectorEngine = FaceEngine;

})(typeof window !== 'undefined' ? window : this);
