import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { projectService } from "@/services/projectService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Upload, X, Video, Calendar } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { SafetyBanner } from "@/components/SafetyBanner";
import { contentSafetyService } from "@/services/contentSafetyService";

const NZ_LOCATIONS = [
  "Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga",
  "Dunedin", "Palmerston North", "Napier-Hastings", "Nelson", "Rotorua",
  "New Plymouth", "Whangarei", "Other NZ"
];

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEO_DURATION = 30; // seconds

const CATEGORY_EXAMPLES: Record<string, { title: string; description: string }> = {
  "cleaning": {
    title: "End of tenancy clean in Auckland 3 bedroom",
    description: "Need a thorough end of tenancy clean for a 3 bedroom house in Mt Eden. Includes kitchen deep clean, bathroom scrubbing, carpet vacuum, window cleaning inside, and general dusting."
  },
  "movers": {
    title: "Moving a 2 bedroom flat from Ponsonby to Newmarket",
    description: "Need help moving furniture and boxes from a 2 bedroom flat. We have packed most items. Main items include queen bed, sofa, dining table with 4 chairs, and approximately 20 boxes."
  },
  "plumbers-and-gas": {
    title: "Fix leaking tap in kitchen Christchurch",
    description: "Kitchen tap has been dripping for a week. Appears to need new washer or cartridge replacement. Need someone who can come assess and fix promptly."
  },
  "landscaping": {
    title: "Lawn mowing and hedge trim fortnightly Wellington",
    description: "Looking for regular lawn mowing and hedge trimming service. Medium-sized section with hedges along fence line. Prefer fortnightly schedule starting next month."
  },
  "painting": {
    title: "Interior painting 2 bedroom unit Hamilton",
    description: "Need interior walls painted in a 2 bedroom unit. Walls are currently white, want to repaint in off-white. Includes lounge, 2 bedrooms, hallway. Ceilings not included."
  },
  "electrical": {
    title: "Install 4 downlights living room Auckland",
    description: "Want to install 4 LED downlights in living room ceiling. Ceiling is plasterboard with access from roof cavity. Prefer white LED downlights with warm white tone."
  },
  "handyman": {
    title: "Assemble IKEA furniture 3 items Tauranga",
    description: "Need help assembling 3 pieces of IKEA furniture: 1 wardrobe, 1 chest of drawers, and 1 bookshelf. All items are still in boxes with instructions included."
  },
  "domestic-helper": {
    title: "Weekly nanny needed 3 days Auckland",
    description: "Looking for experienced nanny for our 2 children (ages 3 and 5). Need someone Monday, Wednesday, Friday from 8am-4pm. Light meal prep and help with homework for the older child."
  }
};

export default function PostProject() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Tables<"categories">[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [isDomesticHelper, setIsDomesticHelper] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [routineEnabled, setRoutineEnabled] = useState(false);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    location: "",
    category_id: "",
    subcategory_id: "",
    booking_type: "one_time",
    selected_days: [] as string[],
    start_date: "",
    weeks_count: 1,
    routine_frequency: "weekly",
    routine_custom_days: 7,
    routine_start_date: "",
    date_preference: "asap_flexible",
    date_from: "",
    date_to: "",
    specific_date: "",
  });

  useEffect(() => {
    checkVerification();
    loadCategories();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      const categorySlug = selectedCategory?.slug || "";
      setSelectedCategorySlug(categorySlug);
      setIsDomesticHelper(categorySlug === "domestic-helper");
      
      // Update placeholder text when category changes
      if (categorySlug && CATEGORY_EXAMPLES[categorySlug]) {
        setFormData(prev => ({
          ...prev,
          title: "",
          description: ""
        }));
      }
      
      if (categorySlug === "domestic-helper") {
        loadSubcategories(formData.category_id);
        setRoutineEnabled(true);
      } else {
        setSubcategories([]);
        setFormData(prev => ({ ...prev, subcategory_id: "", booking_type: "one_time" }));
      }
    }
  }, [formData.category_id, categories]);

  const checkVerification = async () => {
    try {
      // Use session API to check if user is logged in
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
      });

      if (response.status === 401 || !response.ok) {
        // Not logged in
        toast({
          title: "Authentication required",
          description: "Please log in to post a project",
          variant: "destructive",
        });
        router.push("/login?redirect=/post-project");
        return;
      }

      const { user } = await response.json();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to post a project",
          variant: "destructive",
        });
        router.push("/login?redirect=/post-project");
        return;
      }

      // Check if user is a client
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_client")
        .eq("id", user.id)
        .single();

      if (!profile?.is_client) {
        toast({
          title: "Access denied",
          description: "Only clients can post projects. Please register as a client.",
          variant: "destructive",
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Authentication required",
        description: "Please log in to post a project",
        variant: "destructive",
      });
      router.push("/login?redirect=/post-project");
    }
  };

  const loadCategories = async () => {
    const { data } = await categoryService.getAllCategories();
    if (data) {
      setCategories(data);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    const { data } = await subcategoryService.getSubcategoriesByCategory(categoryId);
    if (data) {
      setSubcategories(data);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      selected_days: prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day]
    }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (photoFiles.length + files.length > MAX_PHOTOS) {
      toast({
        title: "Too many photos",
        description: `You can only upload up to ${MAX_PHOTOS} photos`,
        variant: "destructive",
      });
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > MAX_PHOTO_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return false;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} must be JPG or PNG`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setPhotoFiles(prev => [...prev, ...validFiles]);
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE) {
      toast({
        title: "Video too large",
        description: "Video must be under 50MB",
        variant: "destructive",
      });
      return;
    }

    if (file.type !== 'video/mp4') {
      toast({
        title: "Invalid file type",
        description: "Video must be MP4 format",
        variant: "destructive",
      });
      return;
    }

    // Check video duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > MAX_VIDEO_DURATION) {
        toast({
          title: "Video too long",
          description: `Video must be ${MAX_VIDEO_DURATION} seconds or less`,
          variant: "destructive",
        });
      } else {
        setVideoFile(file);
      }
    };

    video.src = URL.createObjectURL(file);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideoFile(null);
  };

  const uploadMedia = async (userId: string) => {
    const photoUrls: string[] = [];
    let videoUrl: string | null = null;

    // Upload photos
    for (let i = 0; i < photoFiles.length; i++) {
      const file = photoFiles[i];
      const fileName = `${userId}/${Date.now()}_${i}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('project-media')
        .upload(fileName, file);

      if (error) {
        console.error('Photo upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('project-media')
        .getPublicUrl(fileName);
      
      photoUrls.push(publicUrl);
    }

    // Upload video
    if (videoFile) {
      const fileName = `${userId}/${Date.now()}_video_${videoFile.name}`;
      
      const { data, error } = await supabase.storage
        .from('project-media')
        .upload(fileName, videoFile);

      if (error) {
        console.error('Video upload error:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('project-media')
        .getPublicUrl(fileName);
      
      videoUrl = publicUrl;
    }

    return { photoUrls, videoUrl };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use session API to get current user
    const sessionResponse = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
    });

    if (!sessionResponse.ok) {
      toast({
        title: "Authentication required",
        description: "Please log in to post a project",
        variant: "destructive",
      });
      router.push("/login?redirect=/post-project");
      return;
    }

    const { user } = await sessionResponse.json();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to post a project",
        variant: "destructive",
      });
      router.push("/login?redirect=/post-project");
      return;
    }

    if (isDomesticHelper && !formData.subcategory_id) {
      toast({
        title: "Subcategory required",
        description: "Please select a Domestic Helper subcategory",
        variant: "destructive",
      });
      return;
    }

    if (formData.booking_type === "routine") {
      if (formData.selected_days.length === 0) {
        toast({
          title: "Days required",
          description: "Please select at least one day of the week",
          variant: "destructive",
        });
        return;
      }
      if (!formData.start_date) {
        toast({
          title: "Start date required",
          description: "Please select a start date",
          variant: "destructive",
        });
        return;
      }
      if (formData.weeks_count < 1 || formData.weeks_count > 8) {
        toast({
          title: "Invalid weeks count",
          description: "Please select between 1 and 8 weeks",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate routine scheduling for non-Domestic Helper categories
    if (routineEnabled && !isDomesticHelper) {
      if (!formData.routine_start_date) {
        toast({
          title: "Start date required",
          description: "Please select a start date for routine scheduling",
          variant: "destructive",
        });
        return;
      }
      if (formData.routine_frequency === "custom" && formData.routine_custom_days < 1) {
        toast({
          title: "Invalid frequency",
          description: "Custom frequency must be at least 1 day",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate date preference fields
    if (formData.date_preference === "date_range" && (!formData.date_from || !formData.date_to)) {
      toast({
        title: "Date range required",
        description: "Please select both from and to dates",
        variant: "destructive",
      });
      return;
    }

    if (formData.date_preference === "specific_date" && !formData.specific_date) {
      toast({
        title: "Specific date required",
        description: "Please select a specific date",
        variant: "destructive",
      });
      return;
    }

    // Validate content safety
    const titleCheck = contentSafetyService.checkContent(formData.title);
    if (titleCheck.isBlocked) {
      toast({
        title: "Content Blocked",
        description: titleCheck.message,
        variant: "destructive",
      });
      
      await contentSafetyService.logBypassAttempt(
        user.id,
        formData.title,
        titleCheck.detectedPatterns,
        "post_project_title"
      );
      return;
    }

    const descriptionCheck = contentSafetyService.checkContent(formData.description);
    if (descriptionCheck.isBlocked) {
      toast({
        title: "Content Blocked",
        description: descriptionCheck.message,
        variant: "destructive",
      });
      
      await contentSafetyService.logBypassAttempt(
        user.id,
        formData.description,
        descriptionCheck.detectedPatterns,
        "post_project_description"
      );
      return;
    }

    setLoading(true);
    setUploadingMedia(true);

    try {
      const { photoUrls, videoUrl } = await uploadMedia(user.id);

      const projectData: any = {
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
        location: formData.location,
        client_id: user.id,
        status: "open",
        category_id: formData.category_id,
        date_preference: formData.date_preference,
        photos: photoUrls,
        video_url: videoUrl,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_expired: false,
      };

      if (formData.date_preference === "date_range") {
        projectData.date_from = formData.date_from;
        projectData.date_to = formData.date_to;
      } else if (formData.date_preference === "specific_date") {
        projectData.specific_date = formData.specific_date;
      }

      // Handle routine scheduling for non-Domestic Helper categories
      if (routineEnabled && !isDomesticHelper) {
        projectData.routine_frequency = formData.routine_frequency;
        projectData.routine_start_date = formData.routine_start_date;
        if (formData.routine_frequency === "custom") {
          projectData.routine_custom_days = formData.routine_custom_days;
        }
      }

      if (isDomesticHelper) {
        projectData.subcategory_id = formData.subcategory_id;
        projectData.booking_type = formData.booking_type;
        
        if (formData.booking_type === "routine") {
          projectData.selected_days = formData.selected_days;
          projectData.start_date = formData.start_date;
          projectData.weeks_count = formData.weeks_count;
        }
      }

      const { data, error } = await projectService.createProject(projectData);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create project. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Project posted successfully!",
        });
        router.push(`/project/${data.id}`);
      }
    } catch (error) {
      console.error('Project creation error:', error);
      toast({
        title: "Error",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadingMedia(false);
    }
  };

  const getPlaceholders = () => {
    if (selectedCategorySlug && CATEGORY_EXAMPLES[selectedCategorySlug]) {
      return CATEGORY_EXAMPLES[selectedCategorySlug];
    }
    return {
      title: "e.g., End of tenancy clean in Auckland 3 bedroom",
      description: "Describe what you need done in detail..."
    };
  };

  const placeholders = getPlaceholders();

  return (
    <>
      <SEO 
        title="Post a Project - BlueTika"
        description="Post your project and receive bids from verified service providers across New Zealand"
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
          <div className="container max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">Post a Project</CardTitle>
                <CardDescription>
                  Describe your project and receive bids from verified service providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A 2% platform fee will be added to the agreed price at checkout. All amounts in NZD. No GST currently applies.
                  </AlertDescription>
                </Alert>

                <SafetyBanner />

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Service Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      placeholder={placeholders.title}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  {isDomesticHelper && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="subcategory">Service Type *</Label>
                        <Select
                          value={formData.subcategory_id}
                          onValueChange={(value) => setFormData({ ...formData, subcategory_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select service type" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategories.map((sub) => (
                              <SelectItem key={sub.id} value={sub.id}>
                                {sub.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="booking_type">Booking Type *</Label>
                        <Select
                          value={formData.booking_type}
                          onValueChange={(value) => setFormData({ ...formData, booking_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="one_time">One-time booking</SelectItem>
                            <SelectItem value="routine">Routine schedule</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.booking_type === "routine" && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted">
                          <div className="space-y-2">
                            <Label>Days of the Week *</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {DAYS_OF_WEEK.map((day) => (
                                <div key={day} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`day-${day}`}
                                    checked={formData.selected_days.includes(day)}
                                    onCheckedChange={() => handleDayToggle(day)}
                                  />
                                  <Label htmlFor={`day-${day}`} className="font-normal cursor-pointer">
                                    {day}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="start_date">Start Date *</Label>
                              <Input
                                id="start_date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                min={new Date().toISOString().split("T")[0]}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="weeks_count">Number of Weeks (max 8) *</Label>
                              <Input
                                id="weeks_count"
                                type="number"
                                min="1"
                                max="8"
                                value={formData.weeks_count}
                                onChange={(e) => setFormData({ ...formData, weeks_count: parseInt(e.target.value) })}
                                required
                              />
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            Each session creates a separate contract with its own payment
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {!isDomesticHelper && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="routine-toggle" className="text-base font-semibold">
                            Routine Schedule (Optional)
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Need this service on a regular basis?
                          </p>
                        </div>
                        <Switch
                          id="routine-toggle"
                          checked={routineEnabled}
                          onCheckedChange={setRoutineEnabled}
                        />
                      </div>

                      {routineEnabled && (
                        <div className="space-y-4 pt-4 border-t">
                          <div className="space-y-2">
                            <Label htmlFor="routine_frequency">Frequency *</Label>
                            <Select
                              value={formData.routine_frequency}
                              onValueChange={(value) => setFormData({ ...formData, routine_frequency: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="fortnightly">Fortnightly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="custom">Custom (specify days)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formData.routine_frequency === "custom" && (
                            <div className="space-y-2">
                              <Label htmlFor="routine_custom_days">Every X Days *</Label>
                              <Input
                                id="routine_custom_days"
                                type="number"
                                min="1"
                                value={formData.routine_custom_days}
                                onChange={(e) => setFormData({ ...formData, routine_custom_days: parseInt(e.target.value) || 1 })}
                                placeholder="7"
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="routine_start_date">Preferred Start Date *</Label>
                            <Input
                              id="routine_start_date"
                              type="date"
                              value={formData.routine_start_date}
                              onChange={(e) => setFormData({ ...formData, routine_start_date: e.target.value })}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>

                          <p className="text-sm text-muted-foreground">
                            Service providers can propose their availability for your routine schedule
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder={placeholders.description}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Estimated Budget (NZD) *</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="500"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Select
                      value={formData.location}
                      onValueChange={(value) => setFormData({ ...formData, location: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your city or region" />
                      </SelectTrigger>
                      <SelectContent>
                        {NZ_LOCATIONS.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date_preference">Date Preference *</Label>
                    <Select
                      value={formData.date_preference}
                      onValueChange={(value) => setFormData({ ...formData, date_preference: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asap_flexible">ASAP or Flexible</SelectItem>
                        <SelectItem value="specific_date">Specific Date</SelectItem>
                        <SelectItem value="date_range">Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.date_preference === "date_range" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date_from">From Date *</Label>
                        <Input
                          id="date_from"
                          type="date"
                          value={formData.date_from}
                          onChange={(e) => setFormData({ ...formData, date_from: e.target.value })}
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date_to">To Date *</Label>
                        <Input
                          id="date_to"
                          type="date"
                          value={formData.date_to}
                          onChange={(e) => setFormData({ ...formData, date_to: e.target.value })}
                          min={formData.date_from || new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {formData.date_preference === "specific_date" && (
                    <div className="space-y-2">
                      <Label htmlFor="specific_date">Specific Date *</Label>
                      <Input
                        id="specific_date"
                        type="date"
                        value={formData.specific_date}
                        onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                        min={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Photos (up to {MAX_PHOTOS}, JPG or PNG, max 10MB each)</Label>
                    <div className="space-y-4">
                      {photoFiles.length < MAX_PHOTOS && (
                        <div>
                          <Input
                            type="file"
                            accept="image/jpeg,image/png"
                            multiple
                            onChange={handlePhotoChange}
                            className="cursor-pointer"
                          />
                        </div>
                      )}
                      
                      {photoFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {photoFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {file.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Video (optional, MP4, max 30 seconds, max 50MB)</Label>
                    <div className="space-y-4">
                      {!videoFile && (
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept="video/mp4"
                            onChange={handleVideoChange}
                            className="cursor-pointer"
                          />
                        </div>
                      )}
                      
                      {videoFile && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Video className="h-8 w-8 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{videoFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeVideo}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1" disabled={loading || uploadingMedia}>
                      {uploadingMedia ? "Uploading media..." : loading ? "Posting..." : "Post Project"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.push("/projects")}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}