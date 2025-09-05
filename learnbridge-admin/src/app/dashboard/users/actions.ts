// src/app/dashboard/users/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function searchAndFilterUsers(searchTerm: string, roleFilter: string) {
    const supabase = await createClient();

    // The RPC call now passes both parameters. If roleFilter is 'all', we pass NULL.
    const { data, error } = await supabase.rpc('search_users', {
        search_term: searchTerm,
        filter_role: roleFilter === 'all' ? null : roleFilter
    });
    
    if (error) {
        console.error("User search RPC error:", error);
        return { error: "Failed to search users." };
    }

    return { users: data };
}
// Action to Suspend/Unsuspend a User
export async function toggleUserSuspension(userId: string, currentStatus: 'active' | 'suspended') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !(await supabase.rpc('is_claims_admin'))) {
        return { error: "Permission denied." };
    }

    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

    if (updateError) {
        return { error: `DB Error: ${updateError.message}` };
    }

    // Log the action
    await supabase.from('admin_audit_log').insert({
        admin_id: user.id,
        action: newStatus === 'suspended' ? 'suspended_user' : 'unsuspended_user',
        target_id: userId
    });

    revalidatePath('/dashboard/users');
    return { success: true };
}

// Action to Ban a User
export async function banUser(userId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !(await supabase.rpc('is_claims_admin'))) {
        return { error: "Permission denied." };
    }

    const { error: rpcError } = await supabase.rpc('ban_user', { 
        target_user_id: userId 
    });

    if (rpcError) {
        return { error: `RPC Error: ${rpcError.message}` };
    }

    revalidatePath('/dashboard/users');
    return { success: true };
}