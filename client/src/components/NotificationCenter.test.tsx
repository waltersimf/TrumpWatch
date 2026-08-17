// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NotificationCenter } from "./NotificationCenter";

afterEach(() => cleanup());

describe("NotificationCenter UI", () => {
  it("renders active API failure alerts when services are degraded or failed", () => {
    render(
      <NotificationCenter
        notifications={[]}
        apiStatus={{
          fred: { status: "failed", errorMessage: "XML parsing error" },
          newsApi: { status: "healthy" },
          quotesApi: { status: "healthy" },
          dataGov: { status: "healthy" },
        }}
      />
    );

    expect(screen.getByText(/fred service alert/i)).toBeDefined();
    expect(screen.getByText(/XML parsing error/)).toBeDefined();
  });
});
