import { installButtonFeedback } from "./feedback";

test("button press fires a light haptic tick, disabled buttons do not", () => {
  const vibrate = jest.fn();
  Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
  window.matchMedia = window.matchMedia || (() => ({ matches: false }));
  const off = installButtonFeedback(document);
  const b = document.createElement("button");
  const d = document.createElement("button");
  d.disabled = true;
  document.body.append(b, d);
  b.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  d.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  expect(vibrate).toHaveBeenCalledTimes(1);
  off();
});
