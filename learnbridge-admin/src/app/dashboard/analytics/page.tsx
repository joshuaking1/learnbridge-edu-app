// src/app/dashboard/analytics/page.tsx
import { createClient } from "@/lib/supabase/server";
import { UserGrowthChart } from "@/components/analytics/UserGrowthChart";
import { DemographicsMap } from "@/components/analytics/DemographicsMap";
import { SubjectUsageChart } from "@/components/analytics/SubjectUsageChart";
import { GenderDistributionChart } from "@/components/analytics/GenderDistributionChart"; // Import the new component

export default async function AnalyticsPage() {
    const supabase = await createClient();

    // Fetch all analytics data in parallel for maximum performance
    const [
        demographicsData,
        subjectUsageData,
        userGrowthData,
        genderData // Fetch new data
    ] = await Promise.all([
        supabase.rpc('get_user_demographics_by_region'),
        supabase.rpc('get_content_usage_by_subject'),
        supabase.rpc('get_user_signup_timeseries'),
        supabase.rpc('get_user_demographics_by_gender') // Call the new function
    ]);
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
            <p className="text-slate-400 mb-6">Deep insights into user behavior, engagement, and curriculum interaction.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <UserGrowthChart data={userGrowthData.data || []} />
                </div>
                <div className="lg:col-span-1">
                    <DemographicsMap data={demographicsData.data || []} />
                </div>
                <div className="lg:col-span-2">
                   <SubjectUsageChart data={subjectUsageData.data || []} />
                </div>
                 <div className="lg:col-span-1">
                   <GenderDistributionChart data={genderData.data || []} />
                </div>
            </div>
        </div>
    )
}
