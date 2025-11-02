import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

interface A2ARequestBody {
  jsonrpc: string;
  id: string | number | null;
  method?: string;
  params?: {
    message?: any;
    messageId?: string;
    configuration?: any;
    [key: string]: any;
  };
}

// Helper function to extract text from complex message structure
function extractUserMessage(message: any): string {
  // Handle string message
  if (typeof message === 'string') {
    return message.trim();
  }

  // Handle object message with parts array
  if (message && typeof message === 'object') {
    // Check for parts array
    if (Array.isArray(message.parts)) {
      // Find the first text part that's not from previous conversation data
      for (const part of message.parts) {
        if (part.kind === 'text' && typeof part.text === 'string') {
          const text = part.text.trim();
          // Skip HTML-wrapped messages from history
          if (!text.startsWith('<p>') && text.length > 0) {
            return text;
          }
          // If it's HTML, extract the text
          if (text.startsWith('<p>')) {
            const cleanText = text
              .replace(/<p>/g, '')
              .replace(/<\/p>/g, '\n')
              .trim();
            if (cleanText.length > 0) {
              return cleanText;
            }
          }
        }
      }
    }

    // Check for direct text property
    if (typeof message.text === 'string') {
      return message.text.trim();
    }

    // Check for content property
    if (typeof message.content === 'string') {
      return message.content.trim();
    }
  }

  // Fallback
  return '';
}

export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    try {
      const mastra = c.get('mastra');
      const agentId = c.req.param('agentId');
      const body = await c.req.json<A2ARequestBody>();

      console.log('📥 Received A2A request for agent:', agentId);
      console.log('📋 Request body:', JSON.stringify(body, null, 2));

      const { jsonrpc, id: requestId, params } = body;

      // Validate JSON-RPC structure
      if (jsonrpc !== '2.0' || requestId == null) {
        console.error('❌ Invalid JSON-RPC request');
        return c.json(
          {
            jsonrpc: '2.0',
            id: requestId || null,
            error: { code: -32600, message: 'Invalid Request' },
          },
          400
        );
      }

      // Get the agent
      const agent = mastra.getAgent(agentId);
      if (!agent) {
        console.error(`❌ Agent '${agentId}' not found`);
        // console.log('Available agents:', Object.keys(mastra.agents || {}));
        return c.json(
          {
            jsonrpc: '2.0',
            id: requestId,
            error: {
              code: -32603,
              message: 'Internal error',
              data: { details: `Agent with name ${agentId} not found` },
            },
          },
          500
        );
      }

      // Extract user message
      const userMessage = extractUserMessage(params?.message);

      if (!userMessage) {
        console.warn('⚠️  No valid message found, using default greeting');
      }

      const finalMessage = userMessage || "Hello! I'm here to chat with you.";

      console.log('💬 Processing message:', finalMessage);

      // Generate response from agent
      const startTime = Date.now();
      const response = await agent.generate([
        { role: 'user', content: finalMessage },
      ]);
      const duration = Date.now() - startTime;

      const agentText =
        response.text || "I'm here to listen and chat with you.";

      console.log(`✅ Response generated in ${duration}ms`);
      console.log('🤖 Agent response:', agentText.substring(0, 100) + '...');

      // Return A2A formatted response
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
      console.error('❌ Error processing A2A request:', error);
      return c.json(
        {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: { details: error?.message || 'Unknown error' },
          },
        },
        500
      );
    }
  },
});