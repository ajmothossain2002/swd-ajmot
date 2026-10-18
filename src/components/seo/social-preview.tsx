export function SocialPreview() {
  return (
    <div
      style={{
        background: "#101010",
        color: "#f4f2ed",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        padding: "72px 82px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          background: "#ff5a35",
          height: "100%",
          left: 0,
          position: "absolute",
          top: 0,
          width: 12,
        }}
      />
      <div style={{ color: "#c0bbb4", display: "flex", fontSize: 22, letterSpacing: 5, textTransform: "uppercase" }}>
        Portfolio · Web development
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <div style={{ color: "#ff5a35", display: "flex", fontSize: 25, letterSpacing: 2 }}>Ajmot Hossain</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 600, letterSpacing: -3, lineHeight: 1.05, maxWidth: 950 }}>
          Full-Stack Developer
        </div>
        <div style={{ color: "#c0bbb4", display: "flex", fontSize: 30, marginTop: 10 }}>
          Business websites · Applications · APIs
        </div>
      </div>
      <div style={{ alignItems: "center", color: "#f4f2ed", display: "flex", fontSize: 23, justifyContent: "space-between" }}>
        <span style={{ display: "flex" }}>Building business-critical web applications</span>
        <span style={{ color: "#ff5a35", display: "flex" }}>Portfolio · Web development</span>
      </div>
    </div>
  );
}
