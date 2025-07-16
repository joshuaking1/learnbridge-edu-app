// src/components/social/CirclesToJoin.tsx

import { createClient } from "@/lib/supabase/server";

// Import the new client component

import { JoinCircleButton } from "./JoinCircleButton"; 

export const CirclesToJoin = async ({ userId }: { userId: string }) => {

    const supabase = createClient();

    

    const { data: memberCircles } = await supabase.from('circle_members').select('circle_id').eq('member_id', userId);

    const memberCircleIds = memberCircles?.map(c => c.circle_id) || [];

    // The query logic remains the same. Use a placeholder if the array is empty to prevent SQL errors.

    const { data: circlesToJoin } = await supabase.from('study_circles')

        .select('*')

        .not('id', 'in', `(${(memberCircleIds.length > 0 ? memberCircleIds.join(',') : "'00000000-0000-0000-0000-000000000000'")})`);

    

    if (!circlesToJoin || circlesToJoin.length === 0) {

        return (

             <div className="bg-white p-4 rounded-lg shadow-sm h-fit">

                <h3 className="font-bold text-lg text-brand-blue mb-2">Discover Circles</h3>

                <p className="text-sm text-slate-500">No new circles to join right now.</p>

            </div>

        )

    }

    return (

        <div className="bg-white p-4 rounded-lg shadow-sm h-fit">

            <h3 className="font-bold text-lg text-brand-blue mb-4">Discover Circles</h3>

            <div className="space-y-3">

                {circlesToJoin.map(circle => (

                    <div key={circle.id} className="flex justify-between items-center">

                        <div>

                            <p className="font-semibold text-slate-700">{circle.name}</p>

                            <p className="text-xs text-slate-500">{circle.description}</p>

                        </div>

                        {/* Use the new client button component */}

                        <JoinCircleButton circleId={circle.id} />

                    </div>

                ))}

            </div>

        </div>

    );

}
