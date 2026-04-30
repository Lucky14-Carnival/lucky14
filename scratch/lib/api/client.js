const trimSlash = (value) => value.replace(/\/+$/, "");
const rawBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || "";
const baseUrl = rawBaseUrl ? trimSlash(rawBaseUrl) : "";
const REQUEST_TIMEOUT_MS = 10000;

export const apiConfig = {
  baseUrl,
};

const normalizeError = (error, fallbackMessage) => {
  const fallback = fallbackMessage || "Something went wrong.";
  if (error instanceof Error) {
    const raw = String(error.message || "").trim();
    return new Error(raw ? `${fallback} (${raw})` : fallback);
  }

  return new Error(fallback);
};

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const apiRequest = async (path, options = {}) => {
  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  }

  let response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${baseUrl}${path}${buildQueryString(options.params)}`;
    response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        ...(options.headers || {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds. Check if the API server at ${baseUrl} is running and reachable from your phone.`
      );
    }

    throw normalizeError(
      error,
      `Unable to reach the API server at ${baseUrl}. Check your network and API URL.`
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}.`);
  }

  return payload;
};
