/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { TrackRow, TrackActionsMenu } from "./TrackRow";

test("list rows print BPM and Camelot", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(TrackRow, {
        track: {
          id: "t1",
          title: "Night Drive",
          artist: "Signal",
          bpm: 124,
          camelot: "8A",
          energy: 6,
        },
        onPlay: () => {},
      })
    );
  });
  expect(div.textContent).toMatch(/Night Drive/);
  expect(div.textContent).toMatch(/124 BPM/);
  expect(div.textContent).toMatch(/8A/);
  expect(div.textContent).not.toMatch(/E6/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

describe("track menu — Request it", () => {
  const track = { id: "t9", title: "Warehouse", artist: "Gridlock", requestCount: 12 };

  async function openMenu(ctx) {
    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);
    const onClose = jest.fn();
    await act(async () => {
      root.render(
        React.createElement(TrackActionsMenu, { track, playlistCtx: ctx, x: 10, y: 10, onClose })
      );
    });
    return {
      onClose,
      cleanup: async () => {
        await act(async () => root.unmount());
        document.body.removeChild(div);
      },
    };
  }
  const item = () => [...document.querySelectorAll("[role='menuitem']")].find((b) => /Request/.test(b.textContent));
  const base = { playlists: [], onCreate() {}, onAdd() {}, onRemove() {}, onToast() {} };

  test("is absent when the surface cannot request", async () => {
    const m = await openMenu(base);
    expect(item()).toBeUndefined();
    await m.cleanup();
  });

  test("requests the track by id and shows how many requests it already has", async () => {
    const onRequest = jest.fn();
    const m = await openMenu({ ...base, onRequest, hasRequested: () => false });
    expect(item().textContent).toMatch(/Request it/);
    expect(item().textContent).toMatch(/12 REQUESTS/);
    await act(async () => item().click());
    expect(onRequest).toHaveBeenCalledWith("t9");
    expect(m.onClose).toHaveBeenCalled();
    await m.cleanup();
  });

  test("says so once today's request is spent", async () => {
    const m = await openMenu({ ...base, onRequest: jest.fn(), hasRequested: () => true });
    expect(item().textContent).toMatch(/Requested ✓/);
    await m.cleanup();
  });
});
