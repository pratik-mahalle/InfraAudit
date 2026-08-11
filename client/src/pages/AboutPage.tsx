import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Check, Eye, FileCheck2, Layers3, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const fade = { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .15 }, transition: { duration: .65 } };

function AboutValueAsset({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="about-value-asset about-value-asset--clarity" aria-hidden="true">
        <div className="about-clarity__signals"><i /><i /><i /><i /><i /></div>
        <div className="about-clarity__focus"><Eye size={16} /><span><strong>3 signals</strong><small>explained</small></span></div>
        <div className="about-clarity__filter"><span />Relevant context</div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="about-value-asset about-value-asset--context" aria-hidden="true">
        <svg viewBox="0 0 250 130" fill="none"><path d="M32 30 L125 65 L218 25 M125 65 L55 108 M125 65 L208 106" /></svg>
        <span className="about-context__node about-context__node--core"><Layers3 size={15} /></span>
        <span className="about-context__node about-context__node--one">Owner</span>
        <span className="about-context__node about-context__node--two">Asset</span>
        <span className="about-context__node about-context__node--three">Impact</span>
        <span className="about-context__node about-context__node--four">Policy</span>
        <i className="about-context__packet" />
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className="about-value-asset about-value-asset--trust" aria-hidden="true">
        <div className="about-trust__rings"><span /><span /></div>
        <div className="about-trust__core"><LockKeyhole size={18} /></div>
        <div className="about-trust__permission"><ShieldCheck size={12} />Read only</div>
        <div className="about-trust__audit"><Activity size={12} />Auditable</div>
      </div>
    );
  }

  return (
    <div className="about-value-asset about-value-asset--evidence" aria-hidden="true">
      <div className="about-evidence__head"><FileCheck2 size={15} /><span>Control evidence</span><small>Live</small></div>
      <div className="about-evidence__rows"><span><i><Check size={8} /></i>Encryption enabled</span><span><i><Check size={8} /></i>Access reviewed</span><span><i><Check size={8} /></i>Change recorded</span></div>
      <div className="about-evidence__timeline"><b /><b /><b /><i /></div>
    </div>
  );
}

function AboutMetricAsset({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="about-metric-asset about-metric-asset--clouds" aria-hidden="true">
        <svg viewBox="0 0 300 90" fill="none"><path d="M34 45 H266" /></svg>
        {["aws", "azure", "gcp", "k8s"].map((provider, providerIndex) => <span style={{ left: `${8 + providerIndex * 28}%` }} key={provider}><img src={`/logos/${provider}.svg`} alt="" /></span>)}
        <i />
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className="about-metric-asset about-metric-asset--pulse" aria-hidden="true">
        <svg viewBox="0 0 300 90" fill="none"><path d="M0 47 H62 L75 47 L88 20 L107 70 L124 35 L139 47 H300" /></svg>
        <span><Activity size={13} />Observing now</span><i />
      </div>
    );
  }

  return (
    <div className="about-metric-asset about-metric-asset--system" aria-hidden="true">
      <svg viewBox="0 0 300 90" fill="none"><path d="M32 18 L150 45 L268 18 M150 45 L52 75 M150 45 L248 75" /></svg>
      <span className="about-system__core"><Layers3 size={15} /></span>
      <span className="about-system__node about-system__node--one" /><span className="about-system__node about-system__node--two" /><span className="about-system__node about-system__node--three" /><span className="about-system__node about-system__node--four" />
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="marketing-page about-page">
      <Helmet><title>About | InfrAudit</title><meta name="description" content="InfrAudit makes cloud security, compliance, and infrastructure change understandable for modern engineering teams." /></Helmet>

      <section className="marketing-hero about-hero">
        <motion.div className="marketing-shell-inner marketing-hero__inner" {...fade}>
          <div className="marketing-eyebrow">About InfrAudit</div>
          <h1>Cloud security should<br />feel understandable.</h1>
          <p>We are building a quieter, more connected way for engineering teams to understand the infrastructure they operate—and act before small changes become large incidents.</p>
        </motion.div>
      </section>

      <section className="marketing-section about-manifesto">
        <motion.div className="marketing-shell-inner marketing-split" {...fade}>
          <div><div className="marketing-eyebrow">Our point of view</div><h2>More context.<br />Less noise.</h2></div>
          <div className="marketing-copy"><p>Cloud estates change by the minute, while security reviews and audit evidence remain point-in-time. That gap leaves teams reacting to alerts without understanding what actually matters.</p><p>InfrAudit turns resources, changes, vulnerabilities, controls, and ownership into one continuous model. Every signal has a source. Every finding has context. Every action leaves evidence.</p></div>
        </motion.div>
      </section>

      <section className="marketing-section about-values">
        <div className="marketing-shell-inner">
          <div className="marketing-eyebrow">What guides us</div>
          <div className="about-values__grid">
            {[
              ["Clarity over volume", "A smaller number of explained findings is more useful than an endless queue of alerts."],
              ["Context is the product", "Ownership, dependencies, environment, and impact belong beside every signal."],
              ["Trust by design", "Read-only access and inspectable reasoning keep teams in control of their infrastructure."],
              ["Evidence continuously", "Security and compliance should be a property of daily work, not a quarterly scramble."],
            ].map(([title, copy], index) => (
              <motion.article className="marketing-card about-value" key={title} {...fade} transition={{ duration: .65, delay: index * .06 }}><span>0{index + 1}</span><AboutValueAsset index={index} /><h3>{title}</h3><p>{copy}</p></motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="marketing-section about-numbers">
        <motion.div className="marketing-shell-inner" {...fade}>
          <div className="about-numbers__head"><div><div className="marketing-eyebrow">Operating footprint</div><h2>Built for the estate<br />you already have.</h2></div><p>One continuous model across providers, accounts, clusters, and controls—kept current without adding agents to your infrastructure.</p></div>
          <div className="about-numbers__grid">
            {[["4", "Cloud and orchestration platforms"], ["24/7", "Continuous posture observation"], ["1", "Connected system of record"]].map(([value, label], index) => <article className="marketing-card about-metric" key={value}><div className="about-metric__index">0{index + 1}</div><AboutMetricAsset index={index} /><div className="about-metric__value"><strong>{value}</strong><span>{label}</span></div></article>)}
          </div>
        </motion.div>
      </section>

      <section className="marketing-section marketing-page-cta">
        <motion.div className="marketing-shell-inner" {...fade}>
          <div className="marketing-eyebrow">See it in your environment</div>
          <h2>Start with one cloud.<br />Understand the whole picture.</h2>
          <p>Connect read-only access and see your first posture assessment in minutes.</p>
          <Link href="/signup" className="marketing-outline">Start your trial <ArrowRight size={15} /></Link>
        </motion.div>
      </section>
    </div>
  );
}
