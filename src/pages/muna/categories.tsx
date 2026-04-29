import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { categoryService } from "@/services/categoryService";
import { authService } from "@/services/authService";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

type Category = Tables<"categories">;

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: null as string | null,
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    setLoading(true);
    
    try {
      // Use server-side admin verification API (same as /muna dashboard)
      const response = await fetch("/api/auth/verify-admin", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      
      if (response.status === 401) {
        // Not logged in - redirect to login
        router.push("/muna/login");
        return;
      }

      if (response.status === 403 || !data.isAdmin) {
        // Logged in but not admin - redirect to main dashboard
        toast({
          title: "Access Denied",
          description: "You do not have permission to access this page.",
          variant: "destructive",
        });
        router.push("/muna");
        return;
      }

      // User is authenticated and is admin
      setIsAdmin(true);
      loadCategories();
    } catch (error) {
      console.error("Error in checkAdminAccess:", error);
      router.push("/muna");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    const { data, error } = await categoryService.getAllCategoriesAdmin();
    
    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      // Update existing category
      const { error } = await categoryService.updateCategory(editingCategory.id, formData);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update category",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } else {
      // Create new category
      const { error } = await categoryService.createCategory(formData);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to create category",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Category created successfully",
      });
    }

    setDialogOpen(false);
    resetForm();
    loadCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon,
      is_active: category.is_active,
      display_order: category.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    const { error } = await categoryService.deleteCategory(id);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category. It may be in use by existing projects.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Category deleted successfully",
    });
    loadCategories();
  };

  const handleToggleActive = async (category: Category) => {
    const { error } = await categoryService.toggleActive(category.id, !category.is_active);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update category status",
        variant: "destructive",
      });
      return;
    }

    loadCategories();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: null,
      is_active: true,
      display_order: categories.length,
    });
    setEditingCategory(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <SEO 
        title="Manage Categories - Admin | BlueTika"
        description="Manage service categories on BlueTika"
      />
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow py-12">
          <div className="container">
            <Button
              variant="outline"
              onClick={() => router.push("/muna")}
              className="mb-4"
            >
              ← Back to Control Centre
            </Button>

            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Manage Categories</h1>
                <p className="text-muted-foreground">Add, edit, or remove service categories</p>
              </div>

              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory 
                        ? "Update the category details below" 
                        : "Create a new service category for the platform"}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Category Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({ 
                              ...formData, 
                              name: e.target.value,
                              slug: generateSlug(e.target.value)
                            });
                          }}
                          placeholder="e.g., Plumbing"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="slug">URL Slug *</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="e.g., plumbing"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Auto-generated from name. Use lowercase letters and hyphens only.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Brief description of this category"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="icon">Icon (optional)</Label>
                        <Input
                          id="icon"
                          value={formData.icon || ""}
                          onChange={(e) => setFormData({ ...formData, icon: e.target.value || null })}
                          placeholder="lucide-react icon name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="display_order">Display Order</Label>
                        <Input
                          id="display_order"
                          type="number"
                          value={formData.display_order}
                          onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                          min={0}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Active (visible to users)</Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingCategory ? "Update Category" : "Create Category"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Service Categories</CardTitle>
                <CardDescription>
                  Manage the categories available for project listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading categories...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No categories found
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((category) => (
                          <TableRow key={category.id}>
                            <TableCell className="font-medium">
                              {category.display_order}
                            </TableCell>
                            <TableCell className="font-medium">{category.name}</TableCell>
                            <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                            <TableCell className="max-w-xs truncate">
                              {category.description}
                            </TableCell>
                            <TableCell>
                              <Badge variant={category.is_active ? "default" : "secondary"}>
                                {category.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleActive(category)}
                                >
                                  {category.is_active ? "Deactivate" : "Activate"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(category)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(category.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}