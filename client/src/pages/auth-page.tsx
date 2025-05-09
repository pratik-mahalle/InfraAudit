import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Loader2, Shield } from "lucide-react";

// Extended schema for client-side validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: "user",
    },
  });

  // Redirect if already authenticated
  if (user) {
    return <Redirect to="/" />;
  }

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    // Remove confirmPassword since it's not in our API
    const { confirmPassword, ...userData } = values;
    registerMutation.mutate(userData);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row hero-gradient">
      {/* Left side - Auth forms */}
      <div className="lg:w-1/2 px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gray-900/70 border-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-10 w-10 text-gradient" />
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gradient">CloudGuard</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" className="bg-gray-800 border-gray-700" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-gray-800 border-gray-700" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full btn-gradient" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" className="bg-gray-800 border-gray-700" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" className="bg-gray-800 border-gray-700" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-gray-800 border-gray-700" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" className="bg-gray-800 border-gray-700" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full btn-gradient" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-center w-full text-muted-foreground">
              {activeTab === "login" ? (
                <p>
                  Don't have an account?{' '}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("register")}>
                    Sign up
                  </Button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <Button variant="link" className="p-0" onClick={() => setActiveTab("login")}>
                    Sign in
                  </Button>
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero section */}
      <div className="lg:w-1/2 p-12 hidden lg:flex flex-col justify-center bg-opacity-50">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-gradient">Powering AI With<br />The Best Infrastructure</h1>
          <p className="text-lg mb-8 text-gray-300">
            AI-powered cloud cost analysis and security alerts in just a few clicks.
            Complete infrastructure monitoring at scale.
          </p>
          <div className="space-y-6 mt-8">
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-md mr-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Security Drift Detection</h3>
                  <p className="text-sm text-gray-400">
                    Identify and resolve security configuration changes to maintain compliance.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-md mr-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Cost Optimization</h3>
                  <p className="text-sm text-gray-400">
                    Detect cost anomalies and get recommendations to optimize your cloud spend.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
              <div className="flex items-start">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-md mr-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-white">Resource Utilization</h3>
                  <p className="text-sm text-gray-400">
                    Track and optimize your cloud resources for maximum efficiency.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}