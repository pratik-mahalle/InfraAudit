import React from "react";
import { Link } from "wouter";
import { Shield, Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background py-10">
      <div className="container grid gap-8 px-4 md:px-6 lg:grid-cols-4 max-w-6xl mx-auto">
        <div className="space-y-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                InfraAudit
              </span>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs">
            A multi-cloud infrastructure monitoring platform that leverages AI to detect cost anomalies and security configuration drifts.
          </p>
          <div className="flex gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </a>
            <a href="mailto:contact@infraaudit.com" className="text-muted-foreground hover:text-foreground">
              <Mail className="h-5 w-5" />
              <span className="sr-only">Email</span>
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium">Platform</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/dashboard">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Dashboard
                </div>
              </Link>
            </li>
            <li>
              <Link href="/cost-optimization">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Cost Optimization
                </div>
              </Link>
            </li>
            <li>
              <Link href="/security-monitoring">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Security Monitoring
                </div>
              </Link>
            </li>
            <li>
              <Link href="/alerts">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Alerts
                </div>
              </Link>
            </li>
            <li>
              <Link href="/cloud-providers">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Cloud Providers
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/documentation">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Documentation
                </div>
              </Link>
            </li>
            <li>
              <Link href="/guides">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Guides
                </div>
              </Link>
            </li>
            <li>
              <Link href="/api">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  API
                </div>
              </Link>
            </li>
            <li>
              <Link href="/blog">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Blog
                </div>
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  About
                </div>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Contact
                </div>
              </Link>
            </li>
            <li>
              <Link href="/privacy">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Privacy Policy
                </div>
              </Link>
            </li>
            <li>
              <Link href="/terms">
                <div className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Terms of Service
                </div>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container max-w-6xl mx-auto flex flex-col items-center justify-center gap-4 border-t border-border/40 py-6 mt-6 md:flex-row px-4 md:px-6">
        <p className="text-xs text-muted-foreground text-center md:text-left">
          &copy; {currentYear} InfraAudit. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="/privacy">
            <div className="hover:text-foreground transition-colors cursor-pointer">
              Privacy
            </div>
          </Link>
          <Link href="/terms">
            <div className="hover:text-foreground transition-colors cursor-pointer">
              Terms
            </div>
          </Link>
          <Link href="/cookies">
            <div className="hover:text-foreground transition-colors cursor-pointer">
              Cookies
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          Made with <Heart className="h-3 w-3 text-red-500" /> by{" "}
          <a 
            href="https://github.com/thedevopsguy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            thedevopsguy
          </a>
        </div>
      </div>
    </footer>
  );
}