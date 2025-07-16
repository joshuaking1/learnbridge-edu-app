// src/app/dashboard/moderation/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Action to dismiss a flag without deleting content
export async function dismissFlag(flagId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    
    // The RLS policy on the 'flags' table ensures only an admin can perform this update.
    const { error } = await supabase
        .from('flags')
        .update({
            status: 'resolved',
            resolved_by: user.id,
            resolved_at: new Date().toISOString()
        })
        .eq('id', flagId);
    
    if (error) {
        console.error("Dismiss Flag Error:", error);
        return { error: "Failed to dismiss flag." };
    }

    revalidatePath('/dashboard/moderation');
    return { success: true };
}

// Action to delete content and resolve the flag
export async function deleteFlaggedContent(flagId: string, contentType: string, contentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };
    
    // We call our secure database function to handle the deletion and logging
    const { error } = await supabase.rpc('moderate_delete_content', {
        flag_id_param: flagId,
        content_type_param: contentType,
        content_id_param: contentId,
        admin_id_param: user.id
    });

    if (error) {
        console.error("Moderate Delete Error:", error);
        return { error: "Failed to delete content." };
    }
    
    revalidatePath('/dashboard/moderation');
    return { success: true };
}

// Placeholder for a future Ban User action
export async function banUser(userId: string) {
    // In a real system, this would update the user's status in the profiles table
    // and log the action to the audit log.
    console.log(`Banning user ${userId}`);
    return { success: true };
}