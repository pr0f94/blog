import React from "react";
import About, { frontmatter as about } from "../content/about.mdx";

export default function AboutPanel({ stats, components }) {
  return (
    <article className="detail-panel" aria-labelledby="about-title">
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
        <div aria-hidden="true" style={{
          width: 64, height: 64, borderRadius: "50%",
          background: about.avatarGradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "22px", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0,
        }}>{about.initials}</div>
        <div>
          <h1 id="about-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "26px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{about.name}</h1>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>{about.role}</div>
        </div>
      </div>

      <div style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.85, marginBottom: "28px" }}>
        <About components={components} />
      </div>

      {stats?.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: "32px" }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "18px", textAlign: "center" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", fontWeight: 700, color: "#fff" }}>{stat.val}</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "4px" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

    </article>
  );
}
