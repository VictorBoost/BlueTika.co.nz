import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Redirect to the frontend so the client-side Supabase SDK can 
  // automatically perform the PKCE exchange using the code verifier stored in local storage.
  const searchParams = new URLSearchParams(req.query as Record<string, string>);
  return res.redirect(`/?${searchParams.toString()}`);
}