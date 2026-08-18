const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, X-Source',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      status: 'success',
      message: 'Vyoma Webhook Tester Receiver is online and ready.',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = { raw: text };
      }
    }

    console.log('RECEIVER_WEBHOOK_PAYLOAD:', JSON.stringify(body, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        status: 'success',
        message: 'Webhook payload received by tester receiver endpoint',
        timestamp: new Date().toISOString(),
        received_body: body,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: true,
        status: 'acknowledged',
        message: 'Payload received with error fallback',
        error: err?.message,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
