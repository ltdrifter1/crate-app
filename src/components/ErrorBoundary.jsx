import React from "react";

// Catches render/runtime errors anywhere in the tree and shows a calm,
// on-brand recovery screen instead of a blank white page.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep a breadcrumb in the console; hook up real reporting here later.
    console.error("Crate crashed:", error, info);
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
          background: "radial-gradient(ellipse at 50% 40%, #12172A 0%, #0A0F1E 100%)",
          color: "#FFFFFF",
          fontFamily:
            "-apple-system,'SF Pro Display','SF Pro Text','Helvetica Neue',Arial,sans-serif",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.5 }}>
          Crate
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3 }}>
          Something skipped.
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", maxWidth: 320, lineHeight: 1.5 }}>
          The app hit an unexpected error. Reload to pick the needle back up.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: "12px 24px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reload
        </button>
      </div>
    );
  }
}
