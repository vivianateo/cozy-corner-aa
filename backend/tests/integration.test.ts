import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus } from "./helpers";

describe("API Integration Tests", () => {
  let placeId: string;
  let placeWithAmenitiesId: string;
  let authToken: string;

  test("Setup auth for favorites tests", async () => {
    const { token } = await signUpTestUser();
    authToken = token;
    expect(authToken).toBeDefined();
  });

  test("List all places", async () => {
    const res = await api("/api/places");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data).toHaveProperty("places");
    expect(Array.isArray(data.places)).toBe(true);
  });

  test("Create a place", async () => {
    const res = await api("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Restaurant",
        category: "ristoranti",
        description: "A great restaurant for testing",
        address: "Via Roma 1, Milano",
        latitude: 45.4642,
        longitude: 9.1900,
        image_url: "https://example.com/image.jpg",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data).toHaveProperty("id");
    expect(data.name).toBe("Test Restaurant");
    expect(data.category).toBe("ristoranti");
    placeId = data.id;
  });

  test("Create a place with amenities", async () => {
    const res = await api("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Family-Friendly Park",
        category: "parchi",
        description: "A great park for families",
        address: "Via Verde 5, Milano",
        latitude: 45.4800,
        longitude: 9.2100,
        amenities: ["seggiolone", "luogo_gioco"],
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data).toHaveProperty("id");
    expect(data.name).toBe("Family-Friendly Park");
    expect(Array.isArray(data.amenities)).toBe(true);
    placeWithAmenitiesId = data.id;
  });

  test("Get place by ID", async () => {
    const res = await api(`/api/places/${placeId}`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.id).toBe(placeId);
    expect(data.name).toBe("Test Restaurant");
    expect(data).toHaveProperty("reviews");
    expect(Array.isArray(data.reviews)).toBe(true);
  });

  test("Create a review for a place", async () => {
    const res = await api(`/api/places/${placeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: "John Doe",
        rating: 5,
        comment: "Excellent place!",
      }),
    });
    await expectStatus(res, 201);
    const data = await res.json();
    expect(data).toHaveProperty("id");
    expect(data.place_id).toBe(placeId);
    expect(data.author_name).toBe("John Doe");
    expect(data.rating).toBe(5);
  });

  test("Get place with review included", async () => {
    const res = await api(`/api/places/${placeId}`);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.reviews.length).toBeGreaterThan(0);
  });

  test("List places with category filter", async () => {
    const res = await api("/api/places?category=ristoranti");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.places)).toBe(true);
  });

  test("List places with search filter", async () => {
    const res = await api("/api/places?search=Test");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.places)).toBe(true);
  });

  test("List places with amenities filter", async () => {
    const res = await api("/api/places?amenities=seggiolone");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.places)).toBe(true);
  });

  test("List places with amenities filter for multiple amenities", async () => {
    const res = await api("/api/places?amenities=seggiolone,luogo_gioco");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.places)).toBe(true);
  });

  test("Get non-existent place returns 404", async () => {
    const res = await api("/api/places/00000000-0000-0000-0000-000000000000");
    await expectStatus(res, 404);
  });

  test("Create review for non-existent place returns 404", async () => {
    const res = await api("/api/places/00000000-0000-0000-0000-000000000000/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: "Jane Doe",
        rating: 4,
        comment: "Good place",
      }),
    });
    await expectStatus(res, 404);
  });

  test("Create place with missing required field returns 400", async () => {
    const res = await api("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Incomplete Place",
        category: "parchi",
        // missing description, address, latitude, longitude
      }),
    });
    await expectStatus(res, 400);
  });

  test("Create place with invalid category returns 400", async () => {
    const res = await api("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Place",
        category: "invalid_category",
        description: "A place",
        address: "Via Roma 1, Milano",
        latitude: 45.4642,
        longitude: 9.1900,
      }),
    });
    await expectStatus(res, 400);
  });

  test("Create review with missing required field returns 400", async () => {
    const res = await api(`/api/places/${placeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: "Test User",
        // missing rating and comment
      }),
    });
    await expectStatus(res, 400);
  });

  test("Create review with rating out of range (above max) returns 400", async () => {
    const res = await api(`/api/places/${placeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: "Test User",
        rating: 10, // Invalid: max is 5
        comment: "Test comment",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Create review with rating below minimum returns 400", async () => {
    const res = await api(`/api/places/${placeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: "Test User",
        rating: 0, // Invalid: min is 1
        comment: "Test comment",
      }),
    });
    await expectStatus(res, 400);
  });

  test("Create review with negative rating returns 400", async () => {
    const res = await api(`/api/places/${placeId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author_name: "Test User",
        rating: -1, // Invalid: min is 1
        comment: "Test comment",
      }),
    });
    await expectStatus(res, 400);
  });

  test("List places with multiple filters (category and search)", async () => {
    const res = await api("/api/places?category=ristoranti&search=Test");
    await expectStatus(res, 200);
    const data = await res.json();
    expect(Array.isArray(data.places)).toBe(true);
  });

  // Favorites tests - authenticated endpoints
  test("Get favorite IDs for authenticated user (initially empty)", async () => {
    const res = await authenticatedApi("/api/favorites/ids", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data).toHaveProperty("ids");
    expect(Array.isArray(data.ids)).toBe(true);
  });

  test("Get all favorites for authenticated user (initially empty)", async () => {
    const res = await authenticatedApi("/api/favorites", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data).toHaveProperty("favorites");
    expect(Array.isArray(data.favorites)).toBe(true);
  });

  test("Add place to favorites", async () => {
    const res = await authenticatedApi("/api/favorites", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: placeId,
      }),
    });
    await expectStatus(res, 200, 201);
    const data = await res.json();
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
  });

  test("Get favorite IDs includes newly added place", async () => {
    const res = await authenticatedApi("/api/favorites/ids", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.ids).toContain(placeId);
  });

  test("Get all favorites includes newly added place with place details", async () => {
    const res = await authenticatedApi("/api/favorites", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    const favoriteIds = data.favorites.map((fav: any) => fav.id);
    expect(favoriteIds).toContain(placeId);
    const favPlace = data.favorites.find((fav: any) => fav.id === placeId);
    expect(favPlace).toHaveProperty("name");
    expect(favPlace).toHaveProperty("category");
  });

  test("Add another place to favorites", async () => {
    const res = await authenticatedApi("/api/favorites", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: placeWithAmenitiesId,
      }),
    });
    await expectStatus(res, 200, 201);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test("Remove place from favorites", async () => {
    const res = await authenticatedApi(`/api/favorites/${placeId}`, authToken, {
      method: "DELETE",
    });
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data).toHaveProperty("success");
    expect(data.success).toBe(true);
  });

  test("Get favorite IDs after removal does not include deleted place", async () => {
    const res = await authenticatedApi("/api/favorites/ids", authToken);
    await expectStatus(res, 200);
    const data = await res.json();
    expect(data.ids).not.toContain(placeId);
    expect(data.ids).toContain(placeWithAmenitiesId);
  });

  test("Add non-existent place to favorites returns 404", async () => {
    const res = await authenticatedApi("/api/favorites", authToken, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: "00000000-0000-0000-0000-000000000000",
      }),
    });
    await expectStatus(res, 404);
  });

  test("Get favorites without authentication returns 401", async () => {
    const res = await api("/api/favorites");
    await expectStatus(res, 401);
  });

  test("Get favorite IDs without authentication returns 401", async () => {
    const res = await api("/api/favorites/ids");
    await expectStatus(res, 401);
  });

  test("Add to favorites without authentication returns 401", async () => {
    const res = await api("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        place_id: placeId,
      }),
    });
    await expectStatus(res, 401);
  });

  test("Remove from favorites without authentication returns 401", async () => {
    const res = await api(`/api/favorites/${placeId}`, {
      method: "DELETE",
    });
    await expectStatus(res, 401);
  });
});
