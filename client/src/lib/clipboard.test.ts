import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "./clipboard";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("copyTextToClipboard", () => {
  it("uses the modern Clipboard API and copies the exact quote text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("A verified quote to copy.")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("A verified quote to copy.");
  });

  it("falls back to document.execCommand when the Clipboard API is unavailable", async () => {
    const textarea = {
      value: "",
      setAttribute: vi.fn(),
      select: vi.fn(),
      remove: vi.fn(),
      style: {},
    };
    const execCommand = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    vi.stubGlobal("document", {
      body: {
        appendChild: vi.fn(),
      },
      createElement: vi.fn().mockReturnValue(textarea),
      execCommand,
    });

    await expect(copyTextToClipboard("Fallback quote text.")).resolves.toBe(true);
    expect(textarea.value).toBe("Fallback quote text.");
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(textarea.remove).toHaveBeenCalledOnce();
  });

  it("rejects empty text without touching the clipboard", async () => {
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("   ")).resolves.toBe(false);
    expect(writeText).not.toHaveBeenCalled();
  });
});
