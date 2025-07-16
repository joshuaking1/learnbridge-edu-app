// learnbridge-admin/src/app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, BarChart } from "lucide-react";

export default async function AdminDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect('/login'); }
    
    // Call our new, secure RPC function to get the platform stats.
    const { data: stats, error } = await supabase
        .rpc('get_platform_stats')
        .single();

    if (error) {
        console.error("Error fetching platform stats:", error);
        // Handle case where user might not be admin, even if they get past middleware
        return <p className="text-red-500">Error: Could not load platform statistics. {error.message}</p>
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-6">Platform Overview</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-slate-900 border-slate-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_users ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Students, Teachers, and Admins</p>
                    </CardContent>
                </Card>
                 <Card className="bg-slate-900 border-slate-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingested Documents</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_documents ?? 0}</div>
                        <p className="text-xs text-muted-foreground">SBC curriculum PDFs in the system</p>
                    </CardContent>
                </Card>
                 <Card className="bg-slate-900 border-slate-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Study Circles</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_circles ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Active communities on the platform</p>
                    </CardContent>
                </Card>
            </div>
            {/* ... rest of the page ... */}
        </div>
    );
}
