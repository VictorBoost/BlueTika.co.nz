import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MapPin, DollarSign, ExternalLink } from "lucide-react";
import { getCategoryData } from "@/lib/categoryData";
import { supabase } from "@/integrations/supabase/client";

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [exampleProjects, setExampleProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryInfo = slug ? getCategoryData(slug as string) : null;

  useEffect(() => {
    if (slug) {
      loadExampleProjects();
    }
  }, [slug]);

  const loadExampleProjects = async () => {
    setLoading(true);
    
    // Get category ID from slug
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .single();

    if (category) {
      // Get 4 completed projects with reviews as examples
      const { data: projects } = await supabase
        .from("projects")
        .select(`
          *,
          category:categories(name),
          contract:contracts!contracts_project_id_fkey(
            status,
            reviews!reviews_contract_id_fkey(rating, comment)
          )
        `)
        .eq("category_id", category.id)
        .eq("status", "completed")
        .not("contract", "is", null)
        .order("created_at", { ascending: false })
        .limit(4);

      setExampleProjects(projects || []);
    }
    
    setLoading(false);
  };

  if (!categoryInfo) {
    return (
      <>
        <SEO title="Category Not Found - BlueTika" />
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <Button asChild>
              <Link href="/projects">Browse All Projects</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SEO 
        title={`${categoryInfo.title} | BlueTika`}
        description={categoryInfo.description}
      />
      <Navigation />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 border-b">
          <div className="container max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{categoryInfo.title}</h1>
            <p className="text-xl text-muted-foreground mb-8">{categoryInfo.description}</p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/post-project">Post Your Project</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/projects">Browse Projects</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Common Problems Solved */}
        <section className="py-16 border-b">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">Common Problems We Solve</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {categoryInfo.commonProblems.map((problem, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                  <p className="text-muted-foreground">{problem}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How BlueTika Helps */}
        <section className="py-16 bg-muted/30 border-b">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-bold mb-8">How BlueTika Helps You</h2>
            <div className="space-y-4">
              {categoryInfo.howBlueTikaHelps.map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                      <p>{benefit}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Example Success Stories */}
        {exampleProjects.length > 0 && (
          <section className="py-16">
            <div className="container max-w-6xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
                <p className="text-muted-foreground">Real projects completed through BlueTika</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {exampleProjects.map((project) => {
                  const review = project.contract?.reviews?.[0];
                  return (
                    <Card key={project.id} className="hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
                            <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                          </div>
                          {review && (
                            <Badge variant="secondary">
                              ⭐ {review.rating}/5
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{project.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>Budget: NZD ${project.budget.toLocaleString()}</span>
                          </div>
                          {review?.comment && (
                            <div className="pt-3 border-t">
                              <p className="text-sm italic text-muted-foreground line-clamp-2">
                                "{review.comment}"
                              </p>
                            </div>
                          )}
                          <Button variant="outline" size="sm" asChild className="w-full mt-4">
                            <Link href={`/project/${project.id}`}>
                              View Project <ExternalLink className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Blog Link (Coming Soon) */}
        <section className="py-16 bg-muted/30 border-t">
          <div className="container max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Learn More</h2>
            <p className="text-muted-foreground mb-6">
              Expert guides, tips, and advice coming soon in our blog
            </p>
            <Badge variant="outline">Coming Week 2</Badge>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Post your project and receive bids from verified local providers
            </p>
            <Button size="lg" asChild>
              <Link href="/post-project">Post Project Now</Link>
            </Button>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}