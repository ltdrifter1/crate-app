/**
 * @jest-environment jsdom
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import GuestMemberGate from "./GuestMemberGate";

test("Library guest gate opens Profile", async () => {
  const onSignIn = jest.fn();
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(GuestMemberGate, {
        title: "Your library",
        copy: "Sign in from Profile to keep favorites, playlists, and what you play.",
        cta: "Open Profile",
        onSignIn,
      })
    );
  });
  expect(div.querySelector("[data-testid='guest-member-gate']")).toBeTruthy();
  expect(div.textContent).toMatch(/Your library/);
  expect(div.textContent).toMatch(/Profile/);
  const cta = [...div.querySelectorAll("button")].find((b) => /Open Profile/.test(b.textContent));
  expect(cta).toBeTruthy();
  await act(async () => {
    cta.click();
  });
  expect(onSignIn).toHaveBeenCalledTimes(1);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});

test("gate can preview what the signed-in page holds", async () => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);
  await act(async () => {
    root.render(
      React.createElement(GuestMemberGate, {
        eyebrow: "Your crate · empty",
        title: "Your library",
        perks: [
          { label: "Playlists", body: "Build one for Friday night." },
          { label: "Liked", body: "Heart a track." },
        ],
        onSignIn: () => {},
      })
    );
  });
  expect(div.textContent).toMatch(/Your crate · empty/);
  const items = [...div.querySelectorAll("li")].map((li) => li.textContent);
  expect(items).toHaveLength(2);
  expect(items[0]).toMatch(/Playlists/);
  await act(async () => root.unmount());
  document.body.removeChild(div);
});
