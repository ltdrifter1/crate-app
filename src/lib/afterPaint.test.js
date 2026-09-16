import { runAfterPaint, runWhenIdle } from "./afterPaint";

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

describe("runWhenIdle", () => {
  let originalIdle;
  let originalCancel;

  beforeEach(() => {
    originalIdle = global.requestIdleCallback;
    originalCancel = global.cancelIdleCallback;
  });

  afterEach(() => {
    global.requestIdleCallback = originalIdle;
    global.cancelIdleCallback = originalCancel;
  });

  test("uses requestIdleCallback when available", () => {
    const fn = jest.fn();
    const idle = jest.fn((cb) => {
      cb();
      return 7;
    });
    global.requestIdleCallback = idle;
    global.cancelIdleCallback = jest.fn();
    runWhenIdle(fn, { timeout: 500 });
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 500 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("cancel prevents the idle callback", () => {
    const fn = jest.fn();
    let stored;
    global.requestIdleCallback = (cb) => {
      stored = cb;
      return 3;
    };
    global.cancelIdleCallback = jest.fn();
    const cancel = runWhenIdle(fn);
    cancel();
    stored();
    expect(fn).not.toHaveBeenCalled();
    expect(global.cancelIdleCallback).toHaveBeenCalledWith(3);
  });
});
