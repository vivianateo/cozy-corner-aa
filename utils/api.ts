import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { BEARER_TOKEN_KEY } from "@/lib/auth";
import type { Place, PlaceDetail, Review } from "@/types";

const BASE_URL = 'https://7k7he546mxvm7vkye6kbx7uuaatr6se6.app.specular.dev';

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || BASE_URL;

export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

export const getBearerToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(BEARER_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    }
  } catch (error) {
    console.error("[API] Error retrieving bearer token:", error);
    return null;
  }
};

export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const url = `${BACKEND_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  const token = await getBearerToken();
  if (token) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error: ${response.status} - ${text}`);
  }

  return response.json();
};

export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: "GET" });
};

export const apiPost = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const apiPut = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const apiPatch = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const apiDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "DELETE",
    body: JSON.stringify(data),
  });
};

export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = await getBearerToken();

  if (!token) {
    throw new Error("Authentication token not found. Please sign in.");
  }

  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

export const authenticatedGet = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "GET" });
};

export const authenticatedPost = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const authenticatedPut = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const authenticatedPatch = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const authenticatedDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "DELETE",
    body: JSON.stringify(data),
  });
};

// ─── Places ──────────────────────────────────────────────────────────────────

export async function fetchPlaces(category?: string, search?: string, amenities?: string[]): Promise<{ places: Place[] }> {
  const params = new URLSearchParams();
  if (category && category !== 'tutti') params.append('category', category);
  if (search) params.append('search', search);
  if (amenities && amenities.length > 0) params.append('amenities', amenities.join(','));
  const endpoint = `/api/places?${params}`;
  console.log('[API] fetchPlaces', { category, search, amenities });
  const data = await apiGet<{ places: Place[] }>(endpoint);
  console.log('[API] fetchPlaces success', data?.places?.length, 'luoghi');
  return data;
}

export async function fetchPlace(id: string): Promise<PlaceDetail> {
  console.log('[API] fetchPlace', { id });
  const data = await apiGet<PlaceDetail>(`/api/places/${id}`);
  console.log('[API] fetchPlace success', data?.name);
  return data;
}

export async function createReview(
  placeId: string,
  data: { author_name: string; rating: number; comment: string }
): Promise<Review> {
  console.log('[API] createReview', { placeId, data });
  const result = await apiPost<Review>(`/api/places/${placeId}/reviews`, data);
  console.log('[API] createReview success', result?.id);
  return result;
}

export async function createPlace(data: {
  name: string;
  category: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  amenities?: string[];
}): Promise<Place> {
  console.log('[API] createPlace', { data });
  const result = await apiPost<Place>('/api/places', data);
  console.log('[API] createPlace success', result?.id);
  return result;
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function fetchFavoriteIds(): Promise<string[]> {
  console.log('[API] fetchFavoriteIds');
  const data = await apiGet<{ ids: string[] }>('/api/favorites/ids');
  console.log('[API] fetchFavoriteIds success', data?.ids?.length, 'ids');
  return data.ids ?? [];
}

export async function addFavorite(placeId: string): Promise<void> {
  console.log('[API] addFavorite', { placeId });
  await apiPost('/api/favorites', { place_id: placeId });
  console.log('[API] addFavorite success', placeId);
}

export async function removeFavorite(placeId: string): Promise<void> {
  console.log('[API] removeFavorite', { placeId });
  await apiDelete(`/api/favorites/${placeId}`);
  console.log('[API] removeFavorite success', placeId);
}

export async function fetchFavorites(): Promise<Place[]> {
  console.log('[API] fetchFavorites');
  const data = await apiGet<{ favorites: Place[] }>('/api/favorites');
  console.log('[API] fetchFavorites success', data?.favorites?.length, 'preferiti');
  return data.favorites ?? [];
}
