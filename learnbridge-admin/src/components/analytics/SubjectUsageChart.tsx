// src/components/analytics/SubjectUsageChart.tsx
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const SubjectUsageChart = ({ data }: { data: any[] }) => {
  return (
    <Card className="bg-slate-900 border-slate-700 text-white">
      <CardHeader>
        <CardTitle>Curriculum Engagement by Subject</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9ca3af" fontSize={12} />
            <YAxis
              type="category"
              dataKey="subject"
              stroke="#9ca3af"
              fontSize={12}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
              }}
            />
            <Legend />
            <Bar
              dataKey="lessons_completed"
              stackId="a"
              fill="#022e7d"
              name="Lessons Completed"
            />
            <Bar
              dataKey="resources_uploaded"
              stackId="a"
              fill="#fd6a3e"
              name="Resources Uploaded"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
