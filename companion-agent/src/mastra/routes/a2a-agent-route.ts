import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

interface A2ARequestBody {
  jsonrpc: string;
  id: string | number | null;
  method?: string;
  params?: {
    message?: string;
    [key: string]: any;
  };
}

export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    try {
      const mastra = c.get('mastra');
      const agentId = c.req.param('agentId');
      const body = await c.req.json<A2ARequestBody>();

      const { jsonrpc, id: requestId, params } = body;

      if (jsonrpc !== '2.0' || !requestId) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId || null,
          error: { code: -32600, message: 'Invalid Request' },
        }, 400);
      }

      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32602, message: `Agent '${agentId}' not found` },
        }, 404);
      }

      const { message } = params || {};
      const userMessage = message || 'Hello';
      
      // Pass message as string instead of array
      const response = await agent.generate(userMessage);
      const agentText = response.text || `I'm here to listen and chat with you.`;

      return c.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          status: { state: 'completed' },
          artifacts: [
            {
              artifactId: randomUUID(),
              name: `${agentId}Response`,
              parts: [{ kind: 'text', text: agentText }],
            },
          ],
        },
      });
    } catch (error: any) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: { 
          code: -32603, 
          message: 'Internal error', 
          data: { details: error?.message || 'Unknown error' } 
        },
      }, 500);
    }
  },
});