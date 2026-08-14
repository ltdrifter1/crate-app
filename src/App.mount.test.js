/**
 * @jest-environment jsdom
 *
 * Regression: keyboard shortcut keyCtxRef used `toggleLike` before its const
 * declaration, crashing the app with TDZ ("Cannot access 'Sn' before
 * initialization" in production).
 */
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

jest.mock("./firebase", () => ({
  auth: { currentUser: null },
  db: {},
}));

jest.mock("./useAuth", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    firebaseUser: null,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    loginWithGoogle: jest.fn(),
    loginWithApple: jest.fn(),
    loginWithPhone: jest.fn(),
    resetPassword: jest.fn(),
  }),
}));

jest.mock("./useUserData", () => ({
  toggleLike: jest.fn(),
  recordPlay: jest.fn(),
  completeOnboarding: jest.fn(),
  saveGenres: jest.fn(),
  saveTasteProfile: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(async () => ({ docs: [] })),
  addDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  onSnapshot: jest.fn(() => () => {}),
  getDoc: jest.fn(async () => ({ exists: () => false })),
  serverTimestamp: jest.fn(),
  increment: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
}));

test("App mounts without TDZ (toggleLike / keyboard shortcuts)", async () => {
  let App;
  await act(async () => {
    App = (await import("./App.jsx")).default;
  });
  const div = document.createElement("div");
  document.body.appendChild(div);
  const root = createRoot(div);

  await act(async () => {
    root.render(
      React.createElement(
        ErrorBoundary,
        null,
        React.createElement(BrowserRouter, null, React.createElement(App))
      )
    );
  });

  await act(async () => {
    await new Promise((r) => setTimeout(r, 50));
  });

  const text = div.textContent || "";
  expect(text).not.toMatch(/before initialization/i);
  expect(text).not.toMatch(/Booth hit a snag/);
  // Logged-out users should see the login door, not a crash screen.
  expect(text.length).toBeGreaterThan(0);
});
