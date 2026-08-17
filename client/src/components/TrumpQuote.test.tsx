// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TrumpQuote } from "./TrumpQuote";

const createQuote = (quoteText: string) => ({
  id: 1,
  quoteText,
  source: "What Does Trump Think API",
  date: null,
  externalId: `wdtt-${quoteText.length}`,
  createdAt: new Date(),
});

describe("TrumpQuote UI", () => {
  it("displays the exact quote returned after the refresh action", () => {
    const firstQuote = createQuote("The first verified quote.");
    const refreshedQuote = createQuote("The exact refreshed verified quote.");
    const onRefresh = vi.fn();
    const view = render(
      <TrumpQuote quote={firstQuote} isLoading={false} onRefresh={onRefresh} />
    );

    expect(screen.getByText(/The first verified quote/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /New Quote/i }));
    expect(onRefresh).toHaveBeenCalledOnce();

    view.rerender(
      <TrumpQuote quote={refreshedQuote} isLoading={false} onRefresh={onRefresh} />
    );

    expect(screen.getByText(/The exact refreshed verified quote/)).toBeDefined();
  });

  it("shows the truthful unavailable state when refresh returns no verified quote", () => {
    render(<TrumpQuote quote={null} isLoading={false} onRefresh={vi.fn()} />);

    expect(screen.getByText("Verified quote unavailable")).toBeDefined();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeDefined();
  });
});
