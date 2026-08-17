import { describe, it, expect } from "vitest";
import { formatMetricValue } from "../../shared/metricFormatting";

describe("Economic Metrics Layout & Formatting Resilience", () => {
  it("formats long economic metric values cleanly to fit card containers", () => {
    expect(formatMetricValue("28456.70")).toBe("28456.70");
    expect(formatMetricValue("314.50")).toBe("314.50");
    expect(formatMetricValue("4.20")).toBe("4.20");
  });

  it("handles empty or missing metric strings safely", () => {
    expect(formatMetricValue("")).toBe("");
  });
});
