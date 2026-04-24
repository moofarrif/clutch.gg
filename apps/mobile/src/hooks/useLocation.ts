import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';

interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
}

interface UseLocationResult {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Default: Bogotá centro (fallback si no hay permiso)
const DEFAULT_LOCATION: UserLocation = { lat: 4.711, lng: -74.0721, city: 'Bogotá' };

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const fetchLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setPermissionDenied(true);
        setLocation(DEFAULT_LOCATION);
        setLoading(false);
        return;
      }

      setPermissionDenied(false);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLoc: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Reverse geocode para obtener ciudad
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (geocode?.city) {
          userLoc.city = geocode.city;
        }
      } catch {
        // Geocoding falla silenciosamente — no es crítico
      }

      setLocation(userLoc);
    } catch (err) {
      setError('No se pudo obtener tu ubicación');
      setLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    loading,
    error,
    permissionDenied,
    requestPermission: fetchLocation,
    refresh: fetchLocation,
  };
}
