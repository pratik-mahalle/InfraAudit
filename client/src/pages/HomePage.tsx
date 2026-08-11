import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Database,
  Eye,
  FileCheck2,
  Layers3,
  Linkedin,
  LockKeyhole,
  Menu,
  Server,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { InfraAuditLogo } from "@/components/ui/InfraAuditLogo";

const features = [
  {
    icon: Eye,
    eyebrow: "Continuous visibility",
    title: "See every change, as it happens.",
    copy: "Build a living inventory across AWS, Azure, GCP, and Kubernetes. InfrAudit watches infrastructure drift without slowing your team down.",
    stat: "24 / 7",
    statLabel: "infrastructure observation",
  },
  {
    icon: ScanSearch,
    eyebrow: "Vulnerability context",
    title: "Find what is vulnerable and where it runs.",
    copy: "Connect vulnerabilities to real infrastructure, owners, environments, and exposure paths so teams know what actually matters.",
    stat: "1 view",
    statLabel: "from finding to owner",
  },
  {
    icon: FileCheck2,
    eyebrow: "Evidence-backed remediation",
    title: "Move from finding to verified fix.",
    copy: "Keep every vulnerability, drift, and exposure tied to evidence, status, owner, and remediation history.",
    stat: "5 min",
    statLabel: "to useful signal",
  },
];

const signalRows = [
  { name: "Critical package CVE", type: "Vulnerability", scope: "payments", state: "Assigned" },
  { name: "Terraform baseline changed", type: "Drift", scope: "prod-eu", state: "Review" },
  { name: "Public storage policy", type: "Exposure", scope: "data-platform", state: "High" },
  { name: "Idle compute cluster", type: "Cost", scope: "staging", state: "Ready" },
];

const positioningCards = [
  {
    icon: ScanSearch,
    label: "Vulnerabilities",
    text: "Correlate vulnerable packages, images, and cloud resources with the infrastructure they affect.",
  },
  {
    icon: Activity,
    label: "Drift",
    text: "Spot when live environments move away from expected baselines, policies, or IaC state.",
  },
  {
    icon: ShieldCheck,
    label: "Exposure",
    text: "Identify public access, risky identity paths, weak encryption, and configuration gaps.",
  },
  {
    icon: Layers3,
    label: "Ownership",
    text: "Route issues to the right team with environment, service, and resource context.",
  },
];

const teamUseCases = [
  {
    icon: ShieldCheck,
    title: "Security teams",
    copy: "Prioritize vulnerabilities and cloud exposure with live infrastructure context instead of static scanner output.",
  },
  {
    icon: Cloud,
    title: "Platform teams",
    copy: "Understand drift, ownership, and service impact before changes turn into operational incidents.",
  },
  {
    icon: Code2,
    title: "Engineering teams",
    copy: "Get clear evidence and remediation context without jumping between cloud consoles, scanners, and spreadsheets.",
  },
];

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export function LandingNav() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const landingPrefix = location === "/" ? "" : "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`landing-nav ${scrolled ? "landing-nav--scrolled" : ""}`} aria-label="Primary navigation">
      <div className="landing-shell landing-nav__inner">
        <Link href="/" className="landing-nav__logo" aria-label="InfrAudit home">
          <InfraAuditLogo height={34} variant="dark" />
        </Link>

        <div className="landing-nav__links">
          <a href={`${landingPrefix}#platform`}>Platform</a>
          <a href={`${landingPrefix}#workflow`}>How it works</a>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
        </div>

        <div className="landing-nav__actions">
          <Link href="/auth" className="landing-login">Log in</Link>
          <Link href="/signup" className="landing-primary">Start free</Link>
        </div>

        <button className="landing-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="landing-mobile-nav">
          <a href={`${landingPrefix}#platform`} onClick={() => setOpen(false)}>Platform</a>
          <a href={`${landingPrefix}#workflow`} onClick={() => setOpen(false)}>How it works</a>
          <Link href="/pricing">Pricing</Link>
          <Link href="/about">About</Link>
          <Link href="/auth">Log in</Link>
          <Link href="/signup">Start free</Link>
        </div>
      )}
    </nav>
  );
}

function ProductSurface() {
  return (
    <div className="product-surface" aria-label="InfrAudit product overview">
      <div className="product-surface__topbar">
        <div className="product-surface__brand"><ShieldCheck size={17} /> Overview</div>
        <div className="product-surface__range">Last 24 hours <ChevronDown size={13} /></div>
      </div>

      <div className="product-surface__grid">
        <div className="health-card">
          <span className="surface-label">Infrastructure health</span>
          <div className="health-score">92<span>/100</span></div>
          <div className="health-line"><span style={{ width: "92%" }} /></div>
          <p>Strong posture across connected environments.</p>
        </div>
        <div className="surface-stat"><span>Resources watched</span><strong>1,284</strong><small>Across 4 providers</small></div>
        <div className="surface-stat"><span>Open findings</span><strong>18</strong><small>6 need attention</small></div>
      </div>

      <div className="signal-table">
        <div className="signal-table__heading"><span>Live signals</span><span>Scope</span><span>Status</span></div>
        {signalRows.map((row) => (
          <div className="signal-table__row" key={row.name}>
            <span><i /><b>{row.name}</b><small>{row.type}</small></span>
            <span>{row.scope}</span>
            <span>{row.state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroSystemMap() {
  return (
    <div className="hero-system" aria-hidden="true">
      <svg className="hero-system__paths" viewBox="0 0 720 620" fill="none" preserveAspectRatio="xMidYMid meet">
        <path d="M105 118 C210 118 216 252 337 252" />
        <path d="M612 102 C496 102 506 252 383 252" />
        <path d="M112 486 C214 486 218 326 337 326" />
        <path d="M612 502 C494 502 500 326 383 326" />
        <path d="M360 312 V438" />
        <circle cx="360" cy="288" r="135" />
        <circle cx="360" cy="288" r="190" />
      </svg>

      <div className="hero-system__scan" />

      <div className="hero-system__core">
        <span className="hero-system__pulse" />
        <ShieldCheck size={28} strokeWidth={1.4} />
        <strong>InfrAudit</strong>
        <small>Observing 1,284 resources</small>
      </div>

      <div className="hero-system__node hero-system__node--aws">
        <img src="/logos/aws.svg" alt="" /><span><strong>AWS</strong><small>486 resources</small></span><i />
      </div>
      <div className="hero-system__node hero-system__node--azure">
        <img src="/logos/azure.svg" alt="" /><span><strong>Azure</strong><small>312 resources</small></span><i />
      </div>
      <div className="hero-system__node hero-system__node--database">
        <Database size={18} strokeWidth={1.5} /><span><strong>Data layer</strong><small>Policy checked</small></span><i />
      </div>
      <div className="hero-system__node hero-system__node--compute">
        <Server size={18} strokeWidth={1.5} /><span><strong>Compute</strong><small>Drift detected</small></span><i />
      </div>
      <div className="hero-system__node hero-system__node--k8s">
        <img src="/logos/k8s.svg" alt="" /><span><strong>Kubernetes</strong><small>9 clusters</small></span><i />
      </div>

      <div className="hero-system__signal hero-system__signal--one"><span /> configuration change</div>
      <div className="hero-system__signal hero-system__signal--two"><span /> evidence verified</div>
      <div className="hero-system__signal hero-system__signal--three"><span /> risk contextualized</div>
    </div>
  );
}

function FeatureAsset({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="feature-asset feature-asset--visibility" aria-hidden="true">
        <svg viewBox="0 0 300 142" fill="none">
          <path d="M38 35 C91 35 96 71 146 71" />
          <path d="M262 32 C213 32 208 71 158 71" />
          <path d="M43 113 C91 113 98 78 146 78" />
          <path d="M258 110 C210 110 204 78 158 78" />
        </svg>
        <span className="feature-asset__hub"><Eye size={18} /></span>
        <span className="feature-asset__resource feature-asset__resource--one"><Cloud size={14} /></span>
        <span className="feature-asset__resource feature-asset__resource--two"><Server size={14} /></span>
        <span className="feature-asset__resource feature-asset__resource--three"><Database size={14} /></span>
        <span className="feature-asset__resource feature-asset__resource--four"><img src="/logos/k8s.svg" alt="" /></span>
        <i className="feature-asset__packet feature-asset__packet--one" />
        <i className="feature-asset__packet feature-asset__packet--two" />
        <small>Live asset graph</small>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="feature-asset feature-asset--risk" aria-hidden="true">
        <div className="feature-risk__radar"><span /><ScanSearch size={19} /></div>
        <div className="feature-risk__finding feature-risk__finding--one"><i />Public endpoint<small>Context added</small></div>
        <div className="feature-risk__finding feature-risk__finding--two"><i />Image exposure<small>Owner found</small></div>
        <div className="feature-risk__finding feature-risk__finding--three"><i />IAM policy<small>Low impact</small></div>
      </div>
    );
  }

  return (
    <div className="feature-asset feature-asset--compliance" aria-hidden="true">
      <div className="feature-compliance__document">
        <div><FileCheck2 size={17} /><span>SOC 2 evidence</span><small>Live</small></div>
        <p><i /><span /><b /></p>
        <p><i /><span /><b /></p>
        <p><i /><span /><b /></p>
      </div>
      <div className="feature-compliance__stamp"><Check size={18} /><span>Verified</span></div>
    </div>
  );
}

function WorkflowSignalAsset() {
  return (
    <div className="workflow-signal-asset" aria-hidden="true">
      <div className="workflow-signal-asset__head">
        <span><Activity size={13} /> Live event</span>
        <small>Just now</small>
      </div>
      <div className="workflow-signal-asset__event">
        <div><i /><span><strong>Storage policy changed</strong><small>prod-eu · object-store-04</small></span></div>
        <b>Detected</b>
      </div>
      <div className="workflow-signal-asset__track">
        <span><i />Signal</span>
        <span><i />Context</span>
        <span><i />Action</span>
        <b />
      </div>
      <div className="workflow-signal-asset__context">
        <span><Layers3 size={11} /> Platform team</span>
        <span><ShieldCheck size={11} /> High impact</span>
        <span><Check size={11} /> Fix ready</span>
      </div>
    </div>
  );
}

function WorkflowStepAsset({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="workflow-step-asset workflow-step-asset--connect" aria-hidden="true">
        <div className="workflow-step-asset__label"><span>Connected sources</span><small>Live</small></div>
        <svg viewBox="0 0 220 210" fill="none">
          <path d="M38 38 C83 38 78 94 105 100" />
          <path d="M182 38 C138 38 143 94 115 100" />
          <path d="M38 172 C83 172 78 116 105 110" />
          <path d="M182 172 C138 172 143 116 115 110" />
        </svg>
        <span className="workflow-connect__core"><Cloud size={22} /></span>
        <span className="workflow-connect__provider workflow-connect__provider--aws"><img src="/logos/aws.svg" alt="" /></span>
        <span className="workflow-connect__provider workflow-connect__provider--azure"><img src="/logos/azure.svg" alt="" /></span>
        <span className="workflow-connect__provider workflow-connect__provider--gcp"><img src="/logos/gcp.svg" alt="" /></span>
        <span className="workflow-connect__provider workflow-connect__provider--k8s"><img src="/logos/k8s.svg" alt="" /></span>
        <i className="workflow-connect__packet workflow-connect__packet--one" />
        <i className="workflow-connect__packet workflow-connect__packet--two" />
        <small>4 environments connected</small>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="workflow-step-asset workflow-step-asset--understand" aria-hidden="true">
        <div className="workflow-step-asset__label"><span>Signal context</span><small>Mapped</small></div>
        <div className="workflow-understand__source"><Activity size={14} /><span>Policy changed</span></div>
        <div className="workflow-understand__spine"><i /><i /><i /></div>
        <div className="workflow-understand__context">
          <span><small>Owner</small>Platform</span>
          <span><small>Scope</small>Production</span>
          <span><small>Impact</small>High</span>
        </div>
        <div className="workflow-understand__result"><Layers3 size={14} /><span><strong>Context complete</strong><small>3 relationships mapped</small></span></div>
      </div>
    );
  }

  return (
      <div className="workflow-step-asset workflow-step-asset--resolve" aria-hidden="true">
        <div className="workflow-step-asset__label"><span>Remediation</span><small>Ready</small></div>
        <div className="workflow-resolve__window">
        <div><i /><i /><i /><span>remediation.tf</span></div>
        <p><b>−</b><span>public_access = true</span></p>
        <p><b>+</b><span>public_access = false</span></p>
        <p><b>+</b><span>encryption = "AES256"</span></p>
      </div>
      <div className="workflow-resolve__arrow"><ArrowRight size={11} /></div>
      <div className="workflow-resolve__verify"><Check size={15} /><span><strong>Fix verified</strong><small>Policy now passing</small></span></div>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-shell">
        <div className="landing-footer__top">
          <div>
            <InfraAuditLogo height={32} variant="dark" />
            <p>Finding vulnerabilities, drift, and exposure<br />across the infrastructure your teams run.</p>
            <a className="landing-footer__social" href="https://www.linkedin.com/company/infraauditio" target="_blank" rel="noopener noreferrer" aria-label="InfrAudit on LinkedIn">
              <Linkedin size={15} />
              <span>LinkedIn</span>
            </a>
          </div>
          <div className="landing-footer__links">
            <div><span>Product</span><a href="/#platform">Platform</a><Link href="/pricing">Pricing</Link><Link href="/auth">Sign in</Link></div>
            <div><span>Resources</span><a href="https://docs.infraudit.com/" target="_blank" rel="noreferrer">Documentation</a><Link href="/api">API</Link><Link href="/guide">Guides</Link></div>
            <div><span>Company</span><Link href="/about">About</Link><Link href="/contact">Contact</Link><a href="https://github.com/pratik-mahalle/InfraAudit" target="_blank" rel="noreferrer">GitHub</a></div>
          </div>
        </div>
        <div className="landing-footer__bottom">
          <span>© {new Date().getFullYear()} InfrAudit</span>
          <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
          <span className="landing-status"><i /> All systems operational</span>
        </div>
        <p className="landing-disclaimer">InfrAudit provides cloud security and compliance intelligence. Findings should be reviewed within the context of your organization’s security program.</p>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="landing-page">
      <LandingNav />

      <main>
        <section className="landing-hero">
          <div className="landing-hero__atmosphere" />
          <div className="landing-hero__veil" />
          <motion.div className="landing-shell landing-hero__content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <div className="landing-kicker"><span /> Infrastructure risk, made clear</div>
            <h1>Find vulnerabilities.<br />Catch drift.</h1>
            <p>InfrAudit helps teams discover vulnerable infrastructure, detect configuration drift, prioritize exposure, and track remediation across cloud and Kubernetes environments.</p>
            <div className="landing-hero__actions">
              <Link href="/auth" className="landing-ghost">Explore the platform <ArrowRight size={16} /></Link>
              <span>No credit card · 14 days free</span>
            </div>
          </motion.div>
          <HeroSystemMap />
          <div className="landing-hero__foot">
            <span>Built for modern cloud teams</span>
            <div>
              <span><img src="/logos/aws.svg" alt="" /> AWS</span>
              <span><img src="/logos/azure.svg" alt="" /> Azure</span>
              <span><img src="/logos/gcp.svg" alt="" /> Google Cloud</span>
              <span><img src="/logos/k8s.svg" alt="" /> Kubernetes</span>
            </div>
          </div>
        </section>

        <section className="landing-section landing-intro" id="platform">
          <motion.div className="landing-shell" {...reveal}>
            <div className="landing-section__eyebrow">One measured view</div>
            <div className="landing-intro__heading">
              <h2>Your infrastructure is always changing.<br />InfrAudit shows what became risky.</h2>
              <p>Replace disconnected vulnerability scanners, drift checks, and spreadsheets with continuous context. From one changed resource to the teams responsible for fixing it, every finding remains connected.</p>
            </div>
            <ProductSurface />
          </motion.div>
        </section>

        <section className="landing-section landing-positioning">
          <motion.div className="landing-shell" {...reveal}>
            <div className="landing-section__eyebrow">What InfrAudit brings together</div>
            <div className="landing-positioning__head">
              <h2>One place to understand infrastructure risk.</h2>
              <p>InfrAudit sits between cloud inventory, vulnerability signals, drift detection, and remediation workflows so teams can decide what to fix with confidence.</p>
            </div>
            <div className="landing-positioning__grid">
              {positioningCards.map(({ icon: Icon, label, text }) => (
                <article className="landing-positioning-card" key={label}>
                  <Icon size={18} strokeWidth={1.5} />
                  <h3>{label}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="landing-section landing-feature-section">
          <div className="landing-shell">
            <div className="landing-feature-grid">
              {features.map(({ icon: Icon, eyebrow, title, copy, stat, statLabel }, index) => (
                <motion.article className="landing-feature-card" key={title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.08 }}>
                  <div className="landing-feature-card__number">0{index + 1}</div>
                  <FeatureAsset index={index} />
                  <span className="landing-feature-card__eyebrow"><Icon size={16} strokeWidth={1.5} />{eyebrow}</span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                  <div className="landing-feature-card__stat"><strong>{stat}</strong><small>{statLabel}</small></div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section landing-team-section">
          <motion.div className="landing-shell" {...reveal}>
            <div className="landing-team-section__head">
              <div>
                <div className="landing-section__eyebrow">Built for teams</div>
                <h2>Same infrastructure truth, different operating needs.</h2>
              </div>
              <p>Security, platform, and engineering teams see the same finding with the context each team needs: severity, scope, owner, evidence, and remediation state.</p>
            </div>
            <div className="landing-team-grid">
              {teamUseCases.map(({ icon: Icon, title, copy }) => (
                <article className="landing-team-card" key={title}>
                  <Icon size={20} strokeWidth={1.5} />
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="landing-section landing-workflow" id="workflow">
          <motion.div className="landing-shell landing-workflow__grid" {...reveal}>
            <div className="landing-workflow__copy">
              <div className="landing-section__eyebrow">From signal to action</div>
              <h2>Risk work that moves at infrastructure speed.</h2>
              <p>Connect your environments once. InfrAudit builds context continuously, guides the right owner, and keeps a durable record of what changed and how it was fixed.</p>
              <WorkflowSignalAsset />
              <Link href="/documentation" className="landing-text-link">Read the documentation <ArrowRight size={16} /></Link>
            </div>
            <div className="landing-steps">
              {[
                [Cloud, "Connect", "Read-only integrations discover your cloud estate in minutes."],
                [Layers3, "Understand", "Signals are enriched with ownership, severity, and dependency context."],
                [Sparkles, "Resolve", "Clear remediation paths move work from finding to verified fix."],
              ].map(([Icon, title, text], index) => {
                const StepIcon = Icon as typeof Cloud;
                return <div className="landing-step" key={title as string}><div className="landing-step__head"><StepIcon size={19} /><span>0{index + 1}</span></div><h3>{title as string}</h3><p>{text as string}</p><WorkflowStepAsset index={index} /></div>;
              })}
            </div>
          </motion.div>
        </section>

        <section className="landing-section landing-proof">
          <motion.div className="landing-shell landing-proof__inner" {...reveal}>
            <div>
              <div className="landing-section__eyebrow">Engineered for trust</div>
              <h2>Findings your teams can defend.</h2>
            </div>
            <div className="landing-proof__items">
              <div><LockKeyhole size={21} /><h3>Read-only by design</h3><p>Your infrastructure stays yours. InfrAudit observes through least-privilege connections.</p></div>
              <div><Code2 size={21} /><h3>Evidence you can inspect</h3><p>Every finding includes the resource, source, timestamp, and reasoning behind it.</p></div>
              <div><Activity size={21} /><h3>Always current</h3><p>Continuous monitoring replaces stale exports with a living view of vulnerabilities, drift, and exposure.</p></div>
            </div>
          </motion.div>
        </section>

        <section className="landing-section landing-cta">
          <motion.div className="landing-shell landing-cta__inner" {...reveal}>
            <div className="landing-section__eyebrow">Start with clarity</div>
            <h2>See what is vulnerable,<br />drifted, and exposed.</h2>
            <p>Connect your first environment in minutes and give your team a shared view of infrastructure risk.</p>
            <div className="landing-cta__actions">
              <Link href="/signup" className="landing-ghost">Start your free trial <ArrowRight size={16} /></Link>
              <Link href="/contact" className="landing-text-link">Talk to us</Link>
            </div>
            <div className="landing-cta__notes"><span><Check size={14} /> Vulnerability context</span><span><Check size={14} /> Drift detection</span><span><Check size={14} /> Read-only access</span></div>
          </motion.div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
