const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ID_KEY = "user_id";
const LEGACY_SESSION_KEYS = ["role_id", "role_name"];

type SessionPayload = {
    accessToken: string;
    refreshToken: string;
    userId: number | string;
};

export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY);

export const getRefreshToken = (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY);

export const getUserId = (): string | null => localStorage.getItem(USER_ID_KEY);

export const setSession = ({ accessToken, refreshToken, userId }: SessionPayload): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_ID_KEY, String(userId));
};

export const clearSession = (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);

    for (const legacyKey of LEGACY_SESSION_KEYS) {
        localStorage.removeItem(legacyKey);
    }
};
