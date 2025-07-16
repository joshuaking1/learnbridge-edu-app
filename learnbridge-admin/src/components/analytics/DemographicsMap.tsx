// src/components/analytics/DemographicsMap.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const DemographicsMap = ({ data }: { data: any[] }) => {
  return (
    <Card className="bg-slate-900 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>User Demographics by Region</CardTitle>
      </CardHeader>
      <CardContent>
        {/* In a real 100x app, this would be an interactive map of Ghana (e.g., using D3.js or Leaflet).
                    For now, we will display the data in a simple list as a placeholder. */}
        <div className="space-y-2">
          {data.map((region) => (
            <div
              key={region.region}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-slate-300">{region.region}</span>
              <span className="font-bold text-brand-orange">
                {region.user_count} users
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
