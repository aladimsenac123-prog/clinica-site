/**
 * Client API Service for BioHealth Biometric Backend
 */
const ApiService = {
  baseUrl: '/api/v1',

  getAuthHeaders() {
    const sessionRaw = localStorage.getItem('biohealth_session');
    if (sessionRaw) {
      try {
        const session = JSON.parse(sessionRaw);
        if (session.token) {
          return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
          };
        }
      } catch (e) {}
    }
    return { 'Content-Type': 'application/json' };
  },

  async registerUser(userData) {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao registrar usuário');
    return json;
  },

  async verifyBiometrics(verificationData) {
    const res = await fetch(`${this.baseUrl}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verificationData)
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.error || 'Autenticação falhou');
      err.data = json;
      throw err;
    }
    return json;
  },

  async getEnrolledUsers() {
    const res = await fetch(`${this.baseUrl}/auth/users`, {
      headers: this.getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao carregar usuários');
    return json;
  },

  async deleteUser(userId) {
    const res = await fetch(`${this.baseUrl}/auth/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao excluir biometria');
    return json;
  },

  async getAuditLogs() {
    const res = await fetch(`${this.baseUrl}/audit/logs`, {
      headers: this.getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao obter logs');
    return json;
  },

  async getClinicalDashboardData() {
    const res = await fetch(`${this.baseUrl}/dashboard/clinical-data`, {
      headers: this.getAuthHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Erro ao carregar dados clínicos');
    return json;
  }
};

window.ApiService = ApiService;
