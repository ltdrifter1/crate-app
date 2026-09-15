/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import TasteTuner from "./TasteTuner";

describe("TasteTuner", () => {
  let div;
  let root;

  beforeEach(() => {
    div = document.createElement("div");
    document.body.appendChild(div);
    root = createRoot(div);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.removeChild(div);
  });

  test("tunes a station then starts the mix with compiled taste", async () => {
    const onComplete = jest.fn();
    await act(async () => {
      root.render(React.createElement(TasteTuner, { tracks: [], onComplete }));
    });
    expect(div.textContent).toMatch(/Tune the stations that sound like you/);
    expect(div.textContent).toMatch(/Metal/);
    expect(div.textContent).not.toMatch(/Select your favourite genres/);
    expect(div.textContent).not.toMatch(/Enter the club/);

    const metal = div.querySelector('button[aria-label="Tune Metal"]');
    expect(metal).toBeTruthy();
    await act(async () => {
      metal.click();
    });
    const cont = [...div.querySelectorAll("button")].find((b) =>
      /Continue with 1 station/.test(b.textContent)
    );
    expect(cont).toBeTruthy();
    await act(async () => {
      cont.click();
    });
    // No artist faces in empty catalog → energy dial
    expect(div.textContent).toMatch(/How should the mix feel/);
    const peak = [...div.querySelectorAll("button")].find((b) => b.textContent.includes("Peak floor"));
    const close = [...div.querySelectorAll("button")].find((b) => b.textContent.includes("Stick close"));
    await act(async () => {
      peak.click();
      close.click();
    });
    const lock = [...div.querySelectorAll("button")].find((b) => b.textContent === "Lock it in");
    await act(async () => {
      lock.click();
    });
    expect(div.textContent).toMatch(/Your mix is locked/);
    expect(div.textContent).toMatch(/Metal/);
    const start = [...div.querySelectorAll("button")].find((b) => b.textContent === "Start the mix");
    await act(async () => {
      start.click();
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    const bag = onComplete.mock.calls[0][0];
    expect(bag.seedChannelId).toBe("metal");
    expect(bag.genres).toContain("Metal");
    expect(bag.energyBand).toBe("peak");
    expect(bag.adventurous).toBe(22);
  });

  test("wander first still seeds Variety Mix", async () => {
    const onComplete = jest.fn();
    await act(async () => {
      root.render(React.createElement(TasteTuner, { tracks: [], onComplete }));
    });
    const wander = [...div.querySelectorAll("button")].find((b) => b.textContent === "Wander first");
    await act(async () => {
      wander.click();
    });
    expect(onComplete.mock.calls[0][0].seedChannelId).toBe("variety-mix");
  });
});
