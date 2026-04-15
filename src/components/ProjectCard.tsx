import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, MessageSquare } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<"projects">;

interface ProjectCardProps {
  project: Project & {
    bid_count?: number;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColors = {
    open: "bg-success/10 text-success border-success/20",
    in_progress: "bg-accent/10 text-accent border-accent/20",
    completed: "bg-muted text-muted-foreground border-muted",
    cancelled: "bg-muted text-muted-foreground border-muted",
  };

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2 hover:text-primary transition-colors">
              <Link href={`/project/${project.id}`}>
                {project.title}
              </Link>
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          </div>
          <Badge variant="outline" className={statusColors[project.status]}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="font-semibold text-foreground">
              NZD ${project.budget.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{project.location}</span>
          </div>
          {project.bid_count !== undefined && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{project.bid_count} {project.bid_count === 1 ? "bid" : "bids"}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/project/${project.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}