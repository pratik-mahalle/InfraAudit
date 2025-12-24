import React from "react";
import { Link } from "wouter";
import { Github, Twitter, Linkedin, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-950">
      {/* CTA Banner */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 md:p-12">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <h3 className="text-2xl md:text-3xl font-semibold text-white">
              Join Us in Defining the Next Era of Cloud
            </h3>
            <Button asChild size="lg" className="bg-white hover:bg-gray-100 text-blue-700 rounded-full px-8 font-semibold shadow-lg">
              <Link href="/auth">
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">InfrAudit</span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
              InfrAudit is your AI-powered cloud assistant, monitoring your infrastructure 24/7 to optimize costs and ensure security.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a 
                href="https://github.com/pratik-mahalle/InfraAudit" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Github className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {[
                { label: "Pricing", href: "/pricing" },
                { label: "About Us", href: "/about" },
                { label: "Contact Us", href: "/contact" },
                { label: "Careers", href: "/careers" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>
                    <span className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-semibold mb-4">Social</h4>
            <ul className="space-y-3">
              {[
                { label: "Twitter", href: "https://twitter.com" },
                { label: "GitHub", href: "https://github.com/pratik-mahalle/InfraAudit" },
                { label: "LinkedIn", href: "https://linkedin.com" },
              ].map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-3">
              {[
                { label: "Documentation", href: "/documentation" },
                { label: "Privacy policy", href: "/privacy" },
                { label: "Terms of service", href: "/terms" },
                { label: "API", href: "/api" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>
                    <span className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Large Brand Name */}
      <div className="relative overflow-hidden">
        <div className="flex items-center justify-center py-8">
          <h2 
            className="text-[6rem] md:text-[10rem] lg:text-[14rem] font-black tracking-tighter leading-none text-transparent select-none"
            style={{
              WebkitTextStroke: '2px rgba(71, 85, 105, 0.4)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            InfrAudit
          </h2>
        </div>
        
        {/* Copyright - centered over the large text */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-slate-500 text-sm">
            @infraudit.io - all rights reserved © {currentYear}
          </p>
        </div>
      </div>
    </footer>
  );
}
