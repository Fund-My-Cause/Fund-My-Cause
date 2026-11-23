import { fetchAllPages, nodesFrom, type Connection } from "./pagination";

function page<T>(
  nodes: T[],
  endCursor: string | null,
  hasNextPage: boolean,
): Connection<T> {
  return {
    edges: nodes.map((node, index) => ({
      cursor: endCursor ? `${endCursor}-${index}` : `${index}`,
      node,
    })),
    pageInfo: {
      hasNextPage,
      hasPreviousPage: false,
      startCursor: nodes.length ? "start" : null,
      endCursor,
    },
  };
}

describe("nodesFrom", () => {
  it("preserves connection node order", () => {
    expect(nodesFrom(page(["first", "second"], "cursor-1", false))).toEqual([
      "first",
      "second",
    ]);
  });

  it("returns an empty array for an empty connection", () => {
    expect(nodesFrom(page([], null, false))).toEqual([]);
  });
});

describe("fetchAllPages", () => {
  it("follows endCursor and combines every page", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(page(["A"], "cursor-1", true))
      .mockResolvedValueOnce(page(["B", "C"], "cursor-2", true))
      .mockResolvedValueOnce(page(["D"], null, false));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual(["A", "B", "C", "D"]);
    expect(fetchPage).toHaveBeenNthCalledWith(1, null);
    expect(fetchPage).toHaveBeenNthCalledWith(2, "cursor-1");
    expect(fetchPage).toHaveBeenNthCalledWith(3, "cursor-2");
  });

  it("stops when the first page has no next page", async () => {
    const fetchPage = jest.fn().mockResolvedValue(page(["only"], null, false));

    await expect(fetchAllPages(fetchPage)).resolves.toEqual(["only"]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("never exceeds the configured page limit", async () => {
    const fetchPage = jest.fn().mockImplementation(async (after: string | null) =>
      page([after ?? "first"], "next", true),
    );

    await expect(fetchAllPages(fetchPage, 3)).resolves.toEqual([
      "first",
      "next",
      "next",
    ]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });
});
