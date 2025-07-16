// src/app/auth/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server"; // Ensure you have a server helper
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}