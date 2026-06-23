import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: admin only' }, { status: 403 });
    }

    const crmSecret = Deno.env.get('CRM_WEBHOOK_SECRET') || '';
    const sensorSecret = Deno.env.get('SENSORFLOW_API_KEY') || '';

    return Response.json({
      CRM_WEBHOOK_SECRET: crmSecret,
      SENSORFLOW_API_KEY: sensorSecret,
      endpoint: 'https://lofty-osprey-82-hhw6d677w1sj.deno.dev/',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});