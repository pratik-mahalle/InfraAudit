import { FormEvent, useState } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock3, Mail, MessageSquare, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const fade = { initial: { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: .15 }, transition: { duration: .65 } };

export default function ContactPage() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 700));
    setSubmitting(false);
    toast({ title: "Message received", description: "We’ll get back to you within one business day." });
    event.currentTarget.reset();
  };

  return (
    <div className="marketing-page contact-page">
      <Helmet><title>Contact | InfrAudit</title><meta name="description" content="Talk with the InfrAudit team about cloud security, compliance, pricing, or support." /></Helmet>

      <section className="marketing-hero">
        <motion.div className="marketing-shell-inner marketing-hero__inner" {...fade}>
          <div className="marketing-eyebrow">Contact</div>
          <h1>Bring us your<br />cloud questions.</h1>
          <p>Whether you are evaluating InfrAudit, planning a rollout, or looking for support, you will hear from a real person who understands the product.</p>
        </motion.div>
      </section>

      <section className="marketing-section contact-content">
        <div className="marketing-shell-inner contact-grid">
          <motion.div className="contact-details" {...fade}>
            <div className="marketing-eyebrow">Reach the team</div>
            <h2>Let’s understand what you operate.</h2>
            <p>Tell us about your environments, your current workflow, and where visibility breaks down. We usually reply within one business day.</p>
            <div className="contact-methods">
              <a href="mailto:pratik@infraudit.com"><Mail size={18} /><span><small>Email</small>pratik@infraudit.com</span><ArrowRight size={14} /></a>
              <a href="tel:+919322338943"><Phone size={18} /><span><small>Phone</small>+91 93223 38943</span><ArrowRight size={14} /></a>
              <div><Clock3 size={18} /><span><small>Availability</small>Monday–Friday, 9:00–17:00 IST</span></div>
            </div>
            <div className="contact-notes">
              {["Platform and integration questions", "Enterprise pricing and rollout planning", "Security, privacy, and compliance reviews"].map(item => <span key={item}><Check size={14} />{item}</span>)}
            </div>
          </motion.div>

          <motion.form className="marketing-card contact-form" onSubmit={submit} {...fade} transition={{ duration: .65, delay: .1 }}>
            <div className="contact-form__head"><MessageSquare size={20} /><span>New conversation</span><small>Typically replies in 24h</small></div>
            <div className="contact-form__row"><label>First name<input name="firstName" placeholder="Alex" required /></label><label>Last name<input name="lastName" placeholder="Morgan" required /></label></div>
            <label>Work email<input type="email" name="email" placeholder="alex@company.com" required /></label>
            <label>Company<input name="company" placeholder="Company name" /></label>
            <label>What would you like to discuss?<select name="topic" defaultValue=""><option value="" disabled>Select a topic</option><option>Product evaluation</option><option>Enterprise pricing</option><option>Technical support</option><option>Security review</option></select></label>
            <label>Message<textarea name="message" placeholder="A little context helps us bring the right answer." rows={5} required /></label>
            <button className="marketing-outline" type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send message"}<ArrowRight size={15} /></button>
            <p>By submitting, you agree to our privacy policy. We never sell contact information.</p>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
