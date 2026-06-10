/**
 * fetchTimeout - Wrapper de fetch con timeout automático.
 * Todos los servicios deben usar esta función en lugar de fetch() desnudo
 * para evitar que las peticiones queden colgadas cuando el backend
 * (Railway en modo sleep) tarda en responder.
 *
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs - Default 20000ms (20s), suficiente para Railway cold start
 */
export const fetchTimeout = (url, options = {}, timeoutMs = 20000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const signal = options.signal
    ? combineSignals(options.signal, controller.signal)
    : controller.signal;

  return fetch(url, { ...options, signal })
    .finally(() => clearTimeout(timeoutId));
};

// Combina dos AbortSignals (por si el caller también pasa uno)
const combineSignals = (s1, s2) => {
  const controller = new AbortController();
  const abort = () => controller.abort();
  s1.addEventListener('abort', abort);
  s2.addEventListener('abort', abort);
  return controller.signal;
};

export default fetchTimeout;
