import { randomBytes, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { oauthClient } from "@/lib/youtube/oauth";
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/?login=required", request.url));
  try {
    const state = randomBytes(24).toString("hex");
    const client = oauthClient();
    const url = client.generateAuthUrl({
      access_type: "offline", prompt: "consent", state,
      scope: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
      include_granted_scopes: true
    });
    const response = NextResponse.redirect(url);
    response.cookies.set("yt_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start YouTube connection.";
    return NextResponse.redirect(new URL("/?youtube_error=" + encodeURIComponent(message), request.url));
  }
}