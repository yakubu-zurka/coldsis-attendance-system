import { useState } from 'react';
import { LocationData } from '../types';

export function useGeolocation() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // We change this to return a Promise so 'await' works correctly
  const getLocation = (): Promise<LocationData | null> => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      if (!navigator.geolocation) {
        const msg = 'Geolocation is not supported by your browser';
        setError(msg);
        setLoading(false);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Raw Geolocation Position:", position);
          const coords: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Math.round(position.coords.accuracy),
            timestamp: position.timestamp,
          };
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          const errorMessage = {
            1: 'Permission denied. Please enable location access.',
            2: 'Position unavailable.',
            3: 'Request timeout.',
          }[err.code as 1 | 2 | 3] || 'Error getting location';
          
          setError(errorMessage);
          setLoading(false);
          // Resolve null so callers can handle gracefully; error is set in hook state
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return { location, error, loading, getLocation };
}