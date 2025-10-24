import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const pad = base64Url.length % 4 === 2 ? "==" : base64Url.length % 4 === 3 ? "=" : "";
  const b64 = base64Url.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const raw = atob(b64);
  const uint8 = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);
  return uint8;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem.replace(/-----BEGIN PUBLIC KEY-----/g, "").replace(/-----END PUBLIC KEY-----/g, "").replace(/\s+/g, "");
  const binaryDer = atob(cleaned);
  const bytes = new Uint8Array(binaryDer.length);
  for (let i = 0; i < binaryDer.length; i++) {
    bytes[i] = binaryDer.charCodeAt(i);
  }
  return bytes.buffer;
}

async function importRsaPublicKey(spkiPem: string): Promise<CryptoKey> {
  const keyBuffer = pemToArrayBuffer(spkiPem);
  return await crypto.subtle.importKey(
    "spki",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

async function verifyClerkJwt(token: string, publicKeyPem: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const data = new TextEncoder().encode(`${h}.${p}`);
    const signature = base64UrlToUint8Array(s);

    const key = await importRsaPublicKey(publicKeyPem);
    const ok = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      key,
      signature,
      data,
    );
    if (!ok) return null;
    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(p));
    return JSON.parse(payloadJson);
  } catch (_e) {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const PUBLIC_KEY = Deno.env.get("CLERK_PUBLIC_KEY") || `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAohIBo2Co+L66+FL7v0L3\n+otXywXxCjYHBamtG9mDKwYOZoLzV4DyfVRb/MmIWal4SpOVXaPekRG3x0JmFKht\n+3LueC7fXJjPWEvXxQeQNLPCfqypH4foOGkeymIJhPjUk+i1ZGp6uhFcKWnnfhyE\nl61S+8fmhjrL+Dr5aTSnT4VfgGzt/RPREr448IxbjWkX/1d65YrKnv1ZYGS2XFXP\n9OqIrRtMiw4i3a0Ye4H0jNN4GLw2RkL9FNec1uHwzgSVBb2fJOGeLGVyOyHiBa+m\ns9Kehww+eswiR/mCQ4RprePwfY2GPqJ4EssZeeMUbvxh2BePxhvq/5uNEOkq0vOk\ndQIDAQAB\n-----END PUBLIC KEY-----`;

    const claims = await verifyClerkJwt(token, PUBLIC_KEY);
    if (!claims || !claims.sub) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const service = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Ensure profile exists
    const userId = claims.sub as string;

    // Upsert minimal record; avoid overwriting existing
    const { data: existing } = await service
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existing) {
      const baseUsername = (claims.email || claims.primary_email || "user_" + userId.slice(0, 8)).toString().split("@")[0].toLowerCase();
      let candidate = baseUsername.replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24) || `user_${userId.slice(0, 8)}`;

      // Try a few suffixes for uniqueness
      for (let attempt = 0; attempt < 20; attempt++) {
        const { data: taken } = await service.from("profiles").select("id").eq("username", candidate).maybeSingle();
        if (!taken) break;
        const suffix = `_${attempt + 1}`;
        const maxBase = Math.max(1, 24 - suffix.length);
        candidate = `${candidate.slice(0, maxBase)}${suffix}`;
      }

      await service.from("profiles").insert({ id: userId, username: candidate });
    }

    return new Response(JSON.stringify({ success: true, userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
