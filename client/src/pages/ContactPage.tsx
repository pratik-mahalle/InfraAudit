import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  Send, 
  MapPin, 
  MessageSquare, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message sent!",
      description: "Thank you for reaching out. We'll get back to you within 24 hours.",
    });
    
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email us",
      description: "We'll respond within 24 hours",
      value: "info@infraudit.dev",
      href: "mailto:info@infraudit.dev",
      color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    },
    {
      icon: Phone,
      title: "Call us",
      description: "Mon-Fri, 9am-5pm IST",
      value: "+91 9322338943",
      href: "tel:+919322338943",
      color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600",
    },
    {
      icon: MessageSquare,
      title: "Live chat",
      description: "Available during business hours",
      value: "Start a conversation",
      href: "#",
      color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600",
    },
  ];

  const reasons = [
    "You want to reduce your cloud costs by 30%+",
    "You need better visibility into multi-cloud infrastructure",
    "You're looking for automated security monitoring",
    "You want to understand Kubernetes cost allocation",
    "You need enterprise pricing or custom solutions",
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us | InfrAudit</title>
        <meta name="description" content="Get in touch with the InfrAudit team for questions about our multi-cloud infrastructure monitoring platform, sales inquiries, or support requests." />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Hero Section */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                Contact Us
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Let's talk about
                <br />
                <span className="text-blue-600">your cloud</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Have questions? We're here to help. Reach out and our team will get back to you as soon as possible.
              </p>
            </motion.div>

            {/* Contact Methods */}
            <div className="grid md:grid-cols-3 gap-6 mb-20">
              {contactMethods.map((method, i) => (
                <motion.a
                  key={i}
                  href={method.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center mb-4`}>
                    <method.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{method.title}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{method.description}</p>
                  <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                    {method.value}
                  </span>
                </motion.a>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-24 px-6 bg-gray-50 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Left Column */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in touch</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                  Fill out the form and our team will get back to you within 24 hours. We're here to answer any questions about our platform, pricing, or how InfrAudit can help your organization.
                </p>
                
                {/* Contact Info */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">info@infraudit.dev</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium">+91 9322338943</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Response time</div>
                      <div className="font-medium">Within 24 hours</div>
                    </div>
                  </div>
                </div>

                {/* Reasons */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700">
                  <h3 className="font-semibold mb-4">We'd love to hear from you if:</h3>
                  <ul className="space-y-3">
                    {reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
              
              {/* Right Column - Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium">
                        First name
                      </label>
                      <Input 
                        id="firstName" 
                        placeholder="John" 
                        required 
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium">
                        Last name
                      </label>
                      <Input 
                        id="lastName" 
                        placeholder="Doe" 
                        required 
                        className="h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <label htmlFor="email" className="text-sm font-medium">
                      Work email
                    </label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@company.com" 
                      required 
                      className="h-12 rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <label htmlFor="company" className="text-sm font-medium">
                      Company name
                    </label>
                    <Input 
                      id="company" 
                      placeholder="Acme Inc." 
                      className="h-12 rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <label htmlFor="interest" className="text-sm font-medium">
                      What are you interested in?
                    </label>
                    <select 
                      id="interest"
                      className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm"
                      required
                    >
                      <option value="">Select an option</option>
                      <option value="cost">Cost Optimization</option>
                      <option value="security">Security Monitoring</option>
                      <option value="multi-cloud">Multi-Cloud Management</option>
                      <option value="kubernetes">Kubernetes Cost Analysis</option>
                      <option value="enterprise">Enterprise Pricing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your cloud infrastructure and what you're looking to achieve..."
                      rows={4}
                      required
                      className="rounded-xl resize-none"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full h-12 rounded-xl font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send message
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    By submitting, you agree to our{" "}
                    <Link href="/privacy">
                      <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
                    </Link>
                  </p>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Teaser */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Looking for quick answers?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Check out our documentation for guides, tutorials, and API references.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/documentation">
                    View documentation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full">
                  <Link href="/pricing">
                    See pricing
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
}
