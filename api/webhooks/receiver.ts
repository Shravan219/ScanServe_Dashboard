export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-Source');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  console.log('RECEIVER_WEBHOOK_PAYLOAD:', JSON.stringify(body, null, 2));

  return res.status(200).json({
    success: true,
    status: 'success',
    message: 'Webhook payload received by tester receiver endpoint',
    timestamp: new Date().toISOString(),
    received_body: body
  });
}
