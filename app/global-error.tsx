"use client";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#fafafa", color: "#18181b", fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <main style={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Application error</h1>
            <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24 }}>
              {error.message || "Please refresh the page."}
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "#ff2e7e",
                border: "none",
                borderRadius: 12,
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: 600,
                padding: "10px 16px"
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
