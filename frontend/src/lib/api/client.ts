const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {},
  isRetry = false
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const config: RequestInit = {
    method: options.body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    // Crucial for HttpOnly JWT Cookies authentication
    credentials: "include",
    ...customConfig,
  };

  const response = await fetch(url, config);

  // Auto-refresh access token on 401 for authenticated endpoints
  if (response.status === 401 && !isRetry && !endpoint.startsWith("/auth/")) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (refreshResponse.ok) {
        // Retry original request once
        return apiClient<T>(endpoint, options, true);
      }
    } catch {
      // Fall through to standard error handling if refresh fails
    }
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      if (typeof errorData.detail === "string") {
        errorMessage = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage = errorData.detail.map((e: any) => e.msg).join(", ");
      }
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
