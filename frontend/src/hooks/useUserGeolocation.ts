import { useState, useCallback } from 'react';

export type GeolocationStatus = 'idle' | 'locating' | 'located' | 'denied' | 'error';

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

/** Hook para consultar la posición geográfica del usuario para el marcador 3D. */
export function useUserGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<UserCoordinates | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocalización no disponible en este navegador.');
      return Promise.resolve(null);
    }

    setStatus('locating');
    setErrorMessage(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: UserCoordinates = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoords(userCoords);
          setStatus('located');
          resolve(userCoords);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setStatus('denied');
            setErrorMessage('Permiso de ubicación denegado.');
          } else {
            setStatus('error');
            setErrorMessage('No se pudo determinar la ubicación.');
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
      );
    });
  }, []);

  return {
    status,
    coords,
    errorMessage,
    requestLocation,
  };
}
