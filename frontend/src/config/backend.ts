const API_PREFIX = "/api/v1";
const DEFAULT_BACKEND_BASE_URL = "http://localhost:8000";
const ABSOLUTE_URL_PATTERN = /^[a-z][a-z\d+\-.]*:/i;

type BackendRuntimeConfig = {
    apiBaseUrl: string;
    backendBaseUrl: string;
};

const createDefaultConfig = (): BackendRuntimeConfig => ({
    apiBaseUrl: `${DEFAULT_BACKEND_BASE_URL}${API_PREFIX}`,
    backendBaseUrl: DEFAULT_BACKEND_BASE_URL,
});

const stripTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

const normalizePath = (value: string): string => {
    const trimmedValue = value.trim();

    if (!trimmedValue || trimmedValue === "/") {
        return "";
    }

    if (trimmedValue.includes("?") || trimmedValue.includes("#")) {
        throw new Error("VITE_API_URL must not include a query string or hash fragment.");
    }

    const sanitizedValue = stripTrailingSlashes(trimmedValue);
    return sanitizedValue.startsWith("/") ? sanitizedValue : `/${sanitizedValue}`;
};

const derivePaths = (pathValue: string): { apiPath: string; backendPath: string } => {
    const normalizedPath = normalizePath(pathValue);
    const apiPath = normalizedPath.endsWith(API_PREFIX)
        ? normalizedPath || API_PREFIX
        : `${normalizedPath}${API_PREFIX}`;

    const backendPath = apiPath.endsWith(API_PREFIX)
        ? apiPath.slice(0, -API_PREFIX.length)
        : normalizedPath;

    return {
        apiPath,
        backendPath,
    };
};

const resolveAbsoluteConfig = (rawValue: string): BackendRuntimeConfig => {
    const parsedUrl = new URL(rawValue);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("VITE_API_URL must use http or https.");
    }

    if (parsedUrl.username || parsedUrl.password) {
        throw new Error("VITE_API_URL must not embed credentials.");
    }

    if (parsedUrl.search || parsedUrl.hash) {
        throw new Error("VITE_API_URL must not include a query string or hash fragment.");
    }

    const { apiPath, backendPath } = derivePaths(parsedUrl.pathname);
    const origin = parsedUrl.origin;

    return {
        apiBaseUrl: `${origin}${apiPath}`,
        backendBaseUrl: backendPath ? `${origin}${backendPath}` : origin,
    };
};

const resolveRelativeConfig = (rawValue: string): BackendRuntimeConfig => {
    const { apiPath, backendPath } = derivePaths(rawValue);

    return {
        apiBaseUrl: apiPath,
        backendBaseUrl: backendPath,
    };
};

export const resolveBackendConfig = (rawValue?: string): BackendRuntimeConfig => {
    const configuredValue = rawValue?.trim();

    if (!configuredValue) {
        return createDefaultConfig();
    }

    try {
        if (configuredValue.startsWith("/")) {
            return resolveRelativeConfig(configuredValue);
        }

        return resolveAbsoluteConfig(configuredValue);
    } catch (error) {
        console.warn(
            `Invalid VITE_API_URL "${configuredValue}". Falling back to ${DEFAULT_BACKEND_BASE_URL}${API_PREFIX}.`,
            error
        );
        return createDefaultConfig();
    }
};

const runtimeConfig = resolveBackendConfig(import.meta.env.VITE_API_URL);

export const apiBaseUrl = runtimeConfig.apiBaseUrl;
export const backendBaseUrl = runtimeConfig.backendBaseUrl;

export const resolveBackendUrl = (path?: string | null): string => {
    if (!path) {
        return "";
    }

    if (ABSOLUTE_URL_PATTERN.test(path) || path.startsWith("//")) {
        return path;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return backendBaseUrl ? `${backendBaseUrl}${normalizedPath}` : normalizedPath;
};
