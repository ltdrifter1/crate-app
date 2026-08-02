import React from "react";
import { font, color, radius } from "../theme";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || String(error || "Unknown error"),
    };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100dvh",
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
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0.2,
            color: color.faint,
          }}
        >
          Something went wrong
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.4 }}>
          Couldn’t load the app
        </div>
        <div
          style={{
            fontSize: 15,
            color: color.muted,
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          Reload to try again. If this keeps happening, sign out and back in.
        </div>
        {this.state.message ? (
          <div
            style={{
              fontSize: 12,
              color: color.faint,
              maxWidth: 340,
              lineHeight: 1.45,
              wordBreak: "break-word",
              fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
            }}
          >
            {this.state.message}
          </div>
        ) : null}
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
            fontSize: 16,
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
