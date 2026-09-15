import { runAfterPaint } from "./afterPaint";

describe("runAfterPaint", () => {
  let originalRaf;
  let originalCancel;

  beforeEach(() => {
    originalRaf = global.requestAnimationFrame;
    originalCancel = global.cancelAnimationFrame;
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRaf;
    global.cancelAnimationFrame = originalCancel;
  });

  test("invokes after two animation frames", () => {
    const frames = [];
    global.requestAnimationFrame = (cb) => {
      frames.push(cb);
      return frames.length;
    };
    global.cancelAnimationFrame = jest.fn();
    const fn = jest.fn();
    const cancel = runAfterPaint(fn);
    expect(fn).not.toHaveBeenCalled();
    expect(frames).toHaveLength(1);
    frames[0]();
    expect(frames).toHaveLength(2);
    frames[1]();
    expect(fn).toHaveBeenCalledTimes(1);
    cancel();
  });

  test("cancel prevents the callback", () => {
    const frames = [];
    global.requestAnimationFrame = (cb) => {
      frames.push(cb);
      return frames.length;
    };
    global.cancelAnimationFrame = jest.fn();
    const fn = jest.fn();
    const cancel = runAfterPaint(fn);
    cancel();
    frames[0]();
    frames[1]?.();
    expect(fn).not.toHaveBeenCalled();
  });
});
