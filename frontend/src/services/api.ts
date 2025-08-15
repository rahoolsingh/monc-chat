import { ApiResponse } from "../types";

// API Configuration
const API_BASE_URL =
    import.meta.env.REACT_APP_API_URL || "http://localhost:3001";
const API_TIMEOUT = 10000; // 10 seconds

// Custom error class for API errors
export class ApiError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: string,
        public status?: number
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// Response interceptor for logging and error handling
const handleResponse = async <T>(
    response: Response
): Promise<ApiResponse<T>> => {
    let data: ApiResponse<T>;

    try {
        data = await response.json();
    } catch (error) {
        throw new ApiError(
            "PARSE_ERROR",
            "Failed to parse response JSON",
            error instanceof Error ? error.message : "Unknown parsing error",
            response.status
        );
    }

    // Handle API error responses
    if (!response.ok || !data.success) {
        const error = data.error || {
            code: "HTTP_ERROR",
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: "Request failed",
        };

        throw new ApiError(
            error.code,
            error.message,
            error.details,
            response.status
        );
    }

    return data;
};

// Retry logic for failed requests
const withRetry = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;

            // Don't retry on client errors (4xx)
            if (
                error instanceof ApiError &&
                error.status &&
                error.status >= 400 &&
                error.status < 500
            ) {
                throw error;
            }

            if (attempt === maxRetries) {
                break;
            }

            console.warn(
                `⚠️ API request failed (attempt ${attempt}/${maxRetries}):`,
                error
            );
            await new Promise((resolve) =>
                setTimeout(resolve, delay * attempt)
            );
        }
    }

    throw lastError!;
};

// Base API client
export class ApiClient {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const requestOptions: RequestInit = {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            return await handleResponse<T>(response);
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof ApiError) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new ApiError(
                        "TIMEOUT_ERROR",
                        "Request timed out",
                        `Request took longer than ${this.timeout}ms`
                    );
                }

                throw new ApiError(
                    "NETWORK_ERROR",
                    "Network request failed",
                    error.message
                );
            }

            throw new ApiError(
                "UNKNOWN_ERROR",
                "An unknown error occurred",
                String(error)
            );
        }
    }

    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return withRetry(() => this.request<T>(endpoint, { method: "GET" }));
    }

    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return withRetry(() =>
            this.request<T>(endpoint, {
                method: "POST",
                body: data ? JSON.stringify(data) : undefined,
            })
        );
    }

    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        return withRetry(() =>
            this.request<T>(endpoint, {
                method: "PUT",
                body: data ? JSON.stringify(data) : undefined,
            })
        );
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return withRetry(() => this.request<T>(endpoint, { method: "DELETE" }));
    }
}

// Default API client instance
export const apiClient = new ApiClient();
