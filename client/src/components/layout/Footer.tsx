import React from "react";
import { Link } from "wouter";
import { Shield, Github, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/40 bg-background py-10">
      <div className="container grid gap-8 px-4 md:px-6 lg:grid-cols-4">
        <div className="space-y-4">
          <Link href="/">
            <a className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CloudGuard
              </span>
            </a>
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
            <a href="mailto:contact@cloudguard.com" className="text-muted-foreground hover:text-foreground">
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
                <a className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a>
              </Link>
            </li>
            <li>
              <Link href="/cost-optimization">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Cost Optimization</a>
              </Link>
            </li>
            <li>
              <Link href="/security-monitoring">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Security Monitoring</a>
              </Link>
            </li>
            <li>
              <Link href="/alerts">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Alerts</a>
              </Link>
            </li>
            <li>
              <Link href="/cloud-providers">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Cloud Providers</a>
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/documentation">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              </Link>
            </li>
            <li>
              <Link href="/guides">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Guides</a>
              </Link>
            </li>
            <li>
              <Link href="/api">
                <a className="text-muted-foreground hover:text-foreground transition-colors">API</a>
              </Link>
            </li>
            <li>
              <Link href="/blog">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Blog</a>
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about">
                <a className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              </Link>
            </li>
            <li>
              <Link href="/contact">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              </Link>
            </li>
            <li>
              <Link href="/privacy">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              </Link>
            </li>
            <li>
              <Link href="/terms">
                <a className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="container flex flex-col items-center justify-between gap-4 border-t border-border/40 py-6 mt-6 md:flex-row px-4 md:px-6">
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} CloudGuard. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link href="/privacy">
            <a className="hover:text-foreground transition-colors">Privacy</a>
          </Link>
          <Link href="/terms">
            <a className="hover:text-foreground transition-colors">Terms</a>
          </Link>
          <Link href="/cookies">
            <a className="hover:text-foreground transition-colors">Cookies</a>
          </Link>
        </div>
      </div>
    </footer>
  );
}