import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface Court {
  id: string;
  name: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  surface: string;
  photoUrl: string | null;
  verified: boolean;
  distance?: number;
}

// Fetch courts near a location
export function useCourtsNearby(lat: number, lng: number, radius = 30000) {
  return useQuery({
    queryKey: ['courts', 'nearby', lat, lng, radius],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
      });
      return api.get(`courts?${params}`).json<Court[]>();
    },
    enabled: lat !== 0 && lng !== 0,
    staleTime: 300_000,
  });
}

// Fetch all courts (no location filter)
export function useCourts() {
  return useQuery({
    queryKey: ['courts', 'all'],
    queryFn: () => api.get('courts').json<Court[]>(),
    staleTime: 300_000,
  });
}
