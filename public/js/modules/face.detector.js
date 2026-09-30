/**
 * BioHealth Biometrics Engine (face-api.js wrapper)
 * Ultra-resilient global export
 */
(function (global) {
  'use strict';

  function createEngine() {
    return {
      modelsLoaded: false,
      modelsPath: '/models',
      cdnPath: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model',
      detectorOptions: null,

      /**
       * Pre-loads the neural network weights from local assets or CDN
       */
      async loadModels(onProgress) {
        if (this.modelsLoaded) return true;

        // Ensure faceapi is available
        let waitCount = 0;
        while (typeof global.faceapi === 'undefined' && waitCount < 50) {
          await new Promise(r => setTimeout(r, 100));
          waitCount++;
        }

        if (typeof global.faceapi === 'undefined') {
          console.error('[FaceDetectorEngine] global.faceapi is undefined after waiting');
          throw new Error('A biblioteca de inteligência artificial (face-api) não pôde ser carregada. Verifique sua conexão.');
        }

        const fa = global.faceapi;

        // Try local models first
        try {
          if (onProgress) onProgress('Carregando detector neural SSD MobileNet...');
          await fa.nets.ssdMobilenetv1.loadFromUri(this.modelsPath);

          if (onProgress) onProgress('Carregando mapeador de marcos anatômicos...');
          await fa.nets.faceLandmark68Net.loadFromUri(this.modelsPath);

          if (onProgress) onProgress('Carregando extrator biométrico 128D...');
          await fa.nets.faceRecognitionNet.loadFromUri(this.modelsPath);

          this.detectorOptions = new fa.SsdMobilenetv1Options({ minConfidence: 0.5 });
          this.modelsLoaded = true;
          if (onProgress) onProgress('Modelos neurais prontos.');
          return true;
        } catch (localErr) {
          console.warn('[FaceDetectorEngine] Falha ao carregar modelos locais (/models). Carregando via CDN global...', localErr);

          // Fallback to jsdelivr CDN
          try {
            if (onProgress) onProgress('Sincronizando modelos via CDN global...');
            await fa.nets.ssdMobilenetv1.loadFromUri(this.cdnPath);
            await fa.nets.faceLandmark68Net.loadFromUri(this.cdnPath);
            await fa.nets.faceRecognitionNet.loadFromUri(this.cdnPath);

            this.detectorOptions = new fa.SsdMobilenetv1Options({ minConfidence: 0.5 });
            this.modelsLoaded = true;
            if (onProgress) onProgress('Modelos biométricos prontos.');
            return true;
          } catch (cdnErr) {
            console.error('[FaceDetectorEngine] Erro crítico no carregamento dos modelos:', cdnErr);
            throw new Error('Não foi possível carregar os pesos neurais biométricos. Verifique sua conexão com a internet.');
          }
        }
      },

      /**
       * Detects single face with landmarks and 128D descriptor
       */
      async detectSingleFaceWithDescriptor(input) {
        if (!this.modelsLoaded) {
          await this.loadModels();
        }

        const fa = global.faceapi;
        if (!fa) return null;

        const detection = await fa
          .detectSingleFace(input, this.detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        return detection;
      },

      /**
       * Extracts numeric descriptor array
       */
      extractDescriptorArray(detection) {
        if (!detection || !detection.descriptor) return null;
        return Array.from(detection.descriptor);
      }
    };
  }

  const engineInstance = createEngine();

  // Attach everywhere in global scope to eliminate any possible reference errors
  global.FaceDetectorEngine = engineInstance;
  global.FaceEngine = engineInstance;
  if (typeof window !== 'undefined') {
    window.FaceDetectorEngine = engineInstance;
    window.FaceEngine = engineInstance;
  }

})(typeof window !== 'undefined' ? window : this);
