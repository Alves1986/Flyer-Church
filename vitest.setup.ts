import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "EyeDropper", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    open: vi.fn().mockResolvedValue({ sRGBHex: "#BB9E49" }),
  })),
});

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
  fillText: vi.fn(),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  font: "",
  fillStyle: "",
  textAlign: "left",
  textBaseline: "top",
  drawImage: vi.fn(),
  getImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(4),
    width: 1,
    height: 1,
  }),
  toBuffer: vi.fn().mockReturnValue(new Uint8Array()),
  toDataURL: vi.fn().mockReturnValue("data:image/png;base64,"),
});

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

global.fetch = vi.fn();