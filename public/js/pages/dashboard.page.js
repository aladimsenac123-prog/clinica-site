document.addEventListener('DOMContentLoaded', async () => {
  const userDisplayName = document.getElementById('user-display-name');
  const userDisplayRole = document.getElementById('user-display-role');
  const userDisplayConfidence = document.getElementById('user-display-confidence');
  const userBadgeTag = document.getElementById('user-badge-tag');

  const statCryo = document.getElementById('stat-cryo');
  const statSeq = document.getElementById('stat-seq');
  const statAccess = document.getElementById('stat-access');
  const statBreaches = document.getElementById('stat-breaches');

  const trialsContainer = document.getElementById('trials-container');
  const auditLogsContainer = document.getElementById('audit-logs-container');

  const btnLogout = document.getElementById('btn-logout');
  const btnRefreshLogs = document.getElementById('btn-refresh-logs');
  const btnDeleteMyData = document.getElementById('btn-delete-my-data');

  // HTML sanitization helper against XSS
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load Session
  const sessionRaw = localStorage.getItem('biohealth_session');
  let session = null;
  if (sessionRaw) {
    try {
      session = JSON.parse(sessionRaw);
    } catch (e) {
      session = null;
    }
  }

  // Enforce authentic session - redirect if unauthorized (Removes demo backdoor)
  if (!session || !session.token || !session.user) {
    alert('Acesso restrito. É necessário autenticar-se biometricamente para acessar esta área.');
    window.location.href = '/login';
    return;
  }

  userDisplayName.textContent = session.user.name;
  userDisplayRole.textContent = `${session.user.role} • ${session.user.department}`;
  userDisplayConfidence.innerHTML = `${session.confidence || 98.5}% <span class="fs-6 text-muted font-sans fw-normal">(128D Match)</span>`;
  userBadgeTag.textContent = session.user.badgeNumber || 'BIO-AUTH';

  // Load Clinical Data
  async function loadClinicalData() {
    try {
      const data = await ApiService.getClinicalDashboardData();
      const info = data.data;

      statCryo.textContent = info.secureStorageMetrics.cryoChambersOnline;
      statSeq.textContent = info.secureStorageMetrics.sequencersActive;

      // Render Trials
      trialsContainer.innerHTML = info.activeTrials.map(trial => `
        <div class="card-glass-subtle p-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="badge-status badge-status-biometric mb-1">${escapeHTML(trial.phase)}</span>
              <h6 class="text-white fw-bold m-0 fs-5">${escapeHTML(trial.title)}</h6>
            </div>
            <span class="badge-status badge-status-active">${escapeHTML(trial.status)}</span>
          </div>

          <div class="row g-2 my-2 text-secondary small">
            <div class="col-md-6"><i class="bi bi-person-fill text-accent"></i> <strong>Responsável:</strong> ${escapeHTML(trial.leadScientist)}</div>
            <div class="col-md-3"><i class="bi bi-droplet-half text-info"></i> <strong>Amostras:</strong> ${escapeHTML(trial.samplesCollected)}</div>
            <div class="col-md-3"><i class="bi bi-graph-up-arrow text-success"></i> <strong>Eficácia:</strong> ${escapeHTML(trial.efficacyRate)}</div>
          </div>

          <div class="p-2 bg-dark bg-opacity-50 border border-secondary border-opacity-25 rounded text-muted small">
            <i class="bi bi-shield-lock text-warning me-1"></i> ${escapeHTML(trial.confidentialityNotice)}
          </div>
        </div>
      `).join('');

    } catch (err) {
      trialsContainer.innerHTML = `<div class="text-danger p-3">Erro ao carregar dados clínicos: ${escapeHTML(err.message)}</div>`;
    }
  }

  // Load Audit Logs (with XSS sanitization)
  async function loadAuditLogs() {
    try {
      const data = await ApiService.getAuditLogs();
      const logs = data.logs || [];

      statAccess.textContent = `${logs.length} Registros`;
      const breaches = logs.filter(l => l.status === 'BLOCKED' || l.action === 'SPOOF_ATTEMPT').length;
      statBreaches.textContent = `${breaches} Bloqueios`;

      if (logs.length === 0) {
        auditLogsContainer.innerHTML = '<div class="text-center py-3 text-muted">Nenhum evento registrado ainda.</div>';
        return;
      }

      auditLogsContainer.innerHTML = logs.map(log => {
        let badgeClass = 'badge-status-active';
        let icon = 'bi-check-circle-fill';
        if (log.status === 'DENIED') {
          badgeClass = 'badge-status-warning';
          icon = 'bi-exclamation-circle';
        } else if (log.status === 'BLOCKED') {
          badgeClass = 'badge-status-danger';
          icon = 'bi-shield-slash-fill';
        }

        const dateStr = new Date(log.timestamp).toLocaleTimeString('pt-BR');
        const safeAction = escapeHTML(log.action);
        const safeUserName = escapeHTML(log.userName);
        const safeIp = escapeHTML(log.ip);
        const safeNotes = escapeHTML(log.notes);
        const safeLiveness = escapeHTML(log.livenessScore);
        const safeConfidence = escapeHTML(log.confidence);
        const safeStatus = escapeHTML(log.status);

        return `
          <div class="p-2 card-glass-subtle d-flex align-items-center justify-content-between small">
            <div>
              <div class="text-white fw-semibold">
                <i class="bi ${icon} me-1"></i> ${safeAction} — <span class="text-accent">${safeUserName}</span>
              </div>
              <div class="text-muted" style="font-size: 0.75rem;">
                ${dateStr} • IP: ${safeIp} • Vivacidade: ${safeLiveness} • Confiança: ${safeConfidence}
              </div>
              ${safeNotes ? `<div class="text-secondary" style="font-size: 0.75rem;">Nota: ${safeNotes}</div>` : ''}
            </div>
            <span class="badge-status ${badgeClass}" style="font-size: 0.7rem;">${safeStatus}</span>
          </div>
        `;
      }).join('');

    } catch (err) {
      auditLogsContainer.innerHTML = `<div class="text-danger p-2 small">Erro ao carregar logs: ${escapeHTML(err.message)}</div>`;
    }
  }

  // Logout
  btnLogout.addEventListener('click', () => {
    localStorage.removeItem('biohealth_session');
    window.location.href = '/login';
  });

  // Refresh logs
  btnRefreshLogs.addEventListener('click', loadAuditLogs);

  // LGPD Right to Erasure
  btnDeleteMyData.addEventListener('click', async () => {
    if (!session || !session.user || !session.user.id) {
      alert('Sessão inválida. Faça login novamente.');
      window.location.href = '/login';
      return;
    }

    const confirmDelete = confirm(`LGPD Art. 18: Deseja realmente revogar seu consentimento e eliminar permanentemente todos os seus dados biométricos (${session.user.name}) da base de dados deste laboratório?`);
    if (!confirmDelete) return;

    try {
      const response = await ApiService.deleteUser(session.user.id);
      alert(response.message);
      localStorage.removeItem('biohealth_session');
      window.location.href = '/cadastro';
    } catch (err) {
      alert('Erro ao excluir biometria: ' + err.message);
    }
  });

  // Init
  loadClinicalData();
  loadAuditLogs();
});
