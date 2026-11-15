import { useState, useCallback } from 'react';

export type GeolocationStatus = 'idle' | 'locating' | 'located' | 'denied' | 'error';

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

/** Hook to query the user's geographic position for the 3D marker. */
export function useUserGeolocation() {
  const [status, setStatus] = useState<GeolocationStatus>('idle');
  const [coords, setCoords] = useState<UserCoordinates | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestLocation = useCallback((): Promise<UserCoordinates | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation is not available in this browser.');
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
            setErrorMessage('Location permission denied.');
          } else {
            setStatus('error');
            setErrorMessage('Could not determine location.');
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
