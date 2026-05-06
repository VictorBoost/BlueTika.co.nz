import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Dynamic sitemap.xml generator
 * Automatically indexes all projects, categories, and static pages
 * 
 * Search engines are pinged via /api/ping-sitemap when new projects are created
 * Sitemap updates every hour or when manually pinged
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Set proper headers for XML sitemap
    res.setHeader("Content-Type", "text/xml");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200");

    const baseUrl = "https://bluetika.co.nz";
    const today = new Date().toISOString().split("T")[0];

    // Fetch all active projects with their last modified dates
    const { data: projects, error } = await supabase
      .from("projects")
      .select("id, updated_at, created_at")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching projects for sitemap:", error);
    }

    // Static pages with priority and changefreq
    const staticPages = [
      { url: "", priority: "1.0", changefreq: "daily" }, // Homepage
      { url: "/about", priority: "0.8", changefreq: "monthly" },
      { url: "/projects", priority: "0.9", changefreq: "hourly" },
      { url: "/directory", priority: "0.8", changefreq: "daily" },
      { url: "/testimonials", priority: "0.8", changefreq: "daily" },
      { url: "/contact", priority: "0.6", changefreq: "monthly" },
      { url: "/faq", priority: "0.6", changefreq: "monthly" },
      { url: "/terms", priority: "0.5", changefreq: "yearly" },
      { url: "/privacy", priority: "0.5", changefreq: "yearly" },
      { url: "/register", priority: "0.7", changefreq: "monthly" },
      { url: "/login", priority: "0.6", changefreq: "monthly" },
      { url: "/post-project", priority: "0.9", changefreq: "monthly" }
    ];

    // Category pages with SEO keywords
    const categories = [
      { slug: "cleaning", name: "Cleaning Services", keywords: "cleaner, house cleaning, office cleaning, end of lease cleaning" },
      { slug: "handyman", name: "Handyman Services", keywords: "handyman, odd jobs, home repairs, maintenance" },
      { slug: "movers", name: "Moving Services", keywords: "movers, removalists, house moving, furniture moving" },
      { slug: "electrical", name: "Electrical Services", keywords: "electrician, electrical work, wiring, lighting installation" },
      { slug: "plumbing", name: "Plumbing Services", keywords: "plumber, plumbing, drain repair, hot water systems" },
      { slug: "landscaping", name: "Landscaping Services", keywords: "landscaper, garden design, lawn care, tree trimming" },
      { slug: "painting", name: "Painting Services", keywords: "painter, house painting, interior painting, exterior painting" },
      { slug: "domestic-helper", name: "Domestic Helpers", keywords: "housekeeper, nanny, elderly care, home helper" },
    ];

    // Build XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach((page) => {
      sitemap += "  <url>\n";
      sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += "  </url>\n";
    });

    // Add category pages with SEO keywords
    categories.forEach((category) => {
      sitemap += "  <url>\n";
      sitemap += `    <loc>${baseUrl}/categories/${category.slug}</loc>\n`;
      sitemap += `    <lastmod>${today}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += "  </url>\n";
    });

    // Add project pages
    if (projects && projects.length > 0) {
      projects.forEach((project) => {
        const lastmod = project.updated_at || project.created_at;
        sitemap += "  <url>\n";
        sitemap += `    <loc>${baseUrl}/project/${project.id}</loc>\n`;
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
        sitemap += `    <changefreq>daily</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += "  </url>\n";
      });
    }

    sitemap += "</urlset>";

    // Set proper headers for XML
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate"
    );
    
    res.status(200).send(sitemap);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
}