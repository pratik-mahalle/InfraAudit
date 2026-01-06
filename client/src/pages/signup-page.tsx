import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link } from "wouter";
import { Loader2, Cloud, AlertCircle } from "lucide-react";

// OAuth Icons
const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
);

const GitHubIcon = () => (
    <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
);

const handleOAuthLogin = (provider: 'google' | 'github') => {
    const envBase = (import.meta as any).env?.VITE_OAUTH_BACKEND_BASE || (import.meta as any).env?.VITE_API_BASE_URL;
    const base = envBase && typeof envBase === 'string' && envBase.length > 0 ? envBase : 'http://localhost:8080';
    window.location.assign(new URL(`/api/auth/${provider}`, base).toString());
};

export default function SignupPage() {
    const { user, registerMutation } = useAuth();
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");

    if (user) {
        return <Redirect to="/dashboard" />;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError("");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        registerMutation.mutate({
            email: formData.email,
            password: formData.password,
            username: formData.username,
            fullName: formData.fullName,
            role: "user",
        });
    };

    const hasError = error || registerMutation.isError;

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-12 flex-col justify-between relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

                {/* Logo */}
                <div className="relative z-10">
                    <Link href="/">
                        <div className="flex items-center gap-2.5 cursor-pointer">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <Cloud className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-white">InfrAudit</span>
                        </div>
                    </Link>
                </div>

                {/* Main content */}
                <div className="relative z-10 space-y-8">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                            Smarter Cloud
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                Infrastructure
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                            Monitor costs, detect security drifts, and optimize your cloud with AI-powered insights.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Cost Optimization</p>
                                <p className="text-slate-500 text-sm">Save up to 35% on cloud costs</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">Security Monitoring</p>
                                <p className="text-slate-500 text-sm">Real-time drift detection</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-white font-medium">AI Insights</p>
                                <p className="text-slate-500 text-sm">Smart recommendations</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8 pt-4">
                        <div>
                            <p className="text-3xl font-bold text-white">35%</p>
                            <p className="text-slate-500 text-sm">Avg. savings</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">10K+</p>
                            <p className="text-slate-500 text-sm">Resources</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">99.9%</p>
                            <p className="text-slate-500 text-sm">Uptime</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-slate-600 text-sm">
                    © 2024 InfrAudit. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Sign Up */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-sm">
                    {/* Mobile Logo */}
                    <Link href="/">
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-8 cursor-pointer">
                            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                <Cloud className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-xl font-semibold">InfrAudit</span>
                        </div>
                    </Link>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Sign up
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Get started for free. No credit card required.
                    </p>

                    {!showEmailForm ? (
                        <>
                            {/* OAuth Buttons */}
                            <div className="space-y-3 mb-6">
                                <Button
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() => handleOAuthLogin('google')}
                                >
                                    <GoogleIcon />
                                    <span className="ml-3">Continue with Google</span>
                                </Button>
                                <Button
                                    className="w-full h-11 bg-slate-800 hover:bg-slate-700 text-white"
                                    onClick={() => handleOAuthLogin('github')}
                                >
                                    <GitHubIcon />
                                    <span className="ml-3">Continue with GitHub</span>
                                </Button>
                            </div>

                            {/* Divider */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-3 text-sm text-gray-500 bg-white dark:bg-slate-950">OR</span>
                                </div>
                            </div>

                            {/* Email Button */}
                            <Button
                                variant="outline"
                                className="w-full h-11 text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                onClick={() => setShowEmailForm(true)}
                            >
                                Sign up with Email
                            </Button>

                            {/* Sign In Link */}
                            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                                Already have an account?{" "}
                                <Link href="/auth" className="font-medium text-blue-600 hover:text-blue-500">
                                    Sign in
                                </Link>
                            </p>
                        </>
                    ) : (
                        <>
                            {/* Email Form */}
                            {hasError && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {error || "Registration failed. Please try again."}
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="username">Username</Label>
                                    <Input
                                        id="username"
                                        name="username"
                                        placeholder="johndoe"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        placeholder="John Doe"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                        className="mt-1"
                                    />
                                </div>

                                <Button type="submit" className="w-full h-11" disabled={registerMutation.isPending}>
                                    {registerMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        "Create account"
                                    )}
                                </Button>
                            </form>

                            <button
                                type="button"
                                onClick={() => setShowEmailForm(false)}
                                className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                ← Back to other options
                            </button>
                        </>
                    )}

                    {/* Terms */}
                    <p className="mt-8 text-center text-xs text-gray-500">
                        By signing up, you agree to our{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
                        {" "}and{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline">Terms of Use</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
