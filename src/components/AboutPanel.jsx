import React from "react";
import About, { frontmatter as about } from "../content/about.mdx";
import "./AboutPanel.css";

const CAREER_STAGES = [
  { title: "Software engineering", description: "A development background that shapes how I approach code, architecture, and the teams building them." },
  { title: "Application security", description: "Secure code review, threat modelling, and security tooling across the software development lifecycle, with experience at FAANG and other tech companies." },
  { title: "Research & AI security", description: "Independent vulnerability research, responsible disclosure, and exploring how AI can support security engineering." },
];

export default function AboutPanel({ components }) {
  return (
    <article className="detail-panel about-panel" aria-labelledby="about-title">
      <div className="about-header">
        <img
          className="about-portrait"
          src="images/about-portrait.png"
          alt={`Illustrated portrait of ${about.name} in a workspace`}
        />
        <div>
          <h1 id="about-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "26px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{about.name}</h1>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>{about.role}</div>
        </div>
      </div>

      <div className="about-bio" style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.85, marginBottom: "28px" }}>
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

      <section className="about-mentoring" aria-labelledby="about-mentoring">
        <span className="about-eyebrow">1:1 guidance</span>
        <h2 id="about-mentoring">Work out your next step</h2>
        <p>Moving into AppSec, choosing a certification, or preparing for security interviews? We can talk through your goals and build a practical plan.</p>
        <div className="about-mentoring-links">
          <a className="about-book-link" href="https://topmate.io/deva_parekh" target="_blank" rel="noopener noreferrer">Book a session on Topmate ↗</a>
          <a className="about-text-link" href="#/consulting">Explore the sessions →</a>
        </div>
      </section>

    </article>
  );
}
