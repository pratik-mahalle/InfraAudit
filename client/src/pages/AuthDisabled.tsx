import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function AuthDisabled() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">This is not live yet</h1>
        <p className="text-muted-foreground mb-6">Authentication is under development. Please check back soon.</p>
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
      </div>
    </div>
  );
}

