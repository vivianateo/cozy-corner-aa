import { Place, PlaceDetail, Review } from '@/types';

const BASE_URL = 'https://7k7he546mxvm7vkye6kbx7uuaatr6se6.app.specular.dev';

export async function fetchPlaces(category?: string, search?: string, amenities?: string[]): Promise<{ places: Place[] }> {
  const params = new URLSearchParams();
  if (category && category !== 'tutti') params.append('category', category);
  if (search) params.append('search', search);
  if (amenities && amenities.length > 0) params.append('amenities', amenities.join(','));
  const url = `${BASE_URL}/api/places?${params}`;
  console.log('[API] fetchPlaces', { category, search, amenities, url });
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error('[API] fetchPlaces error', res.status, text);
    throw new Error(`Errore nel caricamento dei luoghi (${res.status})`);
  }
  const data = await res.json();
  console.log('[API] fetchPlaces success', data?.places?.length, 'luoghi');
  return data;
}

export async function fetchPlace(id: string): Promise<PlaceDetail> {
  const url = `${BASE_URL}/api/places/${id}`;
  console.log('[API] fetchPlace', { id, url });
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error('[API] fetchPlace error', res.status, text);
    throw new Error(`Errore nel caricamento del luogo (${res.status})`);
  }
  const data = await res.json();
  console.log('[API] fetchPlace success', data?.name);
  return data;
}

export async function createReview(
  placeId: string,
  data: { author_name: string; rating: number; comment: string }
): Promise<Review> {
  const url = `${BASE_URL}/api/places/${placeId}/reviews`;
  console.log('[API] createReview', { placeId, data });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[API] createReview error', res.status, text);
    throw new Error(`Errore nella pubblicazione della recensione (${res.status})`);
  }
  const result = await res.json();
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
  const url = `${BASE_URL}/api/places`;
  console.log('[API] createPlace', { data });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[API] createPlace error', res.status, text);
    throw new Error(`Errore nella creazione del luogo (${res.status})`);
  }
  const result = await res.json();
  console.log('[API] createPlace success', result?.id);
  return result;
}
