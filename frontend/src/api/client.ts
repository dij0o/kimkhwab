import axios, { type InternalAxiosRequestConfig } from 'axios';
import { apiBaseUrl } from '../config/backend';
import { clearSession, getAccessToken, getRefreshToken } from '../auth/session';

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const AUTH_ROUTE_SUFFIXES = ['/auth/login', '/auth/refresh'];
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:/i;

const buildRequestUrl = (baseURL?: string, requestUrl?: string): string => {
    if (!requestUrl) {
        return baseURL || '';
    }

    if (ABSOLUTE_URL_PATTERN.test(requestUrl)) {
        return requestUrl;
    }

    const sanitizedBaseUrl = (baseURL || '').replace(/\/+$/, '');
    const sanitizedRequestUrl = requestUrl.replace(/^\/+/, '');

    if (!sanitizedBaseUrl) {
        return `/${sanitizedRequestUrl}`;
    }

    return `${sanitizedBaseUrl}/${sanitizedRequestUrl}`;
};

const getRequestPath = (baseURL?: string, requestUrl?: string): string => {
    const resolvedUrl = buildRequestUrl(baseURL, requestUrl);

    if (!resolvedUrl) {
        return '';
    }

    try {
        const parsedUrl = ABSOLUTE_URL_PATTERN.test(resolvedUrl)
            ? new URL(resolvedUrl)
            : new URL(resolvedUrl, window.location.origin);

        return parsedUrl.pathname;
    } catch {
        return '';
    }
};

const isAuthRequest = (config: { baseURL?: string; url?: string }): boolean => {
    const requestPath = getRequestPath(config.baseURL, config.url);
    return AUTH_ROUTE_SUFFIXES.some((suffix) => requestPath.endsWith(suffix));
};

const apiClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. REQUEST INTERCEPTOR: Attach the Access Token to every outgoing request
apiClient.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token && !isAuthRequest(config)) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 2. RESPONSE INTERCEPTOR: Handle 401 Token Expiration globally
apiClient.interceptors.response.use(
    (response) => {
        // If the request succeeds, just return the response normally
        return response;
    },
    async (error) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        // If the error is 401 Unauthorized, and we haven't already retried this exact request...
        if (
            originalRequest &&
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthRequest(originalRequest) &&
            !!getAccessToken()
        ) {
            originalRequest._retry = true; // Mark this request so we don't get stuck in an infinite loop

            try {
                const refreshToken = getRefreshToken();

                // If there's no refresh token in storage, we can't refresh. Force logout.
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                // Call your backend refresh endpoint directly using a raw axios instance 
                // (so we don't trigger the interceptors again)
                const refreshResponse = await axios.post(`${apiBaseUrl}/auth/refresh`, {
                    refresh_token: refreshToken
                });

                // Get the shiny new access token!
                const newAccessToken = refreshResponse.data.access_token;

                // Save it to Local Storage
                localStorage.setItem('access_token', newAccessToken);

                // Update the Authorization header on the failed request with the new token
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Retry the original request seamlessly!
                return apiClient(originalRequest);

            } catch (refreshError) {
                // IMPORTANT: If the refresh token is expired or invalid, the session is truly over.
                // Clean up all local storage data to prevent corrupted states.
                clearSession();

                // Force a hard redirect to the login page
                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        // For all other errors (400, 404, 500, etc.), just pass them down to the component
        return Promise.reject(error);
    }
);

export default apiClient;
