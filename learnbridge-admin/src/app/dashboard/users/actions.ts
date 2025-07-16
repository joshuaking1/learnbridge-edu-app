// src/app/dashboard/users/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

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