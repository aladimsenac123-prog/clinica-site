const fs = require('fs');
const path = require('path');
const config = require('../config/app.config');

class StorageService {
  constructor() {
    this._ensureDirectoriesAndFiles();
  }

  _ensureDirectoriesAndFiles() {
    if (!fs.existsSync(config.paths.dataDir)) {
      fs.mkdirSync(config.paths.dataDir, { recursive: true });
    }

    if (!fs.existsSync(config.paths.usersFile)) {
      const seedUsers = path.join(__dirname, '../data/users.json');
      if (process.env.VERCEL && fs.existsSync(seedUsers)) {
        try {
          fs.copyFileSync(seedUsers, config.paths.usersFile);
        } catch (e) {
          fs.writeFileSync(config.paths.usersFile, JSON.stringify([], null, 2), 'utf-8');
        }
      } else {
        fs.writeFileSync(config.paths.usersFile, JSON.stringify([], null, 2), 'utf-8');
      }
    }

    if (!fs.existsSync(config.paths.auditLogsFile)) {
      const seedLogs = path.join(__dirname, '../data/access_logs.json');
      if (process.env.VERCEL && fs.existsSync(seedLogs)) {
        try {
          fs.copyFileSync(seedLogs, config.paths.auditLogsFile);
        } catch (e) {
          fs.writeFileSync(config.paths.auditLogsFile, JSON.stringify([], null, 2), 'utf-8');
        }
      } else {
        fs.writeFileSync(config.paths.auditLogsFile, JSON.stringify([], null, 2), 'utf-8');
      }
    }
  }

  getUsers() {
    try {
      const data = fs.readFileSync(config.paths.usersFile, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error('[StorageService] Error reading users file:', err);
      return [];
    }
  }

  saveUsers(users) {
    try {
      fs.writeFileSync(config.paths.usersFile, JSON.stringify(users, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[StorageService] Error saving users file:', err);
      return false;
    }
  }

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    return this.saveUsers(users);
  }

  getAuditLogs() {
    try {
      const data = fs.readFileSync(config.paths.auditLogsFile, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error('[StorageService] Error reading audit logs:', err);
      return [];
    }
  }

  addAuditLog(logEntry) {
    try {
      const logs = this.getAuditLogs();
      logs.unshift(logEntry); // newest first
      // Keep up to 200 logs
      if (logs.length > 200) logs.length = 200;
      fs.writeFileSync(config.paths.auditLogsFile, JSON.stringify(logs, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[StorageService] Error writing audit log:', err);
      return false;
    }
  }
}

module.exports = new StorageService();
