import { describe, test, expect } from "bun:test";
import { api, authenticatedApi, signUpTestUser, expectStatus, connectWebSocket, connectAuthenticatedWebSocket, waitForMessage } from "./helpers";

describe("API Integration Tests", () => {
  let placeId: string;

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

  test("Create review with rating out of range returns 400", async () => {
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
});
