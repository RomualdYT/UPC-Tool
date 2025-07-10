import axios from 'axios';
import cacheManager from './cacheManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

class LazyLoader {
  constructor() {
    this.loadingStates = new Map();
    this.abortControllers = new Map();
  }

  // Chargement progressif avec cache et gestion d'erreurs
  async loadProgressively(endpoint, options = {}) {
    const {
      batchSize = 50,
      maxItems = null,
      useCache = true,
      cacheTTL = 5 * 60 * 1000, // 5 minutes
      onProgress = null,
      onError = null,
      abortSignal = null
    } = options;

    const cacheKey = cacheManager.generateKey(endpoint, { batchSize, maxItems });
    
    // Vérifier le cache si activé
    if (useCache) {
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        if (onProgress) onProgress({ loaded: cachedData.length, total: cachedData.length, data: cachedData });
        return { success: true, data: cachedData, fromCache: true };
      }
    }

    // Créer un contrôleur d'annulation
    const controller = new AbortController();
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }
    this.abortControllers.set(cacheKey, controller);

    try {
      let allResults = [];
      let skip = 0;
      let hasMore = true;
      let totalLoaded = 0;

      while (hasMore) {
        // Vérifier si on a atteint la limite
        if (maxItems && totalLoaded >= maxItems) {
          break;
        }

        // Calculer la taille du batch pour cette itération
        const currentBatchSize = maxItems 
          ? Math.min(batchSize, maxItems - totalLoaded)
          : batchSize;

        const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
          params: {
            limit: currentBatchSize,
            skip: skip
          },
          signal: controller.signal
        });

        const data = response.data;
        
        if (Array.isArray(data) && data.length > 0) {
          allResults = allResults.concat(data);
          skip += data.length;
          totalLoaded += data.length;
          hasMore = data.length === currentBatchSize;

          // Appeler le callback de progression
          if (onProgress) {
            onProgress({
              loaded: totalLoaded,
              total: maxItems || 'unknown',
              data: allResults,
              batch: data
            });
          }

          // Petite pause pour éviter de surcharger le serveur
          await new Promise(resolve => setTimeout(resolve, 100));
        } else {
          hasMore = false;
        }
      }

      // Mettre en cache si activé
      if (useCache) {
        cacheManager.set(cacheKey, allResults, cacheTTL);
      }

      this.abortControllers.delete(cacheKey);
      return { success: true, data: allResults, fromCache: false };

    } catch (error) {
      this.abortControllers.delete(cacheKey);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Chargement annulé', aborted: true };
      }

      const errorMsg = error.response?.data?.detail || 'Erreur lors du chargement progressif';
      if (onError) onError(errorMsg);
      
      return { success: false, error: errorMsg };
    }
  }

  // Chargement avec pagination virtuelle
  async loadWithVirtualPagination(endpoint, page, pageSize, options = {}) {
    const {
      useCache = true,
      cacheTTL = 10 * 60 * 1000, // 10 minutes pour la pagination
      onProgress = null
    } = options;

    const cacheKey = cacheManager.generateKey(endpoint, { page, pageSize });
    
    if (useCache) {
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        return { success: true, data: cachedData, fromCache: true };
      }
    }

    try {
      const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
        params: {
          limit: pageSize,
          skip: (page - 1) * pageSize
        }
      });

      const data = response.data;
      
      if (useCache) {
        cacheManager.set(cacheKey, data, cacheTTL);
      }

      if (onProgress) {
        onProgress({ page, pageSize, data });
      }

      return { success: true, data, fromCache: false };

    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erreur lors du chargement paginé';
      return { success: false, error: errorMsg };
    }
  }

  // Chargement avec préchargement intelligent
  async loadWithPreloading(endpoint, currentPage, pageSize, preloadPages = 1, options = {}) {
    const results = await this.loadWithVirtualPagination(endpoint, currentPage, pageSize, options);
    
    if (!results.success) return results;

    // Précharger les pages suivantes en arrière-plan
    const preloadPromises = [];
    for (let i = 1; i <= preloadPages; i++) {
      const nextPage = currentPage + i;
      preloadPromises.push(
        this.loadWithVirtualPagination(endpoint, nextPage, pageSize, {
          ...options,
          useCache: true // Toujours mettre en cache pour le préchargement
        })
      );
    }

    // Exécuter le préchargement en arrière-plan
    Promise.allSettled(preloadPromises).then(() => {
      console.log(`Préchargement terminé pour les pages ${currentPage + 1} à ${currentPage + preloadPages}`);
    });

    return results;
  }

  // Annuler un chargement en cours
  abortLoading(cacheKey) {
    const controller = this.abortControllers.get(cacheKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(cacheKey);
    }
  }

  // Annuler tous les chargements en cours
  abortAll() {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }

  // Obtenir l'état de chargement
  isLoading(cacheKey) {
    return this.abortControllers.has(cacheKey);
  }

  // Nettoyer les contrôleurs d'annulation expirés
  cleanup() {
    // Les contrôleurs sont automatiquement nettoyés après utilisation
    // Cette méthode peut être utilisée pour un nettoyage manuel si nécessaire
  }
}

// Instance singleton du lazy loader
const lazyLoader = new LazyLoader();

export default lazyLoader; 