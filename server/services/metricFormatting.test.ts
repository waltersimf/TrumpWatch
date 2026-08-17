import { describe, expect, it } from "vitest";
import { formatMetricValue } from "../../shared/metricFormatting";

describe("formatMetricValue", () => {
  it("formats numeric metric values consistently", () => {
    expect(formatMetricValue("4.2")).toBe("4.20");
    expect(formatMetricValue("28456.7")).toBe("28456.70");
  });

  it("preserves non-numeric values instead of rendering NaN", () => {
    expect(formatMetricValue("N/A")).toBe("N/A");
    expect(formatMetricValue("")).toBe("");
  });
});
