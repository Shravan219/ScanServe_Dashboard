import { getInboundLogs, clearInboundLogs } from '../../server/orderStore';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'DELETE') {
    clearInboundLogs();
    return res.status(200).json({ success: true, message: 'Inbound logs cleared' });
  }

  const logs = getInboundLogs();
  return res.status(200).json({ success: true, count: logs.length, logs });
}
