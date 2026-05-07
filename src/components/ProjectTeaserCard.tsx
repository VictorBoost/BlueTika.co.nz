import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, Calendar, Clock, LogIn } from "lucide-react";
import Link from "next/link";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects"> & {
  category?: { name: string };
  subcategory?: { name: string };
};

interface ProjectTeaserCardProps {
  project: Project;
}

export function ProjectTeaserCard({ project }: ProjectTeaserCardProps) {
  const statusColors = {
    open: "bg-success/10 text-success border-success/20",
    in_progress: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-muted text-muted-foreground border-muted",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  const formatDatePreference = () => {
    switch (project.date_preference) {
      case "asap_flexible":
        return "ASAP or Flexible";
      case "specific_date":
        return project.specific_date ? new Date(project.specific_date).toLocaleDateString() : "Specific Date";
      case "date_range":
        return "Date Range";
      default:
        return "Not specified";
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge variant="outline" className={statusColors[project.status]}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        <CardTitle className="text-xl line-clamp-2">{project.title}</CardTitle>
        {/* Limited description for SEO - no sensitive details */}
        <CardDescription className="line-clamp-2">
          {project.description.substring(0, 100)}...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {project.category && (
            <Badge variant="secondary" className="text-xs">
              {project.category.name}
            </Badge>
          )}
          {project.subcategory && (
            <Badge variant="outline" className="text-xs">
              {project.subcategory.name}
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">NZD ${project.budget.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{project.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{formatDatePreference()}</span>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{getTimeAgo(project.created_at)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href={`/login?redirect=/project/${project.slug || project.id}`}>
            <LogIn className="h-4 w-4 mr-2" />
            Login to View & Bid
          </Link>
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Login required to contact client and submit bids
        </p>
      </CardFooter>
    </Card>
  );
}