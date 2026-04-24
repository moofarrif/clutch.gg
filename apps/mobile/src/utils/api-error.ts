import { HTTPError } from 'ky';

interface ApiErrorInfo {
  status: number;
  message: string;
}

/**
 * Parses any error from ky/API into a consistent format.
 * Works with HTTPError (ky), network errors, and unknown errors.
 */
export async function parseApiError(error: unknown): Promise<ApiErrorInfo> {
  // ky HTTPError — has response with status + JSON body
  if (error instanceof HTTPError) {
    const status = error.response.status;
    try {
      const body = await error.response.json();
      return {
        status,
        message: body?.message ?? `Error ${status}`,
      };
    } catch {
      return { status, message: `Error ${status}` };
    }
  }

  // Network error (no connection)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return { status: 0, message: 'Sin conexión. Verifica tu internet.' };
  }

  // Unknown error
  return {
    status: 500,
    message: error instanceof Error ? error.message : 'Error inesperado',
  };
}

/**
 * Returns a user-friendly error message in Spanish.
 */
export async function getErrorMessage(error: unknown, context?: {
  401?: string;
  409?: string;
  404?: string;
  422?: string;
}): Promise<string> {
  const { status, message } = await parseApiError(error);

  // Custom messages by status
  if (context?.[status as keyof typeof context]) {
    return context[status as keyof typeof context]!;
  }

  // Default messages
  switch (status) {
    case 0: return 'Sin conexión. Verifica tu internet.';
    case 401: return 'Credenciales inválidas';
    case 403: return 'No tienes permiso para esta acción';
    case 404: return 'No encontrado';
    case 409: return message || 'Ya existe';
    case 422: return 'Datos inválidos';
    case 429: return 'Demasiados intentos. Espera un momento.';
    default: return message;
  }
}
