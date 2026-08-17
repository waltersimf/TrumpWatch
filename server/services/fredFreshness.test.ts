import { afterEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  upsertEconomicMetric: vi.fn(),
  updateApiStatus: vi.fn(),
}));

vi.mock("../db", () => dbMocks);

import { fetchFredData } from "./fredService";

afterEach(() => {
  vi.restoreAllMocks();
  dbMocks.upsertEconomicMetric.mockReset();
  dbMocks.updateApiStatus.mockReset();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("FRED freshness handling", () => {
  it("requests JSON in descending observation order and persists the source date", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () =>
      jsonResponse({ observations: [{ date: "2026-08-01", value: "4.10" }] })
    );

    await fetchFredData();

    expect(fetchMock).toHaveBeenCalledTimes(6);
    for (const [request] of fetchMock.mock.calls) {
      const url = new URL(String(request));
      expect(url.searchParams.get("file_type")).toBe("json");
      expect(url.searchParams.get("sort_order")).toBe("desc");
      expect(url.searchParams.get("limit")).toBe("1");
    }
    expect(dbMocks.upsertEconomicMetric).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-08-01", value: "4.10" })
    );
    expect(dbMocks.updateApiStatus).toHaveBeenCalledWith("FRED", "healthy");
  });

  it("marks FRED degraded when only some indicators refresh", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ observations: [{ date: "2026-08-01", value: "4.10" }] }))
      .mockImplementation(async () => new Response("<error />", { status: 502 }));

    await fetchFredData();

    expect(dbMocks.upsertEconomicMetric).toHaveBeenCalledOnce();
    expect(dbMocks.updateApiStatus).toHaveBeenCalledWith(
      "FRED",
      "degraded",
      expect.stringContaining("1/6 indicators refreshed")
    );
  });

  it("marks FRED failed and does not overwrite cached metrics when every request fails", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async () =>
      new Response("<?xml version=\"1.0\" />", { status: 200 })
    );

    await fetchFredData();

    expect(dbMocks.upsertEconomicMetric).not.toHaveBeenCalled();
    expect(dbMocks.updateApiStatus).toHaveBeenCalledWith(
      "FRED",
      "failed",
      expect.stringContaining("non-JSON")
    );
  });
});
