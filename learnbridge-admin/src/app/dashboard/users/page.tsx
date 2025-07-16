// src/app/dashboard/users/page.tsx
import { createClient } from "@/lib/supabase/server";
import { UserManagementClient } from "@/components/analytics/UserManagementClient";

export default async function UserManagementPage() {
    const supabase = await createClient();
    
    // THE FIX: Use our robust RPC function to fetch the initial data.
    // We pass an empty search term and 'all' for the role to get everyone.
    const { data: initialUsers, error } = await supabase
        .rpc('search_users', {
            search_term: '',
            filter_role: null
        });
            
    if (error) {
        console.error("Error fetching initial users via RPC:", error);
    }
    
    // We need to reshape the data slightly to match what the client component expects.
    // The RPC returns a flat object, but our original query returned a nested 'user_data'.
    const formattedUsers = initialUsers?.map(user => ({
        ...user,
        user_data: [{
            email: user.email,
            last_sign_in_at: user.last_sign_in_at
        }]
    })) || [];

    return (
        <div className="p-8 bg-slate-800 min-h-screen text-white">
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-slate-400">Search, view, and manage all users on the LearnBridgeEdu platform.</p>
            <UserManagementClient initialUsers={formattedUsers} />
        </div>
    )
}
