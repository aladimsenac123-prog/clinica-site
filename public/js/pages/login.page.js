document.addEventListener('DOMContentLoaded', async () => {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('overlay-canvas');
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingText = document.getElementById('loading-text');
  const loginStatusBadge = document.getElementById('login-status-badge');
  const btnManualVerify = document.getElementById('btn-manual-verify');
  const btnRetest = document.getElementById('btn-retest');
  const btnTestSpoof = document.getElementById('btn-test-spoof');
  const btnResetLiveness = document.getElementById('btn-reset-liveness');
  const switchAutoLogin = document.getElementById('switch-auto-login');

  const hudLiveness = document.getElementById('hud-liveness');
  const livenessMsg = document.getElementById('liveness-msg');

  const telemetryMatch = document.getElementById('telemetry-match');
  const telemetryDistance = document.getElementById('telemetry-distance');
  const telemetryLiveness = document.getElementById('telemetry-liveness');

  const camera = new CameraManager(video, canvas);
  const hud = new HudRenderer(canvas);
  const liveness = new LivenessDetector();

  let isLoopRunning = false;
  let enrolledUsers = [];
  let isAuthenticating = false;
  let authenticatedUser = null;
  let spoofSimulationMode = false;

  async function init() {
    try {
      loadingOverlay.style.display = 'block';
      loadingText.textContent = 'Carregando Modelos Neurais...';

      await FaceDetectorEngine.loadModels((msg) => {
        loadingText.textContent = msg;
      });

      loadingText.textContent = 'Sincronizando base de biometria cadastrada...';
      const usersData = await ApiService.getEnrolledUsers();
      enrolledUsers = usersData.users || [];

      loadingText.textContent = 'Iniciando câmera...';
      await camera.start();

      loadingOverlay.style.display = 'none';
      loginStatusBadge.className = 'badge-status badge-status-active';
      loginStatusBadge.innerHTML = `<span class="pulsing-dot"></span> Pronto (${enrolledUsers.length} cadastrados)`;

      startLoginLoop();
    } catch (err) {
      loadingOverlay.style.display = 'none';
      loginStatusBadge.className = 'badge-status badge-status-danger';
      loginStatusBadge.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Erro de Inicialização';
      alert(err.message);
    }
  }

  // Continuous scanner loop
  async function startLoginLoop() {
    isLoopRunning = true;

    async function loop() {
      if (!isLoopRunning || !camera.isActive || isAuthenticating) return;

      try {
        const detection = await FaceDetectorEngine.detectSingleFaceWithDescriptor(video);

        if (detection) {
          // Evaluate Liveness / Anti-Spoofing
          const liveResult = liveness.evaluate(detection);

          if (spoofSimulationMode) {
            hudLiveness.className = 'hud-liveness-prompt bg-danger text-white';
            livenessMsg.textContent = '⚠️ SIMULAÇÃO: Foto Estática Detectada (Spoofing)';
            telemetryLiveness.innerHTML = `<i class="bi bi-heart-pulse text-danger"></i> Vivacidade: BLOQUEADA (0%)`;
          } else if (liveResult.passed) {
            hudLiveness.className = 'hud-liveness-prompt blink-active';
            livenessMsg.textContent = '✓ Prova de Vida Aprovada (Humano Real)';
            telemetryLiveness.innerHTML = `<i class="bi bi-heart-pulse text-success"></i> Vivacidade: 100% (${liveResult.blinkCount} piscadas)`;
          } else {
            hudLiveness.className = 'hud-liveness-prompt';
            livenessMsg.textContent = liveResult.message;
            telemetryLiveness.innerHTML = `<i class="bi bi-heart-pulse text-warning"></i> Vivacidade: Aguardando (${liveResult.blinkCount} piscadas)`;
          }

          // Compute matching
          const descriptor = FaceDetectorEngine.extractDescriptorArray(detection);
          const match = findLocalBestMatch(descriptor, enrolledUsers);

          if (match.matched) {
            telemetryMatch.innerHTML = `<i class="bi bi-person-check text-success"></i> ${match.user.name} (${match.confidence}%)`;
            telemetryDistance.innerHTML = `<i class="bi bi-rulers"></i> Distância: ${match.distance}`;

            hud.drawBiometricHUD(detection, `${match.user.name} [${match.confidence}%]`, 'success');

            // Check if Auto-Login conditions are met
            if (switchAutoLogin.checked && !spoofSimulationMode && liveResult.passed && !isAuthenticating) {
              await triggerLoginSuccess(descriptor, liveResult.score);
              return;
            }
          } else {
            telemetryMatch.innerHTML = `<i class="bi bi-person-x text-warning"></i> Não Reconhecido`;
            telemetryDistance.innerHTML = `<i class="bi bi-rulers"></i> Distância: ${match.distance}`;
            hud.drawBiometricHUD(detection, 'Face Não Cadastrada', 'tracking');
          }

        } else {
          hud.clear();
          telemetryMatch.innerHTML = `<i class="bi bi-person-bounding-box"></i> Match: Buscando...`;
          telemetryDistance.innerHTML = `<i class="bi bi-rulers"></i> Distância: --`;
          hudLiveness.className = 'hud-liveness-prompt';
          livenessMsg.textContent = 'Posicione seu rosto dentro da moldura';
        }
      } catch (e) {
        console.error('Login loop error:', e);
      }

      requestAnimationFrame(loop);
    }

    loop();
  }

  // Local helper for quick Euclidean distance calculation
  function findLocalBestMatch(probeDescriptor, users, threshold = 0.52) {
    if (!users || users.length === 0) return { matched: false, distance: 9.99, confidence: 0 };

    let bestUser = null;
    let minDistance = Infinity;

    for (const u of users) {
      if (!u.descriptor) continue;
      let sum = 0;
      for (let i = 0; i < probeDescriptor.length; i++) {
        const diff = probeDescriptor[i] - u.descriptor[i];
        sum += diff * diff;
      }
      const dist = Math.sqrt(sum);
      if (dist < minDistance) {
        minDistance = dist;
        bestUser = u;
      }
    }

    const confidence = Math.max(0, Math.min(100, Math.round((1 - minDistance * 0.9) * 100)));
    return {
      matched: minDistance <= threshold,
      user: bestUser,
      distance: parseFloat(minDistance.toFixed(4)),
      confidence
    };
  }

  // Trigger login completion and redirect
  async function triggerLoginSuccess(descriptor, livenessScore) {
    isAuthenticating = true;
    hud.playSuccessSound();

    try {
      const result = await ApiService.verifyBiometrics({
        descriptor,
        livenessPassed: true,
        livenessScore
      });

      // Save user session in localStorage
      localStorage.setItem('biohealth_session', JSON.stringify({
        token: result.token,
        user: result.user,
        confidence: result.confidence,
        loginAt: new Date().toISOString()
      }));

      // Populate and show modal
      document.getElementById('granted-user-name').textContent = result.user.name;
      document.getElementById('granted-user-role').textContent = `${result.user.role} • ${result.user.department}`;
      document.getElementById('granted-confidence').textContent = `${result.confidence}%`;
      document.getElementById('granted-distance').textContent = result.distance.toFixed(4);

      const modalEl = document.getElementById('grantedModal');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      // Redirect after 1.8s
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1800);

    } catch (err) {
      hud.playErrorSound();
      alert('Erro na validação do servidor: ' + err.message);
      isAuthenticating = false;
      startLoginLoop();
    }
  }

  // Manual Verify Button
  btnManualVerify.addEventListener('click', async () => {
    btnManualVerify.disabled = true;
    btnManualVerify.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Autenticando...';

    try {
      const detection = await FaceDetectorEngine.detectSingleFaceWithDescriptor(video);
      if (!detection) {
        hud.playErrorSound();
        alert('Nenhum rosto detectado no enquadramento.');
        btnManualVerify.disabled = false;
        btnManualVerify.innerHTML = '<i class="bi bi-fingerprint"></i> Autenticar Agora';
        return;
      }

      if (spoofSimulationMode) {
        hud.playErrorSound();
        alert('❌ ATAQUE DE SPOOFING BLOQUEADO: Prova de vida não aprovada para esta imagem.');
        btnManualVerify.disabled = false;
        btnManualVerify.innerHTML = '<i class="bi bi-fingerprint"></i> Autenticar Agora';
        return;
      }

      const descriptor = FaceDetectorEngine.extractDescriptorArray(detection);
      await triggerLoginSuccess(descriptor, 0.95);
    } catch (err) {
      hud.playErrorSound();
      alert('Acesso Negado: ' + err.message);
      btnManualVerify.disabled = false;
      btnManualVerify.innerHTML = '<i class="bi bi-fingerprint"></i> Autenticar Agora';
    }
  });

  // Spoofing attack simulation button (For presentation pitch demonstration!)
  btnTestSpoof.addEventListener('click', () => {
    spoofSimulationMode = !spoofSimulationMode;
    if (spoofSimulationMode) {
      btnTestSpoof.className = 'btn btn-danger btn-sm';
      btnTestSpoof.innerHTML = '<i class="bi bi-shield-slash"></i> Simulação Ativa: Foto Estática (Clique p/ Desativar)';
      hud.playErrorSound();
    } else {
      btnTestSpoof.className = 'btn btn-outline-danger btn-sm';
      btnTestSpoof.innerHTML = '<i class="bi bi-card-image"></i> Simular Ataque de Foto Estática (Spoofing)';
    }
  });

  // Reset liveness button
  btnResetLiveness.addEventListener('click', () => {
    liveness.reset();
    hudLiveness.className = 'hud-liveness-prompt';
    livenessMsg.textContent = 'Prova de vida resetada. Olhe e pisque os olhos.';
  });

  // Retest camera button
  btnRetest.addEventListener('click', async () => {
    camera.stop();
    await init();
  });

  // Clean on unload
  window.addEventListener('beforeunload', () => {
    isLoopRunning = false;
    camera.stop();
  });

  // Start
  init();
});
