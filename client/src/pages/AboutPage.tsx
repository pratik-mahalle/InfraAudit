import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Award, 
  BarChart4, 
  Shield, 
  Cloud, 
  Check, 
  Users, 
  Globe, 
  Rocket,
  Target,
  Heart,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

export default function AboutPage() {
  const stats = [
    { value: "35%", label: "Average cost savings", color: "text-emerald-500" },
    { value: "50K+", label: "Resources monitored", color: "text-blue-500" },
    { value: "99.9%", label: "Uptime SLA", color: "text-violet-500" },
    { value: "24/7", label: "AI monitoring", color: "text-amber-500" },
  ];

  const values = [
    {
      icon: Target,
      title: "Customer First",
      description: "Every feature we build starts with understanding our customers' real challenges.",
    },
    {
      icon: Zap,
      title: "Move Fast",
      description: "We ship quickly, iterate based on feedback, and continuously improve.",
    },
    {
      icon: Shield,
      title: "Security by Default",
      description: "Security isn't an afterthought—it's built into everything we do.",
    },
    {
      icon: Heart,
      title: "Open & Transparent",
      description: "We believe in open source and transparent pricing. No hidden fees, ever.",
    },
  ];

  const solutions = [
    {
      icon: BarChart4,
      title: "Cost Optimization",
      description: "Automatically identify idle resources, right-size instances, and get actionable recommendations.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Shield,
      title: "Security Monitoring",
      description: "Continuous scanning for misconfigurations, compliance violations, and vulnerabilities.",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Cloud,
      title: "Multi-Cloud Management",
      description: "Unified dashboard for AWS, Azure, GCP, and Kubernetes with complete visibility.",
      color: "from-violet-500 to-purple-500",
    },
  ];

  return (
    <>
      <Helmet>
        <title>About InfrAudit | Multi-Cloud Infrastructure Monitoring</title>
        <meta name="description" content="Learn about InfrAudit, a comprehensive multi-cloud infrastructure monitoring platform leveraging AI for intelligent insights and proactive anomaly detection." />
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-slate-950">
        {/* Hero Section */}
        <section className="relative py-24 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-100/50 to-transparent dark:from-blue-900/10" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
                About Us
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Building the future of
                <br />
                <span className="text-blue-600">cloud intelligence</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
                We're on a mission to give businesses complete visibility and control over their cloud environments—without the complexity.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-6 bg-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Cloud bills are rising, and teams struggle to understand why. We started InfrAudit to fix this problem—to help every company take control of their cloud spend and grow efficiently.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  Our AI-powered platform makes cloud complexity manageable with automated monitoring, intelligent recommendations, and a unified view of your entire cloud ecosystem.
                </p>
                <div className="flex items-center gap-4">
                  <Button asChild size="lg" className="rounded-full">
                    <Link href="/auth">
                      Get started free
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full">
                    <Link href="/contact">
                      Contact sales
                    </Link>
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white"
              >
                <Award className="w-12 h-12 mb-6 opacity-80" />
                <h3 className="text-2xl font-bold mb-4">
                  Join us as we build the future of cloud cost intelligence.
                </h3>
                <p className="text-blue-100 mb-8">
                  We're using modern technologies like TypeScript, Node.js, and AI to build a fast, scalable platform that helps engineering and finance teams stay in sync.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="text-3xl font-bold">32%</div>
                    <div className="text-blue-200 text-sm">Average savings</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                    <div className="text-3xl font-bold">10K+</div>
                    <div className="text-blue-200 text-sm">Resources tracked</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section className="py-24 px-6 bg-gray-50 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Solutions</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Everything you need to optimize, secure, and manage your cloud infrastructure.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {solutions.map((solution, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.color} flex items-center justify-center mb-6`}>
                    <solution.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{solution.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{solution.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                The principles that guide everything we build.
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6"
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <value.icon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 bg-gradient-to-br from-blue-600 to-indigo-700">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to optimize your cloud?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Start your free trial today. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-white hover:bg-gray-100 text-blue-700 rounded-full px-8 font-semibold">
                  <Link href="/auth">
                    Get started free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/30 hover:bg-white/10 text-white rounded-full px-8">
                  <Link href="/contact">
                    Talk to sales
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
