import { http, HttpResponse } from "msw";
import { apiClient, ApiError } from "./api-client";
import { server } from "@/mocks/server";

describe("apiClient", () => {
  const preferencesUrl = "http://localhost/api/preferences";

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  describe("error handling", () => {
    it("throws ApiError on non-ok response", async () => {
      server.use(
        http.get(preferencesUrl, () =>
          HttpResponse.json({ message: "Not found" }, { status: 404 }),
        ),
      );

      await expect(apiClient.get(preferencesUrl)).rejects.toThrow(ApiError);
    });

    it("includes status code in ApiError", async () => {
      server.use(
        http.get(preferencesUrl, () =>
          HttpResponse.json(
            { message: "Internal server error" },
            { status: 500 },
          ),
        ),
      );

      await expect(apiClient.get(preferencesUrl)).rejects.toMatchObject({
        status: 500,
      });
    });

    it("extracts message from error response", async () => {
      server.use(
        http.get(preferencesUrl, () =>
          HttpResponse.json(
            { message: "Resource validation failed" },
            { status: 400 },
          ),
        ),
      );

      await expect(apiClient.get(preferencesUrl)).rejects.toMatchObject({
        message: "Resource validation failed",
      });
    });

    it("handles network errors", async () => {
      server.use(
        http.get(preferencesUrl, () => HttpResponse.error()),
      );

      await expect(apiClient.get(preferencesUrl)).rejects.toMatchObject({
        status: 0,
      });
    });
  });

  describe("GET requests", () => {
    it("returns the documented preferences response", async () => {
      await expect(apiClient.get(preferencesUrl)).resolves.toEqual({
        notifications: true,
        theme: "system",
      });
    });
  });

  describe("POST requests", () => {
    it("returns the documented successful update response", async () => {
      await expect(
        apiClient.post(preferencesUrl, { theme: "dark" }),
      ).resolves.toEqual({ success: true });
    });
  });

  describe("request options", () => {
    it("sends the configured authorization header", async () => {
      let authorization: string | null = null;
      server.use(
        http.get(preferencesUrl, ({ request }) => {
          authorization = request.headers.get("authorization");
          return HttpResponse.json({ ok: true });
        }),
      );

      await apiClient.get(preferencesUrl, {
        authHeader: "Bearer test-token",
      });

      expect(authorization).toBe("Bearer test-token");
    });
  });
});
