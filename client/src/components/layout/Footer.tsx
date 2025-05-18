import React from "react";
import { useLocation } from "wouter";
import { Shield, Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [_, navigate] = useLocation();

  return (
    <footer className="w-full border-t border-border/40 bg-background py-10">
      <div className="container grid gap-8 px-4 md:px-6 lg:grid-cols-4 max-w-6xl mx-auto">
        <div className="space-y-4">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              InfraAudit
            </span>
          </div>
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
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                Dashboard
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/cost-optimization")}
              >
                Cost Optimization
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/security-monitoring")}
              >
                Security Monitoring
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/alerts")}
              >
                Alerts
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/cloud-providers")}
              >
                Cloud Providers
              </div>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium">Resources</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/documentation")}
              >
                Documentation
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/guides")}
              >
                Guides
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/api")}
              >
                API
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/blog")}
              >
                Blog
              </div>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium">Company</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/about")}
              >
                About
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/contact")}
              >
                Contact
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/privacy")}
              >
                Privacy Policy
              </div>
            </li>
            <li>
              <div 
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                onClick={() => navigate("/terms")}
              >
                Terms of Service
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div className="container max-w-6xl mx-auto flex flex-col items-center justify-center gap-4 border-t border-border/40 py-6 mt-6 md:flex-row px-4 md:px-6">
        <p className="text-xs text-muted-foreground text-center md:text-left">
          &copy; {currentYear} InfraAudit. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div 
            className="hover:text-foreground transition-colors cursor-pointer"
            onClick={() => navigate("/privacy")}
          >
            Privacy
          </div>
          <div 
            className="hover:text-foreground transition-colors cursor-pointer"
            onClick={() => navigate("/terms")}
          >
            Terms
          </div>
          <div 
            className="hover:text-foreground transition-colors cursor-pointer"
            onClick={() => navigate("/cookies")}
          >
            Cookies
          </div>
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