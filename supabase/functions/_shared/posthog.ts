// PostHog tracking utility for Supabase Edge Functions
export const trackEdgeFunctionEvent = async (
  eventName: string,
  properties?: Record<string, any>
) => {
  try {
    const posthogKey = Deno.env.get('POSTHOG_KEY');
    if (!posthogKey) {
      console.log('PostHog key not configured for edge function');
      return;
    }

    const response = await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${posthogKey}`,
      },
      body: JSON.stringify({
        api_key: posthogKey,
        event: eventName,
        properties: {
          ...properties,
          timestamp: new Date().toISOString(),
          source: 'supabase_edge_function',
          function_name: Deno.env.get('SUPABASE_FUNCTION_NAME') || 'unknown'
        },
        distinct_id: properties?.user_id || 'anonymous'
      })
    });

    if (!response.ok) {
      console.error('PostHog tracking failed:', response.status);
    }
  } catch (error) {
    console.error('PostHog tracking error:', error);
  }
};
