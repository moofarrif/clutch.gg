import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { api } from '../services/api';
import { useAuthStore, type User } from '../stores/auth';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      return api.post('auth/register', { json: data }).json<AuthResponse>();
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)/explore');
    },
  });
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      return api.post('auth/login', { json: data }).json<AuthResponse>();
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)/explore');
    },
  });
}

export function useGoogleAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: async (idToken: string) => {
      return api.post('auth/google', { json: { idToken } }).json<AuthResponse>();
    },
    onSuccess: async (data) => {
      await setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/(tabs)/explore');
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('auth/logout');
      } catch {
        // Logout even if API call fails
      }
    },
    onSettled: async () => {
      await logout();
      router.replace('/(auth)/sign-in');
    },
  });
}

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async () => {
      return api.get('auth/me').json<User>();
    },
    onSuccess: (user) => {
      setUser(user);
    },
  });
}
