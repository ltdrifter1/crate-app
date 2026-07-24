import React from "react";
import { font, color, radius } from "../theme";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ROOMS crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 32,
          textAlign: "center",
          background: color.canvas,
          color: color.ink,
          fontFamily: font,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: color.faint,
          }}
        >
          ROOMS
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>
          Something skipped.
        </div>
        <div
          style={{
            fontSize: 14,
            color: color.muted,
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          The app hit an unexpected error. Reload to continue listening.
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: "12px 24px",
            borderRadius: radius.md,
            border: "none",
            background: color.accent,
            color: color.onAccent,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: font,
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
