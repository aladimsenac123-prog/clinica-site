const config = require('../config/app.config');

class BiometricService {
  /**
   * Calculates the Euclidean distance between two 128-dimensional vectors.
   * Distance < 0.52 indicates a high-confidence match.
   * @param {number[]} vecA 
   * @param {number[]} vecB 
   * @returns {number}
   */
  calculateEuclideanDistance(vecA, vecB) {
    if (!Array.isArray(vecA) || !Array.isArray(vecB)) {
      throw new Error('Descriptors must be valid numeric arrays');
    }
    if (vecA.length !== config.biometrics.descriptorDimension || vecB.length !== config.biometrics.descriptorDimension) {
      throw new Error(`Invalid descriptor dimension: Expected ${config.biometrics.descriptorDimension}, received ${vecA.length} and ${vecB.length}`);
    }

    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Converts Euclidean distance to a human-readable match confidence percentage.
   * Lower distance = higher confidence.
   * @param {number} distance 
   * @returns {number} Percentage between 0 and 100
   */
  distanceToConfidence(distance) {
    // Standard face-api heuristic: 0.0 distance = 100%, 0.5 distance ~= 85%, 0.6 distance ~= 60%
    const confidence = Math.max(0, Math.min(100, Math.round((1 - distance * 0.9) * 100)));
    return confidence;
  }

  /**
   * Matches a probe descriptor against a database of registered users.
   * @param {number[]} probeDescriptor 
   * @param {Array<{id: string, name: string, descriptor: number[], role: string}>} users 
   * @param {number} customThreshold
   * @returns {{matched: boolean, user: object|null, distance: number, confidence: number}}
   */
  findBestMatch(probeDescriptor, users, customThreshold = config.biometrics.matchThreshold) {
    if (!users || users.length === 0) {
      return { matched: false, user: null, distance: 999, confidence: 0, reason: 'Nenhum usuário cadastrado na base' };
    }

    let bestMatch = null;
    let minDistance = Infinity;

    for (const user of users) {
      if (!user.descriptor || !Array.isArray(user.descriptor)) continue;

      const distance = this.calculateEuclideanDistance(probeDescriptor, user.descriptor);
      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = user;
      }
    }

    const confidence = this.distanceToConfidence(minDistance);
    const matched = minDistance <= customThreshold;

    return {
      matched,
      user: matched ? {
        id: bestMatch.id,
        name: bestMatch.name,
        role: bestMatch.role,
        department: bestMatch.department,
        badgeNumber: bestMatch.badgeNumber,
        registeredAt: bestMatch.registeredAt
      } : null,
      distance: parseFloat(minDistance.toFixed(4)),
      confidence,
      threshold: customThreshold
    };
  }

  /**
   * Validates if the raw array is a legitimate face descriptor
   * @param {any} descriptor 
   * @returns {boolean}
   */
  validateDescriptor(descriptor) {
    if (!Array.isArray(descriptor)) return false;
    if (descriptor.length !== config.biometrics.descriptorDimension) return false;
    return descriptor.every(num => typeof num === 'number' && !isNaN(num) && isFinite(num));
  }
}

module.exports = new BiometricService();
