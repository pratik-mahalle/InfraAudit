import React from 'react';
import { Helmet } from 'react-helmet';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ContactPage() {
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // This would be connected to a real API endpoint in production
    toast({
      title: "Message sent!",
      description: "Thank you for reaching out. We'll get back to you soon.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | InfraAudit</title>
        <meta name="description" content="Get in touch with the InfraAudit team for questions about our multi-cloud infrastructure monitoring platform, sales inquiries, or support requests." />
      </Helmet>

      <div className="container max-w-6xl mx-auto py-12 px-4 md:px-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about InfraAudit? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Contact Methods Cards */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Email Us</h3>
                <p className="text-muted-foreground mb-4">
                  For general inquiries and questions
                </p>
                <a 
                  href="mailto:info@infraaudit.com" 
                  className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 font-medium"
                >
                  info@infraaudit.com
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Call Us</h3>
                <p className="text-muted-foreground mb-4">
                  Monday to Friday, 9am to 5pm PST
                </p>
                <a 
                  href="tel:+18005551234" 
                  className="text-green-600 hover:text-green-800 dark:hover:text-green-400 font-medium"
                >
                  +1 (800) 555-1234
                </a>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Visit Us</h3>
                <p className="text-muted-foreground mb-4">
                  Our headquarters location
                </p>
                <p className="text-purple-600 hover:text-purple-800 dark:hover:text-purple-400 font-medium">
                  350 California St, San Francisco, CA 94104
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-6">Get in Touch</h2>
            <p className="text-muted-foreground mb-8">
              Fill out the form below and our team will get back to you within 24 hours. We're here to answer any questions
              you might have about our platform, pricing, or features.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-muted-foreground mr-3" />
                <span>sales@infraaudit.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-muted-foreground mr-3" />
                <span>+1 (800) 555-1234</span>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-muted-foreground mr-3 mt-0.5" />
                <span>350 California St,<br />San Francisco, CA 94104</span>
              </div>
            </div>
          </div>
          
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input id="name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </label>
                  <Input id="email" type="email" placeholder="john@example.com" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="company" className="text-sm font-medium">
                  Company Name
                </label>
                <Input id="company" placeholder="Acme Inc." />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input id="subject" placeholder="How can we help you?" required />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your inquiry..."
                  rows={5}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}