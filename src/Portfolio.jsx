import { useState, useEffect, useCallback } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import php from "highlight.js/lib/languages/php";
import json from "highlight.js/lib/languages/json";
import go from "highlight.js/lib/languages/go";
import "highlight.js/styles/github-dark.css";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("php", php);
hljs.registerLanguage("json", json);
hljs.registerLanguage("go", go);

const HLJS_LANGS = new Set(["bash", "sh", "shell", "python", "py", "php", "json", "go"]);

// ─── CONTENT LOADERS ──────────────────────────────────────────────────────────
// Add a new CVE/post/tool by dropping an MDX file in the matching directory.
// Filename (minus .mdx) becomes the id and the URL slug.
const idFromPath = (p) => p.split("/").pop().replace(/\.mdx$/, "");

const cveModules  = import.meta.glob("./content/cves/*.mdx",  { eager: true });
const postModules = import.meta.glob("./content/posts/*.mdx", { eager: true });
const toolModules = import.meta.glob("./content/tools/*.mdx", { eager: true });

const CVES = Object.entries(cveModules)
  .map(([path, mod]) => ({ id: idFromPath(path), Content: mod.default, ...mod.frontmatter }))
  .sort((a, b) => (b.year - a.year) || a.id.localeCompare(b.id));

const POSTS = Object.entries(postModules)
  .map(([path, mod]) => ({ id: idFromPath(path), Content: mod.default, ...mod.frontmatter }));

const TOOLS = Object.entries(toolModules)
  .map(([path, mod]) => ({ id: idFromPath(path), ...mod.frontmatter }))
  .sort((a, b) => b.stars - a.stars);


// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const SEV_META = {
  CRITICAL: { bg: "rgba(229,72,77,0.12)",  text: "#ff8a8e" },
  HIGH:     { bg: "rgba(247,107,21,0.12)", text: "#ffa466" },
  MEDIUM:   { bg: "rgba(255,197,61,0.12)", text: "#ffd874" },
  LOW:      { bg: "rgba(70,167,88,0.12)",  text: "#7ad08c" },
};

const SOCIAL = {
  email:     "alex@0xreeves.com",
  github:    "https://github.com/0xreeves",
  hackerone: "https://hackerone.com/0xreeves",
  twitter:   "https://twitter.com/0xreeves",
};

// ─── ATOMS ───────────────────────────────────────────────────────────────────

const Badge = ({ label, sev }) => {
  const m = SEV_META[sev] || { bg: "#444", text: "#fff" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "4px",
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em",
      background: m.bg, color: m.text, textTransform: "uppercase",
    }}>{label}</span>
  );
};

const Tag = ({ label }) => (
  <span style={{
    display: "inline-block", padding: "2px 8px", borderRadius: "4px",
    fontSize: "11px", fontWeight: 600, background: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)",
  }}>{label}</span>
);

// Code block with syntax highlighting + copy-to-clipboard
function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const normalized = (lang || "").toLowerCase();
  let highlightedHTML = null;
  if (HLJS_LANGS.has(normalized)) {
    try { highlightedHTML = hljs.highlight(code, { language: normalized, ignoreIllegals: true }).value; }
    catch { highlightedHTML = null; }
  }

  return (
    <div style={{
      background: "#0d0d0d", borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.08)",
      padding: "14px 16px", margin: "18px 0", overflowX: "auto",
      position: "relative",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "12px" }}>
        <span style={{
          fontSize: "11px", color: "rgba(255,255,255,0.45)",
          letterSpacing: "0.05em", textTransform: "uppercase",
        }}>{lang || "code"}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Code copied" : "Copy code to clipboard"}
          className="copy-btn"
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: copied ? "#a8ff78" : "rgba(255,255,255,0.6)",
            fontSize: "11px", padding: "3px 10px", borderRadius: "4px",
            cursor: "pointer", fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.04em",
          }}
        >{copied ? "✓ Copied" : "Copy"}</button>
      </div>
      <pre style={{
        margin: 0, fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
        fontSize: "12.5px", lineHeight: 1.7, whiteSpace: "pre-wrap",
      }}>
        {highlightedHTML
          ? <code className="hljs" dangerouslySetInnerHTML={{ __html: highlightedHTML }} />
          : <code style={{ color: "#a8ff78" }}>{code}</code>}
      </pre>
    </div>
  );
}


// ─── MDX RENDERING ───────────────────────────────────────────────────────────
// Maps MDX-produced HTML elements to our styled React equivalents.
// Fenced code blocks (```lang ... ```) come through as <pre><code class="language-X">.
const mdxComponents = {
  pre: ({ children }) => {
    const codeEl = children?.props ? children : null;
    const className = codeEl?.props?.className || "";
    const raw = codeEl?.props?.children ?? "";
    const code = typeof raw === "string" ? raw.replace(/\n$/, "") : String(raw);
    const match = /language-([\w-]+)/.exec(className);
    const lang = match ? match[1] : "";
    return <CodeBlock lang={lang} code={code} />;
  },
  code: (props) => (
    <code style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
      background: "rgba(255,255,255,0.08)", padding: "1px 6px",
      borderRadius: "3px", color: "#a8ff78",
    }} {...props} />
  ),
  h2: ({ id, children }) => (
    <h2 id={id} className="md-h2" style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: "21px", fontWeight: 700,
      color: "#fff", margin: "36px 0 8px", letterSpacing: "-0.01em",
      lineHeight: 1.25, scrollMarginTop: "72px",
    }}>{children}</h2>
  ),
  h3: ({ id, children }) => (
    <h3 id={id} style={{
      fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.9)",
      margin: "14px 0 6px", textTransform: "uppercase", letterSpacing: "0.06em",
    }}>{children}</h3>
  ),
  p: (props) => (
    <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "14.5px", lineHeight: 1.85, margin: "8px 0" }} {...props} />
  ),
  ul: (props) => <ul style={{ margin: "8px 0", paddingLeft: "22px" }} {...props} />,
  ol: (props) => <ol style={{ margin: "8px 0", paddingLeft: "22px" }} {...props} />,
  li: (props) => (
    <li style={{ color: "rgba(255,255,255,0.72)", fontSize: "14.5px", lineHeight: 1.85, marginBottom: "2px" }} {...props} />
  ),
  strong: (props) => <strong style={{ color: "rgba(255,255,255,0.92)" }} {...props} />,
  em: (props) => <em style={{ color: "rgba(255,255,255,0.85)" }} {...props} />,
  a: (props) => (
    <a target="_blank" rel="noopener noreferrer"
       style={{ color: "#7dcef5", textDecoration: "underline", textUnderlineOffset: "2px" }} {...props} />
  ),
  img: (props) => (
    <img style={{ maxWidth: "100%", height: "auto", display: "block", margin: "18px 0", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)" }} {...props} />
  ),
  hr: () => null,
  table: (props) => (
    <div style={{ overflowX: "auto", margin: "18px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }} {...props} />
    </div>
  ),
  th: (props) => (
    <th scope="col" style={{
      padding: "8px 12px", background: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.88)", fontWeight: 700, textAlign: "left",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
    }} {...props} />
  ),
  td: (props) => (
    <td style={{
      padding: "8px 12px", color: "rgba(255,255,255,0.72)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }} {...props} />
  ),
  blockquote: (props) => (
    <blockquote style={{
      borderLeft: "3px solid rgba(255,255,255,0.15)", paddingLeft: "16px",
      margin: "12px 0", color: "rgba(255,255,255,0.7)", fontStyle: "italic",
    }} {...props} />
  ),
};

const MdxBody = ({ Content }) =>
  Content ? <Content components={mdxComponents} /> : null;

// ─── DETAIL PANELS ───────────────────────────────────────────────────────────

const CVEDetail = ({ cve }) => (
  <article className="detail-panel" aria-labelledby="cve-title">
    <header style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
        <Badge label={cve.severity} sev={cve.severity} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>CVSS {cve.cvss}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{cve.type}</span>
      </div>
      <h1 id="cve-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: "6px", wordBreak: "break-word" }}>
        {cve.id}
      </h1>
      <div style={{ fontSize: "16px", fontWeight: 600, color: "rgba(255,255,255,0.78)", marginBottom: "16px" }}>
        {cve.product} <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "13px" }}>v{cve.version}</span>
      </div>
      <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.72)", lineHeight: 1.75, borderLeft: "3px solid rgba(255,255,255,0.15)", paddingLeft: "16px" }}>
        {cve.summary}
      </p>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "16px" }}>
        {cve.tags.map(t => <Tag key={t} label={t} />)}
      </div>
    </header>
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "4px" }}>
      <MdxBody Content={cve.Content} />
    </div>
  </article>
);

const PostDetail = ({ post }) => (
  <article className="detail-panel" aria-labelledby="post-title">
    <header style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        <span style={{
          padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 700,
          background: post.tag === "Methodology" ? "rgba(0,201,167,0.10)"
                    : post.tag === "Writeup"     ? "rgba(129,140,248,0.10)"
                                                 : "rgba(56,189,248,0.10)",
          color:      post.tag === "Methodology" ? "#7be0c8"
                    : post.tag === "Writeup"     ? "#a5adf3"
                                                 : "#7dcef5",
          letterSpacing: "0.04em",
        }}>{post.tag}</span>
        <time style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{post.date}</time>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>· {post.readTime} read</span>
      </div>
      <h1 id="post-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.02em", marginBottom: "16px" }}>
        {post.title}
      </h1>
      <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.72)", lineHeight: 1.75, borderLeft: "3px solid rgba(255,255,255,0.12)", paddingLeft: "16px" }}>
        {post.summary}
      </p>
    </header>
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "4px" }}>
      <MdxBody Content={post.Content} />
    </div>
  </article>
);

const ToolDetail = ({ tool }) => (
  <article className="detail-panel" aria-labelledby="tool-title">
    <header style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
        <span style={{
          padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 700,
          background: tool.lang === "Python" ? "rgba(56,189,248,0.10)" : "rgba(0,201,167,0.10)",
          color:      tool.lang === "Python" ? "#7dcef5"               : "#7be0c8",
          letterSpacing: "0.04em",
        }}>{tool.lang}</span>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", fontFamily: "'JetBrains Mono', monospace" }}>v{tool.version}</span>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }} aria-label={`${tool.stars} stars`}>★ {tool.stars}</span>
      </div>
      <h1 id="tool-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "28px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.25, marginBottom: "8px", wordBreak: "break-word" }}>
        ~/{tool.name}
      </h1>
      <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.72)", lineHeight: 1.75, marginBottom: "16px" }}>{tool.desc}</p>

      {(tool.links?.github || tool.links?.pypi) && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {tool.links.github && (
            <a href={tool.links.github} target="_blank" rel="noopener noreferrer" className="ext-link"
               style={{
                 fontSize: "12px", color: "rgba(255,255,255,0.78)", textDecoration: "none",
                 padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)",
                 fontFamily: "'JetBrains Mono', monospace",
               }}>GitHub ↗</a>
          )}
          {tool.links.pypi && (
            <a href={tool.links.pypi} target="_blank" rel="noopener noreferrer" className="ext-link"
               style={{
                 fontSize: "12px", color: "rgba(255,255,255,0.78)", textDecoration: "none",
                 padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.12)",
                 fontFamily: "'JetBrains Mono', monospace",
               }}>PyPI ↗</a>
          )}
        </div>
      )}
    </header>

    <CodeBlock lang="install" code={tool.install} />
    <CodeBlock lang="usage"   code={tool.usage} />

    <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "21px", fontWeight: 700, color: "#fff", margin: "36px 0 8px", letterSpacing: "-0.01em", lineHeight: 1.25 }}>Features</h2>
    <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
      {tool.features.map((f, i) => (
        <li key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "14px", color: "rgba(255,255,255,0.72)" }}>
          <span aria-hidden="true" style={{ color: "#a8ff78", fontSize: "12px", marginTop: "2px" }}>✓</span> {f}
        </li>
      ))}
    </ul>
  </article>
);

const AboutPanel = () => (
  <article className="detail-panel" aria-labelledby="about-title">
    <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
      <div aria-hidden="true" style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "linear-gradient(135deg, #00c9a7, #6366f1)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px", fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace",
        flexShrink: 0,
      }}>AR</div>
      <div>
        <h1 id="about-title" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "26px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Alex Reeves</h1>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", fontFamily: "'JetBrains Mono', monospace" }}>@0xreeves · Security Researcher</div>
      </div>
    </div>

    <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.85, marginBottom: "28px" }}>
      I specialise in WordPress plugin vulnerability research. My focus is on finding and responsibly disclosing authentication bypasses, SQL injection, and access control vulnerabilities in widely-deployed plugins.
    </p>

    <div className="stats-grid" style={{ marginBottom: "32px" }}>
      {[
        { val: String(CVES.length),  label: "CVEs" },
        { val: String(TOOLS.length), label: "Tools" },
      ].map((s) => (
        <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "18px", textAlign: "center" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "32px", fontWeight: 700, color: "#fff" }}>{s.val}</div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "4px" }}>{s.label}</div>
        </div>
      ))}
    </div>

    <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "21px", fontWeight: 700, color: "#fff", margin: "36px 0 8px", letterSpacing: "-0.01em", lineHeight: 1.25 }}>Contact</h2>
    <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", padding: 0, margin: 0 }}>
      {[
        { label: "Email",     val: SOCIAL.email,             href: `mailto:${SOCIAL.email}`, external: false },
        { label: "GitHub",    val: "github.com/0xreeves",    href: SOCIAL.github,            external: true  },
        { label: "HackerOne", val: "hackerone.com/0xreeves", href: SOCIAL.hackerone,         external: true  },
        { label: "Twitter",   val: "@0xreeves",              href: SOCIAL.twitter,           external: true  },
      ].map((c) => (
        <li key={c.label}>
          <a href={c.href}
             {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
             className="contact-link"
             style={{
               display: "flex", gap: "12px", padding: "10px 14px",
               background: "rgba(255,255,255,0.03)", borderRadius: "8px",
               border: "1px solid rgba(255,255,255,0.07)",
               textDecoration: "none", color: "inherit",
             }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", width: "80px", flexShrink: 0 }}>{c.label}</span>
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", fontFamily: "'JetBrains Mono', monospace", wordBreak: "break-all" }}>
              {c.val}{c.external ? " ↗" : ""}
            </span>
          </a>
        </li>
      ))}
    </ul>
  </article>
);

// ─── RIGHT RAIL (TOC + metadata) ─────────────────────────────────────────────

// Four bracket-corner marks framing the article column
const Corners = () => (
  <>
    <span className="corner tl" aria-hidden="true" />
    <span className="corner tr" aria-hidden="true" />
    <span className="corner bl" aria-hidden="true" />
    <span className="corner br" aria-hidden="true" />
  </>
);

function RightRail({ section, item }) {
  // Headings come from the rendered MDX DOM (rehype-slug adds the ids).
  const [headings, setHeadings] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    // Wait for MDX to render, then snapshot h2[id] elements inside the article.
    const collect = () => {
      const els = Array.from(document.querySelectorAll(".detail-panel h2[id]"));
      const next = els.map(el => ({ id: el.id, text: el.textContent || "" }));
      setHeadings(next);
      setActive(next[0]?.id || null);
      return els;
    };

    const elements = collect();
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px", threshold: 0 }
    );
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onTocClick = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <aside className="right-rail" aria-label="Page metadata and table of contents">
      {headings.length > 1 && (
        <nav className="rail-section" aria-label="On this page">
          <div className="rail-title">On this page</div>
          <ul className="rail-toc" role="list">
            {headings.map(h => (
              <li key={h.id}>
                <a href={`#${h.id}`}
                   onClick={(e) => onTocClick(e, h.id)}
                   className={`rail-toc-link ${active === h.id ? "is-active" : ""}`}
                   aria-current={active === h.id ? "true" : undefined}
                >{h.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </aside>
  );
}

// ─── HASH ROUTING ────────────────────────────────────────────────────────────
const VALID_SECTIONS = ["cves", "writing", "tools", "about"];
const parseHash = () => {
  if (typeof window === "undefined") return { section: "cves", id: null };
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [section, id] = raw.split("/");
  if (!VALID_SECTIONS.includes(section)) return { section: "cves", id: null };
  return { section, id: id || null };
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const initial = parseHash();
  const initialSelected = (() => {
    if (initial.section === "cves")    return CVES.find(c => c.id === initial.id)?.id  || CVES[0].id;
    if (initial.section === "writing") return POSTS.find(p => p.id === initial.id)?.id || POSTS[0].id;
    if (initial.section === "tools")   return TOOLS.find(t => t.id === initial.id)?.id || TOOLS[0].id;
    return "about";
  })();

  const [section, setSection]   = useState(initial.section);
  const [selected, setSelected] = useState(initialSelected);
  const [mobileShowList, setMobileShowList] = useState(false);

  // State → URL hash
  useEffect(() => {
    const target = section === "about" ? "#/about" : `#/${section}/${selected}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [section, selected]);

  // External hash changes → state
  useEffect(() => {
    const onHash = () => {
      const { section: s, id } = parseHash();
      setSection(s);
      if (s === "cves")         setSelected(CVES.find(c => c.id === id)?.id  || CVES[0].id);
      else if (s === "writing") setSelected(POSTS.find(p => p.id === id)?.id || POSTS[0].id);
      else if (s === "tools")   setSelected(TOOLS.find(t => t.id === id)?.id || TOOLS[0].id);
      else                      setSelected("about");
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const switchSection = useCallback((id) => {
    setSection(id);
    if      (id === "cves")    setSelected(CVES[0].id);
    else if (id === "writing") setSelected(POSTS[0].id);
    else if (id === "tools")   setSelected(TOOLS[0].id);
    else                       setSelected("about");
    setMobileShowList(true);
  }, []);

  const selectItem = useCallback((id) => {
    setSelected(id);
    setMobileShowList(false);
  }, []);

  const currentData =
    section === "cves"    ? (CVES.find(c => c.id === selected)   || CVES[0])
  : section === "writing" ? (POSTS.find(p => p.id === selected)  || POSTS[0])
  : section === "tools"   ? (TOOLS.find(t => t.id === selected)  || TOOLS[0])
  : null;

  const currentItem = () => {
    if (section === "cves")    return <CVEDetail  cve={currentData}  />;
    if (section === "writing") return <PostDetail post={currentData} />;
    if (section === "tools")   return <ToolDetail tool={currentData} />;
    return <AboutPanel />;
  };

  const breadcrumbLabel = (() => {
    if (section === "about")   return "about";
    if (section === "cves")    return selected;
    if (section === "writing") return POSTS.find(p => p.id === selected)?.title || "";
    if (section === "tools")   return `~/${selected}`;
    return "";
  })();

  const navItems = [
    { id: "cves",    label: "CVEs",
      Icon: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M9 1.5L15.5 4.5V9C15.5 12.5 12.7 15.7 9 16.5C5.3 15.7 2.5 12.5 2.5 9V4.5L9 1.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M9 6v4M9 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
    },
    { id: "writing", label: "Writing",
      Icon: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 13.5L4.5 9 12.5 1 17 5.5 9 13.5 4.5 15z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M11 3l4 4M3 13.5L4.5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    },
    { id: "tools",   label: "Tools",
      Icon: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M14 3.5c1 1 1 3.5-1 5L9.5 12 6 15.5 2.5 12 6 8.5l3.5-3.5c1.5-2 3.5-2.5 4.5-1.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="4.5" cy="13.5" r="0.8" fill="currentColor"/></svg>
    },
    { id: "about",   label: "About",
      Icon: () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 16c0-3.6 3-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: #111; font-family: 'Outfit', sans-serif; color: #fff; }

        /* Skip link for keyboard / screen-reader users */
        .skip-link {
          position: absolute; left: -9999px; top: 8px;
          background: #fff; color: #111; padding: 8px 14px; border-radius: 6px;
          font-size: 13px; font-weight: 600; z-index: 100;
        }
        .skip-link:focus { left: 8px; }

        /* Visible focus ring without disturbing layout */
        :focus { outline: none; }
        :focus-visible {
          outline: 2px solid #fff;
          outline-offset: 2px;
          border-radius: 4px;
        }

        /* Interactive states */
        .list-item { transition: background 0.12s ease; }
        .list-item:hover { background: rgba(255,255,255,0.05) !important; }
        .nav-btn { transition: background 0.12s ease, color 0.12s ease; }
        .nav-btn:hover { background: rgba(255,255,255,0.06) !important; color: rgba(255,255,255,0.85) !important; }
        .copy-btn:hover { border-color: rgba(255,255,255,0.3) !important; color: rgba(255,255,255,0.95) !important; }
        .ext-link { transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease; }
        .ext-link:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.25); color: #fff; }
        .contact-link { transition: background 0.12s ease, border-color 0.12s ease; }
        .contact-link:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.18); }

        /* Scrollbars */
        .scroll-area { overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
        .scroll-area::-webkit-scrollbar { width: 6px; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }

        /* Layout primitives */
        .shell { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
        .rail {
          width: 56px; flex-shrink: 0; background: #0a0a0a;
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
          align-items: center; padding-top: 16px; gap: 4px;
        }
        .list-col {
          width: 280px; flex-shrink: 0; background: #141414;
          border-right: 1px solid rgba(255,255,255,0.07);
          display: flex; flex-direction: column;
        }
        .content-col { flex: 1; background: #111; overflow: hidden auto; }
        .article-wrap { position: relative; flex: 1; min-width: 0; max-width: 780px; }
        .detail-panel { padding: 36px 40px 36px 64px; max-width: 780px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

        .mobile-toggle { display: none; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; display: block; }
        .clamp-2 {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Tablet */
        @media (max-width: 960px) {
          .list-col { width: 240px; }
          .detail-panel { padding: 28px 28px; }
        }

        /* Mobile */
        @media (max-width: 720px) {
          html, body { overflow: auto; height: auto; }
          .shell { flex-direction: column; height: auto; min-height: 100vh; overflow: visible; }
          .rail {
            width: 100%; height: 56px; flex-direction: row;
            padding: 0 12px; gap: 4px; align-items: center; padding-top: 0;
            border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07);
            position: sticky; top: 0; z-index: 20; overflow-x: auto;
          }
          .rail .logo-mark { margin-bottom: 0 !important; margin-right: 8px; }
          .rail .nav-active-bar { display: none; }
          .list-col {
            width: 100%;
            border-right: none; border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .list-col.collapsed .list-scroll { display: none; }
          .content-col { overflow: visible; }
          .detail-panel { padding: 24px 18px; }
          .mobile-toggle { display: inline-flex; }
        }

        @media (max-width: 380px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
        }

        /* ── Right rail ── */
        .content-row { display: flex; align-items: flex-start; gap: 32px; width: 100%; }
        .right-rail {
          width: 240px; flex-shrink: 0;
          position: sticky; top: 64px;
          margin-top: 36px; padding-right: 32px;
          align-self: flex-start;
          max-height: calc(100vh - 80px);
          overflow-y: auto;
        }
        .rail-section { margin-bottom: 24px; padding-bottom: 22px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .rail-section:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
        .rail-title {
          font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.55);
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;
        }
        .rail-toc { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
        .rail-toc-link {
          display: block; padding: 6px 0 6px 12px;
          font-size: 12.5px; color: rgba(255,255,255,0.55);
          text-decoration: none; line-height: 1.4;
          border-left: 2px solid rgba(255,255,255,0.08);
          transition: color 0.12s ease, border-color 0.12s ease;
          cursor: pointer;
        }
        .rail-toc-link:hover { color: rgba(255,255,255,0.9); border-left-color: rgba(255,255,255,0.3); }
        .rail-toc-link.is-active { color: #fff; border-left-color: #fff; }
        .rail-meta { display: grid; grid-template-columns: 80px 1fr; gap: 8px 12px; margin: 0 0 14px 0; align-items: center; }
        .rail-meta dt { line-height: 1.3; }
        .rail-meta dd { line-height: 1.3; }
        .rail-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12px; color: rgba(255,255,255,0.78);
          text-decoration: none; padding: 6px 12px; border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.12); margin-top: 8px; margin-right: 6px;
          font-family: 'JetBrains Mono', monospace;
          background: transparent; cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
        }
        .rail-link:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.25); color: #fff; }
        .right-rail::-webkit-scrollbar { width: 4px; }
        .right-rail::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        /* Corner brackets framing the article column */
        .corner {
          position: absolute; width: 14px; height: 14px;
          border: 0 solid rgba(255,255,255,0.22);
          pointer-events: none; z-index: 5;
        }
        .corner.tl { top: 16px; left: 44px;  border-top-width: 1px; border-left-width: 1px; }
        .corner.tr { top: 16px; right: 20px; border-top-width: 1px; border-right-width: 1px; }
        .corner.bl { bottom: 16px; left: 44px;  border-bottom-width: 1px; border-left-width: 1px; }
        .corner.br { bottom: 16px; right: 20px; border-bottom-width: 1px; border-right-width: 1px; }

        @media (max-width: 1100px) { .right-rail { display: none; } }
        @media (max-width: 720px) { .corner { display: none; } }

        /* Tight binding: anything immediately after an h2 tucks in close */
        .md-h2 + p,
        .md-h2 + ul,
        .md-h2 + ol,
        .md-h2 + div,
        .md-h2 + table { margin-top: 0 !important; }

        /* highlight.js theme overrides — keep our card chrome, use theme only for tokens */
        pre code.hljs {
          background: transparent !important;
          padding: 0 !important;
          font-size: inherit;
          font-family: inherit;
          display: block;
        }

        /* Reduce motion */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition: none !important; animation: none !important; }
        }
      `}</style>

      <a href="#main-content" className="skip-link">Skip to content</a>

      <div className="shell">

        {/* ── COL 1: SECTION RAIL ── */}
        <nav className="rail" aria-label="Primary">
          <div className="logo-mark" aria-hidden="true" style={{
            width: 32, height: 32, borderRadius: "8px",
            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "16px", flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 600, color: "#111" }}>0x</span>
          </div>

          {navItems.map(({ id, label, Icon }) => {
            const active = section === id;
            return (
              <button key={id} type="button" className="nav-btn"
                aria-label={label}
                aria-current={active ? "page" : undefined}
                onClick={() => switchSection(id)}
                style={{
                  width: 40, height: 40, borderRadius: "10px", border: "none",
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", flexShrink: 0,
                }}>
                <Icon />
                {active && (
                  <span className="nav-active-bar" aria-hidden="true" style={{
                    position: "absolute", left: -1, top: "50%", transform: "translateY(-50%)",
                    width: 3, height: 20, borderRadius: "0 2px 2px 0",
                    background: "#fff",
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── COL 2: ITEM LIST ── */}
        {section !== "about" && (
          <aside
            className={`list-col ${mobileShowList ? "" : "collapsed"}`}
            aria-label={
              section === "cves" ? "CVE list"
              : section === "writing" ? "Article list"
              : "Tools list"
            }
          >
            <div style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px" }}>
                  {section === "cves" ? "Vulnerabilities" : section === "writing" ? "Articles" : "Open Source"}
                </div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>
                  {section === "cves" ? CVES.length : section === "writing" ? POSTS.length : TOOLS.length}{" "}
                  <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400, fontSize: "14px" }}>
                    {section === "cves" ? "CVEs" : section === "writing" ? "posts" : "tools"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="mobile-toggle nav-btn"
                aria-expanded={mobileShowList}
                aria-controls="list-scroll"
                onClick={() => setMobileShowList(v => !v)}
                style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.75)", padding: "6px 10px", borderRadius: "6px",
                  cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
                }}
              >{mobileShowList ? "Hide" : "Show"}</button>
            </div>

            <ul id="list-scroll" className="scroll-area list-scroll" role="list"
                style={{ flex: 1, listStyle: "none", padding: 0, margin: 0 }}>

              {section === "cves" && CVES.map(cve => {
                const active = selected === cve.id;
                return (
                  <li key={cve.id}>
                    <button type="button" className="list-item"
                      aria-current={active ? "true" : undefined}
                      onClick={() => selectItem(cve.id)}
                      style={{
                        width: "100%", textAlign: "left", border: "none", color: "inherit", font: "inherit",
                        background: active ? "rgba(255,255,255,0.06)" : "transparent",
                        padding: "13px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        borderLeft: active ? "2px solid #fff" : "2px solid transparent",
                        cursor: "pointer", display: "block",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "5px" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: active ? "#fff" : "rgba(255,255,255,0.7)", fontWeight: 500 }}>
                          {cve.id}
                        </span>
                        <Badge label={cve.severity} sev={cve.severity} />
                      </div>
                      <div className="truncate" style={{ fontSize: "13px", color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)", fontWeight: 500, lineHeight: 1.3 }}>
                        {cve.product}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>{cve.type}</div>
                    </button>
                  </li>
                );
              })}

              {section === "writing" && POSTS.map(post => {
                const active = selected === post.id;
                const tagColor = post.tag === "Methodology" ? "#7be0c8"
                              : post.tag === "Writeup"     ? "#a5adf3"
                                                           : "#7dcef5";
                return (
                  <li key={post.id}>
                    <button type="button" className="list-item"
                      aria-current={active ? "true" : undefined}
                      onClick={() => selectItem(post.id)}
                      style={{
                        width: "100%", textAlign: "left", border: "none", color: "inherit", font: "inherit",
                        background: active ? "rgba(255,255,255,0.06)" : "transparent",
                        padding: "14px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        borderLeft: active ? "2px solid #fff" : "2px solid transparent",
                        cursor: "pointer", display: "block",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px", gap: "8px" }}>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: tagColor, letterSpacing: "0.04em" }}>{post.tag.toUpperCase()}</span>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>{post.readTime}</span>
                      </div>
                      <div className="clamp-2" style={{ fontSize: "13px", color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.78)", fontWeight: 500, lineHeight: 1.4, marginBottom: "5px" }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{post.date}</div>
                    </button>
                  </li>
                );
              })}

              {section === "tools" && TOOLS.map(tool => {
                const active = selected === tool.id;
                const langColor = tool.lang === "Python" ? "#7dcef5" : "#7be0c8";
                return (
                  <li key={tool.id}>
                    <button type="button" className="list-item"
                      aria-current={active ? "true" : undefined}
                      onClick={() => selectItem(tool.id)}
                      style={{
                        width: "100%", textAlign: "left", border: "none", color: "inherit", font: "inherit",
                        background: active ? "rgba(255,255,255,0.06)" : "transparent",
                        padding: "14px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        borderLeft: active ? "2px solid #fff" : "2px solid transparent",
                        cursor: "pointer", display: "block",
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "8px" }}>
                        <span className="truncate" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: active ? "#fff" : "rgba(255,255,255,0.82)", fontWeight: 600 }}>~/{tool.name}</span>
                        <span style={{ fontSize: "10px", color: langColor, fontWeight: 700, flexShrink: 0 }}>{tool.lang}</span>
                      </div>
                      <div className="clamp-2" style={{ fontSize: "12px", color: "rgba(255,255,255,0.62)", lineHeight: 1.4 }}>{tool.tagline}</div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "5px" }} aria-label={`${tool.stars} stars`}>★ {tool.stars}</div>
                    </button>
                  </li>
                );
              })}

            </ul>
          </aside>
        )}

        {/* ── COL 3: CONTENT AREA ── */}
        <main id="main-content" className="scroll-area content-col" tabIndex={-1}>
          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            padding: "0 24px", height: "48px",
            background: "rgba(17,17,17,0.92)", backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
          }}>
            <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>0xreeves</span>
              <span aria-hidden="true" style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>/</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)" }}>{section}</span>
              {section !== "about" && (
                <>
                  <span aria-hidden="true" style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>/</span>
                  <span className="truncate" style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 500, maxWidth: "60vw" }}
                        title={breadcrumbLabel}>
                    {breadcrumbLabel}
                  </span>
                </>
              )}
            </nav>
            <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
              <a href={SOCIAL.github} target="_blank" rel="noopener noreferrer" className="ext-link"
                 style={{
                   fontSize: "11px", color: "rgba(255,255,255,0.6)", textDecoration: "none",
                   padding: "4px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)",
                   fontFamily: "'JetBrains Mono', monospace",
                 }}>github ↗</a>
              <a href={SOCIAL.hackerone} target="_blank" rel="noopener noreferrer" className="ext-link"
                 style={{
                   fontSize: "11px", color: "rgba(255,255,255,0.6)", textDecoration: "none",
                   padding: "4px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)",
                   fontFamily: "'JetBrains Mono', monospace",
                 }}>hackerone ↗</a>
            </div>
          </div>

          <div className="content-row">
            <div className="article-wrap">
              <Corners />
              {currentItem()}
            </div>
            {section !== "about" && <RightRail section={section} item={currentData} />}
          </div>
        </main>
      </div>
    </>
  );
}
