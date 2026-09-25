// Registro de eventos mínimo para comprobar suscripciones y limpieza sin navegador.
function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
    dispatch(type) { for (const handler of [...(listeners.get(type) ?? [])]) handler(); },
    listenerCount() { return [...listeners.values()].reduce((count, set) => count + set.size, 0); },
  };
}

module.exports = { eventTarget };
