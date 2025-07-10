// Gestionnaire de cache intelligent pour les requêtes API
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes par défaut
    this.maxSize = 100; // Nombre maximum d'éléments en cache
  }

  // Générer une clé de cache basée sur l'URL et les paramètres
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `${url}?${sortedParams}`;
  }

  // Vérifier si un élément est en cache et valide
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Vérifier si l'élément a expiré
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Mettre à jour le timestamp d'accès pour LRU
    item.lastAccessed = Date.now();
    return item.data;
  }

  // Ajouter un élément au cache
  set(key, data, ttl = this.defaultTTL) {
    // Nettoyer le cache si nécessaire
    this.cleanup();

    // Si le cache est plein, supprimer l'élément le moins récemment utilisé
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    });
  }

  // Supprimer un élément du cache
  delete(key) {
    return this.cache.delete(key);
  }

  // Vider tout le cache
  clear() {
    this.cache.clear();
  }

  // Nettoyer les éléments expirés
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Supprimer l'élément le moins récemment utilisé (LRU)
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Obtenir les statistiques du cache
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiry) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      total: this.cache.size,
      valid: validItems,
      expired: expiredItems,
      maxSize: this.maxSize
    };
  }

  // Invalider le cache pour une URL spécifique (pattern matching)
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Instance singleton du cache
const cacheManager = new CacheManager();

export default cacheManager; 