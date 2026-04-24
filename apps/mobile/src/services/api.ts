import ky, { type KyInstance } from 'ky';
import { useAuthStore } from '../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api: KyInstance = ky.create({
  prefixUrl: `${API_URL}/api`,
  timeout: 15000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, options, response) => {
        if (response.status === 401) {
          const { refreshToken, setTokens, logout } = useAuthStore.getState();
          if (!refreshToken) {
            await logout();
            return;
          }

          try {
            const refreshResponse = await ky
              .post(`${API_URL}/api/auth/refresh`, {
                headers: { Authorization: `Bearer ${refreshToken}` },
              })
              .json<{ accessToken: string; refreshToken: string }>();

            await setTokens(refreshResponse.accessToken, refreshResponse.refreshToken);

            // Retry original request with new token
            request.headers.set('Authorization', `Bearer ${refreshResponse.accessToken}`);
            return ky(request, options);
          } catch {
            await logout();
          }
        }
      },
    ],
  },
});
