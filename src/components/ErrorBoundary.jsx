import React from "react";
import { font, fontDisplay, color, radius, glass, BTN_PRIMARY, aluminumGradient } from "../theme";

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
          background: aluminumGradient(),
          color: color.ink,
          fontFamily: font,
        }}
      >
        <div
          style={{
            width: "min(100%, 380px)",
            padding: "28px 24px",
            borderRadius: 24,
            background: `
              linear-gradient(165deg, rgba(42,47,55,0.85) 0%, rgba(28,32,38,0.55) 100%)
            `,
            border: `1px solid rgba(255,255,255,0.14)`,
            boxShadow: `inset 0 1px 0 ${glass.highlight}, ${glass.shadowLift}`,
            backdropFilter: glass.blurHeavy,
            WebkitBackdropFilter: glass.blurHeavy,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: color.faint,
              fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
              marginBottom: 10,
            }}
          >
            Something went wrong
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 750,
            letterSpacing: -0.5,
            fontFamily: fontDisplay,
            marginBottom: 8,
          }}>
            Booth hit a snag
          </div>
          <div
            style={{
              fontSize: 15,
              color: color.muted,
              lineHeight: 1.5,
              marginBottom: 8,
            }}
          >
            Reload and dig again. If it sticks, sign out and back in.
          </div>
          {this.state.message ? (
            <div
              style={{
                fontSize: 12,
                color: color.faint,
                lineHeight: 1.45,
                wordBreak: "break-word",
                fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                marginBottom: 16,
                padding: "10px 12px",
                borderRadius: radius.md,
                background: "rgba(28,32,38,0.55)",
                border: `1px solid ${glass.borderSoft}`,
              }}
            >
              {this.state.message}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              ...BTN_PRIMARY,
              marginTop: 4,
              borderRadius: radius.lg,
            }}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
