import React from "react";
import About, { frontmatter as about } from "../content/about.mdx";
import "./AboutPanel.css";

const CAREER_STAGES = [
  { title: "Software engineering", description: "A development background that shapes how I approach code, architecture, and the teams building them." },
  { title: "Offensive security", description: "Going beyond finding vulnerabilities to understand exploitability, security boundaries, and the controls that stop an attack." },
  { title: "Application security", description: "Secure code review, threat modelling, and security tooling across the software development lifecycle, with experience at FAANG and other tech companies." },
  { title: "Research & AI security", description: "Independent vulnerability research, responsible disclosure, and exploring how AI can support security engineering." },
];

export default function AboutPanel({ components }) {
  return (
    <article className="detail-panel about-panel" aria-labelledby="about-title">
      <div className="about-header">
        <img
          className="about-portrait"
          src="images/about-portrait-480.jpg"
          srcSet="images/about-portrait-480.jpg 480w, images/about-portrait-960.jpg 960w"
          sizes="(max-width: 480px) calc(100vw - 36px), (max-width: 768px) 136px, 176px"
          width="1412"
          height="1114"
          loading="eager"
          decoding="sync"
          fetchpriority="high"
          alt={`Illustrated portrait of ${about.name} in a workspace`}
        />
        <div>
          <h1 id="about-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "26px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>{about.name}</h1>
          <div style={{ fontSize: "13px", color: "rgba(var(--text-rgb),0.6)", fontFamily: "'JetBrains Mono', monospace" }}>{about.role}</div>
          <a className="about-book-link" href="#/consulting">Book a 1:1 session →</a>
        </div>
      </div>

      <div className="about-bio" style={{ fontSize: "15px", color: "rgba(var(--text-rgb),0.75)", lineHeight: 1.85, marginBottom: "28px" }}>
        <About components={components} />
      </div>

      <section className="about-section about-career-section" aria-labelledby="about-career">
        <h2 id="about-career">How my work evolved</h2>
        <ol className="about-timeline">
          {CAREER_STAGES.map((stage, index) => (
            <li key={stage.title}>
              <span className="about-timeline-step" aria-hidden="true">0{index + 1}</span>
              <div><h3>{stage.title}</h3><p>{stage.description}</p></div>
            </li>
          ))}
        </ol>
        <a className="about-text-link" href={about.socials.linkedin} target="_blank" rel="noopener noreferrer">Full experience on LinkedIn ↗</a>
      </section>

    </article>
  );
}
