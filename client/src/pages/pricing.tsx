import { useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Check, ChevronDown, ShieldCheck, Zap } from "lucide-react";
import { Link } from "wouter";

const tiers = [
  { name: "Starter", icon: Zap, monthly: 49, annual: 39, description: "For small teams establishing continuous cloud visibility.", features: ["50 cloud resources", "Security drift detection", "Vulnerability scanning", "CIS Benchmarks", "7-day retention", "Email support"] },
  { name: "Professional", icon: ShieldCheck, monthly: 99, annual: 79, description: "For growing teams that need security and compliance in one view.", features: ["200 cloud resources", "Four compliance frameworks", "Advanced drift detection", "CVE scanning and SBOM", "Cost optimization", "30-day retention", "Slack and webhooks"] },
  { name: "Enterprise", icon: Building2, monthly: null, annual: null, description: "For complex infrastructure, organizations, and custom controls.", features: ["Unlimited resources", "Custom compliance policies", "90-day retention", "Multi-account management", "SSO and SAML", "Custom API integrations", "Dedicated support"] },
];

const faqs = [
  ["What counts as a cloud resource?", "Any monitored asset—such as an instance, bucket, database, cluster, or workload—counts once, regardless of how many checks run against it."],
  ["Can I change plans later?", "Yes. Upgrade or downgrade from subscription settings at any time. Upgrades are prorated; downgrades begin with the next billing cycle."],
  ["What happens after the trial?", "We remind you before the 14-day trial ends. You will not be charged until you select and confirm a paid plan."],
  ["Is cloud data stored by InfrAudit?", "We use read-only access and store resource metadata and scan results—not credentials or the contents of your cloud resources."],
];

const fade = { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: .65 } };

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="marketing-page pricing-page">
      <Helmet><title>Pricing | InfrAudit</title><meta name="description" content="Simple pricing for continuous multi-cloud security, compliance, and cost intelligence." /></Helmet>

      <section className="marketing-hero">
        <div className="marketing-shell-inner marketing-hero__inner">
          <motion.div {...fade}>
            <div className="marketing-eyebrow">Pricing</div>
            <h1>Clear coverage.<br />Predictable cost.</h1>
            <p>Begin with a complete 14-day trial. Choose the scale that fits your cloud when you are ready.</p>
          </motion.div>
          <div className="pricing-toggle" aria-label="Billing frequency">
            <button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button>
            <button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Annual <span>Save 20%</span></button>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-shell-inner pricing-grid">
          {tiers.map(({ name, icon: Icon, monthly, annual: annualPrice, description, features }, index) => (
            <motion.article className={`marketing-card pricing-card ${index === 1 ? "pricing-card--featured" : ""}`} key={name} {...fade} transition={{ duration: .65, delay: index * .08 }}>
              <div className="pricing-card__head"><Icon size={20} strokeWidth={1.5} /><span>0{index + 1}</span></div>
              <h2>{name}</h2>
              <p>{description}</p>
              <div className="pricing-card__price">
                {monthly === null ? <strong>Custom</strong> : <><strong>${annual ? annualPrice : monthly}</strong><span>/ month</span></>}
                {monthly !== null && <small>{annual ? "billed annually" : "billed monthly"}</small>}
              </div>
              <ul>{features.map(feature => <li key={feature}><Check size={14} />{feature}</li>)}</ul>
              {monthly === null ? <Link href="/contact" className="marketing-outline">Talk to us <ArrowRight size={15} /></Link> : <Link href="/signup" className="marketing-outline">Start free <ArrowRight size={15} /></Link>}
            </motion.article>
          ))}
        </div>
      </section>

      <section className="marketing-section pricing-footnote">
        <motion.div className="marketing-shell-inner marketing-split" {...fade}>
          <div><div className="marketing-eyebrow">Every plan includes</div><h2>Secure from the first connection.</h2></div>
          <div className="marketing-list">{["Read-only cloud access", "Encryption in transit and at rest", "Continuous posture updates", "No credit card for trial"].map(item => <span key={item}><Check size={15} />{item}</span>)}</div>
        </motion.div>
      </section>

      <section className="marketing-section marketing-faq">
        <div className="marketing-shell-inner marketing-split">
          <div><div className="marketing-eyebrow">Questions</div><h2>The details,<br />without the fine print.</h2></div>
          <div>{faqs.map(([question, answer], index) => <div className="marketing-faq__item" key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><ChevronDown size={16} className={openFaq === index ? "open" : ""} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div>
        </div>
      </section>
    </div>
  );
}
