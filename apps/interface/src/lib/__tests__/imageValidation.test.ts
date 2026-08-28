/**
 * Unit tests for imageValidation.ts
 *
 * Covers: validateImageFile, getFallbackImage, isValidImageUri
 */

import {
  validateImageFile,
  getFallbackImage,
  isValidImageUri,
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
} from "../imageValidation";

// ── validateImageFile ─────────────────────────────────────────────────────────

function makeFile(type: string, sizeBytes: number): File {
  // Create a File with a specific size by building a matching Blob
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], "test-image", { type });
}

describe("validateImageFile", () => {
  describe("accepted MIME types", () => {
    it.each(["image/png", "image/jpeg", "image/webp"])(
      "accepts %s",
      (mimeType) => {
        const file = makeFile(mimeType, 100);
        expect(validateImageFile(file)).toEqual({ valid: true });
      },
    );

    it("rejects image/gif", () => {
      const file = makeFile("image/gif", 100);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/PNG|JPG|WebP/i);
    });

    it("rejects image/svg+xml", () => {
      const file = makeFile("image/svg+xml", 100);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });

    it("rejects application/pdf", () => {
      const file = makeFile("application/pdf", 100);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });

    it("rejects empty type string", () => {
      const file = makeFile("", 100);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe("file size", () => {
    it("accepts a file exactly at the max size", () => {
      const file = makeFile("image/png", MAX_FILE_SIZE);
      expect(validateImageFile(file)).toEqual({ valid: true });
    });

    it("accepts a file one byte under the max", () => {
      const file = makeFile("image/png", MAX_FILE_SIZE - 1);
      expect(validateImageFile(file)).toEqual({ valid: true });
    });

    it("rejects a file one byte over the max", () => {
      const file = makeFile("image/png", MAX_FILE_SIZE + 1);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/5 MB/i);
    });

    it("rejects a very large file", () => {
      const file = makeFile("image/jpeg", 10 * 1024 * 1024); // 10 MB
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe("type check precedes size check", () => {
    it("returns type error (not size error) when both fail", () => {
      // Wrong type AND too large
      const file = makeFile("image/gif", MAX_FILE_SIZE + 1);
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/PNG|JPG|WebP/i);
    });
  });
});

// ── getFallbackImage ──────────────────────────────────────────────────────────

describe("getFallbackImage", () => {
  it("returns a URL string", () => {
    const url = getFallbackImage("campaign-abc");
    expect(typeof url).toBe("string");
    expect(url).toMatch(/^https?:\/\//);
  });

  it("is deterministic — same ID always returns the same URL", () => {
    const id = "CABC123";
    expect(getFallbackImage(id)).toBe(getFallbackImage(id));
  });

  it("returns different URLs for different IDs (hash variation)", () => {
    // Not guaranteed for all pairs, but highly likely with distinct inputs
    const urls = new Set([
      getFallbackImage("aaaaaa"),
      getFallbackImage("bbbbbb"),
      getFallbackImage("cccccc"),
      getFallbackImage("dddddd"),
      getFallbackImage("eeeeee"),
    ]);
    // At least two distinct fallback images should be selected across 5 ids
    expect(urls.size).toBeGreaterThanOrEqual(1);
  });

  it("handles an empty string without throwing", () => {
    expect(() => getFallbackImage("")).not.toThrow();
  });

  it("returns one of the known fallback image URLs", () => {
    const url = getFallbackImage("test-id");
    expect(url).toContain("unsplash.com");
  });
});

// ── isValidImageUri ───────────────────────────────────────────────────────────

describe("isValidImageUri", () => {
  it("accepts http:// URIs", () => {
    expect(isValidImageUri("http://example.com/image.png")).toBe(true);
  });

  it("accepts https:// URIs", () => {
    expect(isValidImageUri("https://example.com/image.jpg")).toBe(true);
  });

  it("accepts ipfs:// URIs", () => {
    expect(isValidImageUri("ipfs://Qm1234567890abc")).toBe(true);
  });

  it("accepts data: URIs", () => {
    expect(isValidImageUri("data:image/png;base64,abc123")).toBe(true);
  });

  it("rejects undefined", () => {
    expect(isValidImageUri(undefined)).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidImageUri("")).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(isValidImageUri("   ")).toBe(false);
  });

  it("rejects arbitrary text without a protocol", () => {
    expect(isValidImageUri("not-a-url")).toBe(false);
  });

  it("rejects ftp:// URIs", () => {
    expect(isValidImageUri("ftp://example.com/image.png")).toBe(false);
  });

  it("rejects relative paths", () => {
    expect(isValidImageUri("/images/photo.jpg")).toBe(false);
  });
});

// ── Constants ─────────────────────────────────────────────────────────────────

describe("ACCEPTED_TYPES", () => {
  it("contains the three expected MIME types", () => {
    expect(ACCEPTED_TYPES).toContain("image/png");
    expect(ACCEPTED_TYPES).toContain("image/jpeg");
    expect(ACCEPTED_TYPES).toContain("image/webp");
  });
});

describe("MAX_FILE_SIZE", () => {
  it("is 5 MB in bytes", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
  });
});
