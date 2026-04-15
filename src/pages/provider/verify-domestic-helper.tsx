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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { verificationService } from "@/services/verificationService";
import { subcategoryService } from "@/services/subcategoryService";
import { FileUp, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";

export default function VerifyDomesticHelper() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  const [newReference, setNewReference] = useState({
    full_name: "",
    relationship: "",
    phone_number: "",
  });

  const [files, setFiles] = useState({
    police_check: null as File | null,
    first_aid: null as File | null,
  });

  useEffect(() => {
    checkAuth();
    loadSubcategories();
  }, []);

  useEffect(() => {
    if (userId && selectedSubcategory) {
      loadVerificationData();
    }
  }, [userId, selectedSubcategory]);

  const checkAuth = async () => {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      router.push("/login");
    } else {
      setUserId(session.user.id);
    }
  };

  const loadSubcategories = async () => {
    // Get domestic-helper category
    const { data: categories } = await import("@/services/categoryService").then(m => m.categoryService.getAllCategories());
    const domesticHelper = categories?.find(c => c.slug === "domestic-helper");
    
    if (domesticHelper) {
      const { data } = await subcategoryService.getSubcategoriesByCategory(domesticHelper.id);
      if (data) {
        setSubcategories(data);
      }
    }
  };

  const loadVerificationData = async () => {
    if (!userId) return;

    const { data: docs } = await verificationService.getProviderDocuments(userId, selectedSubcategory);
    if (docs) {
      setDocuments(docs);
    }

    const { data: refs } = await verificationService.getProviderReferences(userId, selectedSubcategory);
    if (refs) {
      setReferences(refs);
    }
  };

  const getRequirements = () => {
    const selected = subcategories.find(s => s.id === selectedSubcategory);
    if (!selected) return { policeCheck: true, firstAid: false, minReferences: 0 };

    return {
      policeCheck: true,
      firstAid: selected.slug === "nanny" || selected.slug === "babysitter",
      minReferences: selected.slug === "pet-care" ? 1 : 2,
    };
  };

  const handleFileChange = (type: "police_check" | "first_aid", e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFiles({ ...files, [type]: e.target.files[0] });
    }
  };

  const handleUploadDocument = async (type: "police_check" | "first_aid") => {
    if (!files[type] || !userId || !selectedSubcategory) return;

    setLoading(true);
    const { data, error } = await verificationService.uploadDocument(
      files[type]!,
      userId,
      type,
      subcategories.find(s => s.id === selectedSubcategory)?.category_id,
      selectedSubcategory
    );

    if (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Document uploaded successfully!",
      });
      setFiles({ ...files, [type]: null });
      loadVerificationData();
    }
    setLoading(false);
  };

  const handleAddReference = async () => {
    if (!newReference.full_name || !newReference.relationship || !newReference.phone_number) {
      toast({
        title: "Missing fields",
        description: "Please fill in all reference fields",
        variant: "destructive",
      });
      return;
    }

    if (!userId || !selectedSubcategory) return;

    setLoading(true);
    const { data, error } = await verificationService.addReference(
      userId,
      selectedSubcategory,
      newReference
    );

    if (error) {
      toast({
        title: "Failed to add reference",
        description: "Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Reference added",
        description: "Reference contact saved successfully",
      });
      setNewReference({ full_name: "", relationship: "", phone_number: "" });
      loadVerificationData();
    }
    setLoading(false);
  };

  const requirements = getRequirements();
  const policeCheckDoc = documents.find(d => d.document_type === "police_check");
  const firstAidDoc = documents.find(d => d.document_type === "first_aid");

  return (
    <>
      <SEO 
        title="Domestic Helper Verification - BlueTika"
        description="Complete your Domestic Helper service provider verification"
      />
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b bg-white">
          <div className="container py-4 flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-primary">
              BlueTika
            </Link>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link href="/projects">Browse Projects</Link>
              </Button>
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Domestic Helper Verification</h1>
              <p className="text-muted-foreground">
                Complete additional verification to accept Domestic Helper projects
              </p>
            </div>

            <Alert className="mb-6 border-accent">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All Domestic Helper service providers must complete enhanced verification including NZ Police Check, 
                First Aid Certificate (for Nanny/Babysitter), and professional references. Your reference contact 
                details will only be shared with clients you have active contracts with.
              </AlertDescription>
            </Alert>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Service Category</CardTitle>
                <CardDescription>Choose which Domestic Helper service you want to offer</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedSubcategory} onValueChange={setSelectedSubcategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedSubcategory && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Required Documents</CardTitle>
                    <CardDescription>Upload verification documents</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* NZ Police Check */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <Label className="text-base">NZ Police Check *</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Official police vetting document (required for all Domestic Helper services)
                          </p>
                        </div>
                        {policeCheckDoc && (
                          <Badge variant={policeCheckDoc.status === "approved" ? "default" : "secondary"}>
                            {policeCheckDoc.status}
                          </Badge>
                        )}
                      </div>
                      {!policeCheckDoc && (
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange("police_check", e)}
                          />
                          <Button
                            onClick={() => handleUploadDocument("police_check")}
                            disabled={!files.police_check || loading}
                          >
                            <FileUp className="h-4 w-4 mr-2" />
                            Upload
                          </Button>
                        </div>
                      )}
                      {policeCheckDoc && policeCheckDoc.status === "approved" && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Verified</span>
                        </div>
                      )}
                    </div>

                    {/* First Aid Certificate */}
                    {requirements.firstAid && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Label className="text-base">Comprehensive First Aid Certificate *</Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              Current first aid certification (required for Nanny and Babysitter)
                            </p>
                          </div>
                          {firstAidDoc && (
                            <Badge variant={firstAidDoc.status === "approved" ? "default" : "secondary"}>
                              {firstAidDoc.status}
                            </Badge>
                          )}
                        </div>
                        {!firstAidDoc && (
                          <div className="flex gap-2">
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileChange("first_aid", e)}
                            />
                            <Button
                              onClick={() => handleUploadDocument("first_aid")}
                              disabled={!files.first_aid || loading}
                            >
                              <FileUp className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        )}
                        {firstAidDoc && firstAidDoc.status === "approved" && (
                          <div className="flex items-center gap-2 text-success">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Verified</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Professional References</CardTitle>
                    <CardDescription>
                      Minimum {requirements.minReferences} reference{requirements.minReferences > 1 ? "s" : ""} required. 
                      Contact details are private and only shared with clients you have active contracts with.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {references.length > 0 && (
                      <div className="space-y-3">
                        {references.map((ref) => (
                          <Card key={ref.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">{ref.full_name}</p>
                                  <p className="text-sm text-muted-foreground">{ref.relationship}</p>
                                  <p className="text-sm text-muted-foreground">Phone: {ref.phone_number}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">Private</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {references.length < 5 && (
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-medium">Add Reference</h4>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                              value={newReference.full_name}
                              onChange={(e) => setNewReference({ ...newReference, full_name: e.target.value })}
                              placeholder="e.g., Sarah Johnson"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Relationship *</Label>
                            <Input
                              value={newReference.relationship}
                              onChange={(e) => setNewReference({ ...newReference, relationship: e.target.value })}
                              placeholder="e.g., Previous employer"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone Number *</Label>
                            <Input
                              value={newReference.phone_number}
                              onChange={(e) => setNewReference({ ...newReference, phone_number: e.target.value })}
                              placeholder="e.g., 021 123 4567"
                            />
                          </div>
                          <Button onClick={handleAddReference} disabled={loading}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Reference
                          </Button>
                        </div>
                      </div>
                    )}

                    {references.length >= requirements.minReferences && (
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Minimum references met</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}