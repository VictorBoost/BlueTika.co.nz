export interface ProjectSchemaData {
  id: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  category?: { name: string };
  created_at: string;
  slug?: string;
  reviews?: Array<{
    rating: number;
    comment: string;
    created_at: string;
  }>;
}

export const generateProjectSchema = (project: ProjectSchemaData, url: string) => {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": project.title,
    "description": project.description,
    "serviceType": project.category?.name || "Service",
    "areaServed": {
      "@type": "Place",
      "name": project.location
    },
    "offers": {
      "@type": "Offer",
      "price": project.budget,
      "priceCurrency": "NZD"
    },
    "provider": {
      "@type": "Organization",
      "name": "BlueTika",
      "url": "https://bluetika.co.nz"
    }
  };

  return schema;
};

export const generateReviewSchema = (reviews: Array<{ rating: number; comment: string; created_at: string }>) => {
  if (!reviews || reviews.length === 0) return null;

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = totalRating / reviews.length;

  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "ratingValue": avgRating.toFixed(1),
    "reviewCount": reviews.length,
    "bestRating": "5",
    "worstRating": "1"
  };
};

export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BlueTika",
    "url": "https://bluetika.co.nz",
    "logo": "https://bluetika.co.nz/og-image.png",
    "description": "New Zealand's trusted reverse marketplace. Post projects, get verified bids, hire with confidence.",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "NZ"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Service",
      "email": "hello@bluetika.co.nz"
    }
  };
};

export const generateBreadcrumbSchema = (items: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};