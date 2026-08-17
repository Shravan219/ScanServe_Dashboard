import { getInboundLogs, clearInboundLogs } from '../../server/orderStore';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'DELETE') {
      try {
        clearInboundLogs();
      } catch {}
      return res.status(200).json({ success: true, message: 'Inbound logs cleared' });
    }

    let logs: any[] = [];
    try {
      logs = getInboundLogs() || [];
    } catch {
      logs = [];
    }

    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return res.status(200).json({ success: true, count: 0, logs: [] });
  }
}
