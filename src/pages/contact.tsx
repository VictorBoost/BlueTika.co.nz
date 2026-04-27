import { useState } from "react";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload screenshots to storage first if any
      const screenshotUrls: string[] = [];
      
      if (screenshots.length > 0) {
        const { supabase } = await import("@/integrations/supabase/client");
        
        for (const file of screenshots) {
          const fileName = `contact-${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from("evidence-photos")
            .upload(fileName, file);

          if (data) {
            const { data: urlData } = supabase.storage
              .from("evidence-photos")
              .getPublicUrl(fileName);
            screenshotUrls.push(urlData.publicUrl);
          }
        }
      }

      // Build email HTML
      const screenshotHtml = screenshotUrls.length > 0 
        ? `<div style="margin-top: 20px;"><strong>Screenshots:</strong><br/>${screenshotUrls.map(url => `<img src="${url}" style="max-width: 600px; margin: 10px 0;" />`).join('')}</div>`
        : '';

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1B4FD8; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #1B4FD8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Contact Form Submission</h1>
              <p style="margin: 5px 0; background: #FEF3C7; color: #333; padding: 5px 10px; border-radius: 3px; display: inline-block;">From: bluetika.co.nz</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div>${formData.name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div>${formData.email}</div>
              </div>
              <div class="field">
                <div class="label">Subject:</div>
                <div>${formData.subject}</div>
              </div>
              <div class="field">
                <div class="label">Message:</div>
                <div>${formData.message.replace(/\n/g, '<br/>')}</div>
              </div>
              ${screenshotHtml}
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email via SES
      const response = await fetch(process.env.NEXT_PUBLIC_SES_ENDPOINT || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "support@bluetika.co.nz",
          to: "support@bluetika.co.nz",
          subject: `[Contact Form - bluetika.co.nz] ${formData.subject}`,
          htmlBody: emailHtml,
          textBody: `Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\nMessage: ${formData.message}\n\nFrom: bluetika.co.nz`
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      // Send email to admin using SES
      const adminEmail = "support@bluetika.co.nz";
      const userEmail = formData.email;
      const userMessage = formData.message;
      const userName = formData.name;
      const userPhone = formData.phone || "Not provided";
      const userSubject = formData.subject;
      
      // Detect which domain the form was submitted from
      const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'bluetika.co.nz';
      const submissionSource = currentDomain.includes('.co.nz') ? 'bluetika.co.nz' : currentDomain;

      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          phone: userPhone,
          subject: userSubject,
          message: userMessage,
          domain: submissionSource,
        }),
      });

      toast({
        title: "Message sent!",
        description: "We'll get back to you within 24 hours.",
      });
      
      setFormData({ name: "", email: "", subject: "", message: "" });
      setScreenshots([]);
    } catch (error) {
      console.error("Contact form error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 3 - screenshots.length);
      setScreenshots(prev => [...prev, ...newFiles]);
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <SEO 
        title="Contact Us - BlueTika" 
        description="Get in touch with BlueTika support team"
      />
      <Navigation />
      
      <main className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
            <p className="text-lg text-muted-foreground">
              We&apos;re here to help. Send us a message and we&apos;ll respond within 24 hours.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and our team will get back to you soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your contact number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="What is your enquiry about?"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      e.g., &quot;Bug Report&quot;, &quot;Payment Issue&quot;, &quot;Feature Request&quot;
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="screenshots">Screenshots (Optional)</Label>
                    <div className="mt-2">
                      <label htmlFor="screenshots" className="cursor-pointer">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-primary transition-colors text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload screenshots (max 3)
                          </p>
                        </div>
                      </label>
                      <input
                        id="screenshots"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={screenshots.length >= 3}
                      />
                    </div>

                    {screenshots.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {screenshots.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm truncate flex-1">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeScreenshot(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>
                    Other ways to reach us
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">support@bluetika.co.nz</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">Coming soon</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        Proudly serving all of New Zealand
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Support Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Monday - Friday</span>
                    <span className="text-sm text-muted-foreground">9:00 AM - 6:00 PM NZST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Saturday</span>
                    <span className="text-sm text-muted-foreground">10:00 AM - 4:00 PM NZST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Sunday</span>
                    <span className="text-sm text-muted-foreground">Closed</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    * Email responses within 24 hours during business days
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-muted">
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/faq" className="block text-sm text-primary hover:underline">
                    Frequently Asked Questions
                  </Link>
                  <Link href="/terms" className="block text-sm text-primary hover:underline">
                    Terms of Service
                  </Link>
                  <Link href="/privacy" className="block text-sm text-primary hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/about" className="block text-sm text-primary hover:underline">
                    About BlueTika
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}