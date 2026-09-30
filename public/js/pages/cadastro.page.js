document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('overlay-canvas');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const cameraStatusBadge = document.getElementById('camera-status-badge');
  const btnCapture = document.getElementById('btn-capture');
  const btnRetest = document.getElementById('btn-retest-camera');
  const btnSubmit = document.getElementById('btn-submit');
  const formCadastro = document.getElementById('form-cadastro');
  const extractionBadge = document.getElementById('extraction-status-badge');
  const extractionText = document.getElementById('extraction-status-text');
  const checkConsent = document.getElementById('check-consent');

  const telemetryLandmarks = document.getElementById('telemetry-landmarks');
  const telemetryConfidence = document.getElementById('telemetry-confidence');
  const telemetryFps = document.getElementById('telemetry-fps');

  const camera = new CameraManager(video, canvas);
  const hud = new HudRenderer(canvas);

  let currentDescriptor = null;
  let isLoopRunning = false;
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let fps = 30;

  // Initialize camera and models
  async function init() {
    try {
      loadingOverlay.style.display = 'block';
      loadingText.textContent = 'Carregando redes neurais face-api...';

      await FaceDetectorEngine.loadModels((msg) => {
        loadingText.textContent = msg;
      });

      loadingText.textContent = 'Acessando webcam...';
      await camera.start();

      loadingOverlay.style.display = 'none';
      cameraStatusBadge.className = 'badge-status badge-status-active';
      cameraStatusBadge.innerHTML = '<span class="pulsing-dot"></span> Câmera Ativa';

      btnCapture.disabled = false;
      startTrackingLoop();
    } catch (err) {
      loadingOverlay.style.display = 'none';
      cameraStatusBadge.className = 'badge-status badge-status-danger';
      cameraStatusBadge.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Falha na Câmera';
      alert(err.message);
    }
  }

  // Continuous tracking loop for visual HUD
  async function startTrackingLoop() {
    isLoopRunning = true;

    async function loop() {
      if (!isLoopRunning || !camera.isActive) return;

      try {
        const detection = await FaceDetectorEngine.detectSingleFaceWithDescriptor(video);

        // FPS Calculation
        const now = performance.now();
        frameCount++;
        if (now - lastFrameTime >= 1000) {
          fps = frameCount;
          frameCount = 0;
          lastFrameTime = now;
          telemetryFps.innerHTML = `<i class="bi bi-speedometer2"></i> ${fps} FPS`;
        }

        if (detection) {
          const confidencePct = Math.round(detection.detection.score * 100);
          telemetryLandmarks.innerHTML = `<i class="bi bi-diagram-3"></i> Marcos: 68/68`;
          telemetryConfidence.innerHTML = `<i class="bi bi-activity"></i> Confiança: ${confidencePct}%`;

          hud.drawBiometricHUD(detection, `Rosto Detectado (${confidencePct}%)`, 'tracking');
        } else {
          hud.clear();
          telemetryLandmarks.innerHTML = `<i class="bi bi-diagram-3"></i> Marcos: 0/68`;
          telemetryConfidence.innerHTML = `<i class="bi bi-activity"></i> Confiança: 0%`;
        }
      } catch (e) {
        console.error('Tracking loop error:', e);
      }

      requestAnimationFrame(loop);
    }

    loop();
  }

  // Handle capture button
  btnCapture.addEventListener('click', async () => {
    btnCapture.disabled = true;
    btnCapture.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Processando Vetor 128D...';

    try {
      const detection = await FaceDetectorEngine.detectSingleFaceWithDescriptor(video);

      if (!detection) {
        hud.playErrorSound();
        alert('Nenhum rosto foi detectado no enquadramento. Por favor, olhe diretamente para a câmera.');
        btnCapture.disabled = false;
        btnCapture.innerHTML = '<i class="bi bi-camera-fill"></i> Extrair Biometria do Rosto';
        return;
      }

      if (detection.detection.score < 0.6) {
        hud.playErrorSound();
        alert('Qualidade de detecção baixa. Ajuste a iluminação ou limpe a câmera.');
        btnCapture.disabled = false;
        btnCapture.innerHTML = '<i class="bi bi-camera-fill"></i> Extrair Biometria do Rosto';
        return;
      }

      currentDescriptor = FaceDetectorEngine.extractDescriptorArray(detection);
      hud.playSuccessSound();
      hud.drawBiometricHUD(detection, '✓ BIOMETRIA 128D EXTRAÍDA', 'success');

      extractionBadge.className = 'badge-status badge-status-active';
      extractionBadge.textContent = '✓ Vetor 128D Capturado';
      extractionText.textContent = `Descritor biométrico gerado (${currentDescriptor.length} valores numéricos).`;

      updateSubmitState();
      btnCapture.disabled = false;
      btnCapture.innerHTML = '<i class="bi bi-check-lg"></i> Biometria Extraída com Sucesso (Recapturar)';
    } catch (err) {
      hud.playErrorSound();
      alert('Erro na extração biométrica: ' + err.message);
      btnCapture.disabled = false;
      btnCapture.innerHTML = '<i class="bi bi-camera-fill"></i> Extrair Biometria do Rosto';
    }
  });

  // Re-test camera button
  btnRetest.addEventListener('click', async () => {
    camera.stop();
    await init();
  });

  // Consent checkbox update
  checkConsent.addEventListener('change', updateSubmitState);

  function updateSubmitState() {
    const hasDescriptor = currentDescriptor !== null && currentDescriptor.length === 128;
    const hasConsent = checkConsent.checked;
    btnSubmit.disabled = !(hasDescriptor && hasConsent);
  }

  // Form Submit
  formCadastro.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentDescriptor) {
      alert('Por favor, capture sua biometria facial antes de salvar o cadastro.');
      return;
    }

    if (!checkConsent.checked) {
      alert('É necessário aceitar o termo de consentimento LGPD para continuar.');
      return;
    }

    const payload = {
      name: document.getElementById('input-name').value,
      badgeNumber: document.getElementById('input-badge').value,
      role: document.getElementById('input-role').value,
      department: document.getElementById('input-dept').value,
      descriptor: currentDescriptor,
      consentAccepted: true
    };

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Salvando na Base Criptografada...';

    try {
      const response = await ApiService.registerUser(payload);
      hud.playSuccessSound();

      document.getElementById('modal-success-msg').textContent = 
        `O profissional ${response.user.name} (Matrícula: ${response.user.badgeNumber}) foi cadastrado com sucesso!`;
      
      const modal = new bootstrap.Modal(document.getElementById('successModal'));
      modal.show();

      // Reset form
      formCadastro.reset();
      currentDescriptor = null;
      extractionBadge.className = 'badge-status badge-status-warning';
      extractionBadge.textContent = 'Pendente';
      extractionText.textContent = 'Nenhum rosto capturado ainda';
      btnCapture.innerHTML = '<i class="bi bi-camera-fill"></i> Extrair Biometria do Rosto';
      updateSubmitState();
    } catch (err) {
      hud.playErrorSound();
      alert('Erro no cadastro: ' + err.message);
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<i class="bi bi-check2-circle"></i> Finalizar Cadastro Biométrico';
    }
  });

  // Clean on unload
  window.addEventListener('beforeunload', () => {
    isLoopRunning = false;
    camera.stop();
  });

  // Start
  init();
});
