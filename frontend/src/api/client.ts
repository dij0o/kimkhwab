import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. REQUEST INTERCEPTOR: Attach the Access Token to every outgoing request
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
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
        const originalRequest = error.config;

        // If the error is 401 Unauthorized, and we haven't already retried this exact request...
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark this request so we don't get stuck in an infinite loop

            try {
                const refreshToken = localStorage.getItem('refresh_token');

                // If there's no refresh token in storage, we can't refresh. Force logout.
                if (!refreshToken) {
                    throw new Error("No refresh token available");
                }

                // Call your backend refresh endpoint directly using a raw axios instance 
                // (so we don't trigger the interceptors again)
                const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
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
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user_id');

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