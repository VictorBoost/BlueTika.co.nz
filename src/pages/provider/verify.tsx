import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { categoryService } from "@/services/categoryService";
import { verificationService } from "@/services/verificationService";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle, XCircle, Clock, AlertCircle, Plus, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

const CERTIFICATE_TYPES = [
  "Licensed Electrician ESC",
  "Gasfitter Licence PGD",
  "Plumber Registration PGD",
  "Licensed Building Practitioner LBP",
  "NZ Certificate in Cleaning",
  "Other Trade Certificate",
];

interface TradeCertificate {
  id?: string;
  certificate_type: string;
  certificate_number: string;
  document_url?: string;
  file?: File;
}

export default function ProviderVerification() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tradeCertificates, setTradeCertificates] = useState<TradeCertificate[]>([]);
  const [formData, setFormData] = useState({
    driver_licence_number: "",
    date_of_birth: "",
    driver_licence_file: null as File | null,
    driver_licence_url: "",
  });

  useEffect(() => {
    checkAuth();
    loadCategories();
  }, []);

  const checkAuth = async () => {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Load profile
    const { data: profileData } = await profileService.getProfile(session.user.id);
    if (profileData) {
      setProfile(profileData);
      setFormData({
        driver_licence_number: profileData.driver_licence_number || "",
        date_of_birth: profileData.date_of_birth || "",
        driver_licence_file: null,
        driver_licence_url: profileData.driver_licence_url || "",
      });

      // Load existing certificates
      const { data: certs } = await supabase
        .from("trade_certificates")
        .select("*")
        .eq("provider_id", session.user.id);
      
      if (certs) {
        setTradeCertificates(certs);
      }

      // Load selected categories
      const { data: providerCats } = await supabase
        .from("provider_categories")
        .select("category_id")
        .eq("provider_id", session.user.id);
      
      if (providerCats) {
        setSelectedCategories(providerCats.map(pc => pc.category_id));
      }
    }
  };

  const loadCategories = async () => {
    const { data } = await categoryService.getAllCategories();
    if (data) {
      setCategories(data);
    }
  };

  const handleDriverLicenceUpload = async (file: File) => {
    if (!profile) return;

    setUploading(true);
    
    try {
      const { data, error } = await verificationService.uploadDocument(
        file,
        profile.id,
        "driver_licence"
      );

      if (error) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        setUploading(false);
        return null;
      }

      // Show AI verification feedback
      if (data && (data as any).aiResult) {
        const aiResult = (data as any).aiResult;
        if (aiResult.autoApproved) {
          toast({
            title: "Document Auto-Approved! ✓",
            description: `AI verified your driver licence (${aiResult.confidence}% confidence). You can now submit bids!`,
            duration: 6000,
          });
        } else {
          toast({
            title: "Document Received",
            description: `AI confidence: ${aiResult.confidence}%. Your document is queued for manual review.`,
            duration: 5000,
          });
        }
      }

      setUploading(false);
      return data?.file_url;
    } catch (err) {
      setUploading(false);
      toast({
        title: "Upload error",
        description: "Failed to upload document",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleCertificateUpload = async (file: File, index: number) => {
    if (!profile) return;

    setUploading(true);
    
    try {
      const { data, error } = await verificationService.uploadDocument(
        file,
        profile.id,
        "trade_certificate"
      );

      if (error) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        setUploading(false);
        return null;
      }

      // Show AI verification feedback
      if (data && (data as any).aiResult) {
        const aiResult = (data as any).aiResult;
        if (aiResult.autoApproved) {
          toast({
            title: "Certificate Auto-Approved! ✓",
            description: `AI verified your trade certificate (${aiResult.confidence}% confidence).`,
            duration: 6000,
          });
        } else {
          toast({
            title: "Certificate Received",
            description: `AI confidence: ${aiResult.confidence}%. Queued for manual review.`,
            duration: 5000,
          });
        }
      }

      setUploading(false);
      return data?.file_url;
    } catch (err) {
      setUploading(false);
      toast({
        title: "Upload error",
        description: "Failed to upload certificate",
        variant: "destructive",
      });
      return null;
    }
  };

  const addCertificate = () => {
    setTradeCertificates([
      ...tradeCertificates,
      { certificate_type: "", certificate_number: "", file: undefined },
    ]);
  };

  const removeCertificate = async (index: number) => {
    const cert = tradeCertificates[index];
    if (cert.id) {
      await supabase.from("trade_certificates").delete().eq("id", cert.id);
    }
    setTradeCertificates(tradeCertificates.filter((_, i) => i !== index));
  };

  const updateCertificate = (index: number, field: string, value: any) => {
    const updated = [...tradeCertificates];
    updated[index] = { ...updated[index], [field]: value };
    setTradeCertificates(updated);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const session = await authService.getCurrentSession();
    if (!session?.user) {
      toast({
        title: "Authentication required",
        description: "Please log in to continue",
        variant: "destructive",
      });
      return;
    }

    if (selectedCategories.length === 0) {
      toast({
        title: "Categories required",
        description: "Please select at least one service category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload driver licence if new file
      let driverLicenceUrl = formData.driver_licence_url;
      if (formData.driver_licence_file) {
        const url = await handleDriverLicenceUpload(formData.driver_licence_file);
        if (!url) {
          setLoading(false);
          return;
        }
        driverLicenceUrl = url;
      }

      // Upload trade certificates
      for (let i = 0; i < tradeCertificates.length; i++) {
        const cert = tradeCertificates[i];
        if (cert.file) {
          const url = await handleCertificateUpload(cert.file, i);
          if (!url) {
            setLoading(false);
            return;
          }
          
          if (cert.id) {
            await supabase
              .from("trade_certificates")
              .update({ document_url: url })
              .eq("id", cert.id);
          } else {
            await supabase.from("trade_certificates").insert({
              provider_id: session.user.id,
              certificate_type: cert.certificate_type,
              certificate_number: cert.certificate_number,
              document_url: url,
            });
          }
        } else if (!cert.id && cert.certificate_type && cert.certificate_number) {
          toast({
            title: "File required",
            description: "Please upload a file for each certificate",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          driver_licence_number: formData.driver_licence_number,
          date_of_birth: formData.date_of_birth,
          driver_licence_url: driverLicenceUrl,
          verification_submitted_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Update categories
      await supabase
        .from("provider_categories")
        .delete()
        .eq("provider_id", session.user.id);

      const categoryInserts = selectedCategories.map(categoryId => ({
        provider_id: session.user.id,
        category_id: categoryId,
      }));

      const { error: categoriesError } = await supabase
        .from("provider_categories")
        .insert(categoryInserts);

      if (categoriesError) {
        toast({
          title: "Error",
          description: "Failed to update categories",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Success",
        description: "Verification submitted! Check your email for AI verification results.",
        duration: 6000,
      });

      router.push("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const getStatusBadge = () => {
    if (!profile) return null;

    const status = profile.verification_status || "pending";
    
    if (status === "approved") {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="h-4 w-4 mr-1" />
          Verified
        </Badge>
      );
    } else if (status === "rejected") {
      return (
        <Badge variant="destructive">
          <XCircle className="h-4 w-4 mr-1" />
          Rejected
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          <Clock className="h-4 w-4 mr-1" />
          Pending Review
        </Badge>
      );
    }
  };

  return (
    <>
      <SEO 
        title="Service Provider Verification - BlueTika"
        description="Complete your verification to start accepting projects"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-white">
          <div className="container py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              BlueTika
            </Link>
            <Button variant="ghost" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Service Provider Verification</h1>
                <p className="text-muted-foreground">
                  Complete these steps to verify your account and start accepting projects
                </p>
              </div>
              {profile && getStatusBadge()}
            </div>

            {profile?.verification_status === "rejected" && profile.verification_rejection_reason && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Verification rejected:</strong> {profile.verification_rejection_reason}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Driver Licence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Step 1: NZ Driver Licence
                    <Badge variant="outline">Required</Badge>
                  </CardTitle>
                  <CardDescription>
                    Upload a clear photo of the front of your current New Zealand Driver Licence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="licence_number">Driver Licence Number *</Label>
                      <Input
                        id="licence_number"
                        value={formData.driver_licence_number}
                        onChange={(e) => setFormData({ ...formData, driver_licence_number: e.target.value })}
                        placeholder="XX000000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driver_licence">Upload Driver Licence Photo *</Label>
                    <Input
                      id="driver_licence"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast({
                              title: "File too large",
                              description: "Maximum file size is 10MB",
                              variant: "destructive",
                            });
                            return;
                          }
                          setFormData({ ...formData, driver_licence_file: file });
                        }
                      }}
                      required={!formData.driver_licence_url}
                    />
                    <p className="text-sm text-muted-foreground">
                      JPG, PNG, or PDF. Max 10MB. Must be clear and readable.
                    </p>
                    {formData.driver_licence_url && (
                      <p className="text-sm text-success flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Driver licence already uploaded
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Trade Certificates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Step 2: Trade Certificates
                    <Badge variant="secondary">Optional but Recommended</Badge>
                  </CardTitle>
                  <CardDescription>
                    Upload any relevant trade qualifications to increase client trust
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tradeCertificates.map((cert, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Certificate {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCertificate(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Certificate Type</Label>
                          <Select
                            value={cert.certificate_type}
                            onValueChange={(value) => updateCertificate(index, "certificate_type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {CERTIFICATE_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Certificate Number</Label>
                          <Input
                            value={cert.certificate_number}
                            onChange={(e) => updateCertificate(index, "certificate_number", e.target.value)}
                            placeholder="e.g., ESC12345"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Upload Certificate</Label>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                toast({
                                  title: "File too large",
                                  description: "Maximum file size is 10MB",
                                  variant: "destructive",
                                });
                                return;
                              }
                              updateCertificate(index, "file", file);
                            }
                          }}
                        />
                        {cert.document_url && (
                          <p className="text-sm text-success flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            Certificate uploaded
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCertificate}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certificate
                  </Button>
                </CardContent>
              </Card>

              {/* Step 3: Service Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Step 3: Service Categories
                    <Badge variant="outline">Required</Badge>
                  </CardTitle>
                  <CardDescription>
                    Select the categories you can provide services for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <Checkbox
                          id={`cat-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <Label
                          htmlFor={`cat-${category.id}`}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading || uploading}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-pulse" />
                      Uploading files...
                    </>
                  ) : loading ? (
                    "Submitting..."
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/")}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}