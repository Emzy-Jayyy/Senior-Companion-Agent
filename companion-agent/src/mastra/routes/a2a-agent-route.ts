// import { registerApiRoute } from "@mastra/core/server";
// import { randomUUID } from "crypto";

// interface A2ARequestBody {
//   jsonrpc: string;
//   id: string | number | null;
//   method?: string;
//   params?: {
//     message?: any;
//     messageId?: string;
//     configuration?: any;
//     [key: string]: any;
//   };
// }

// // Helper function to extract text from complex message structure
// function extractUserMessage(message: any): string {
//   // Handle string message
//   if (typeof message === "string") {
//     return message.trim();
//   }

//   // Handle object message with parts array
//   if (message && typeof message === "object") {
//     // Check for parts array
//     if (Array.isArray(message.parts)) {
//       // Find the first text part that's not from previous conversation data
//       for (const part of message.parts) {
//         if (part.kind === "text" && typeof part.text === "string") {
//           const text = part.text.trim();
//           // Skip HTML-wrapped messages from history
//           if (!text.startsWith("<p>") && text.length > 0) {
//             return text;
//           }
//           // If it's HTML, extract the text
//           if (text.startsWith("<p>")) {
//             const cleanText = text
//               .replace(/<p>/g, "")
//               .replace(/<\/p>/g, "\n")
//               .trim();
//             if (cleanText.length > 0) {
//               return cleanText;
//             }
//           }
//         }
//       }
//     }

//     // Check for direct text property
//     if (typeof message.text === "string") {
//       return message.text.trim();
//     }

//     // Check for content property
//     if (typeof message.content === "string") {
//       return message.content.trim();
//     }
//   }

//   // Fallback
//   return "";
// }

// export const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
//   method: "POST",
//   handler: async (c) => {
//     try {
//       const mastra = c.get("mastra");
//       const agentId = c.req.param("agentId");
//       const body = await c.req.json<A2ARequestBody>();

//       console.log("📥 Received A2A request for agent:", agentId);
//       console.log("📋 Request body:", JSON.stringify(body, null, 2));

//       const { jsonrpc, id: requestId, params } = body;

//       // Validate JSON-RPC structure
//       if (jsonrpc !== "2.0" || requestId == null) {
//         console.error("❌ Invalid JSON-RPC request");
//         return c.json(
//           {
//             jsonrpc: "2.0",
//             id: requestId || null,
//             error: { code: -32600, message: "Invalid Request" },
//           },
//           400
//         );
//       }

//       // Get the agent
//       const agent = mastra.getAgent(agentId);
//       if (!agent) {
//         console.error(`❌ Agent '${agentId}' not found`);
//         // console.log('Available agents:', Object.keys(mastra.agents || {}));
//         return c.json(
//           {
//             jsonrpc: "2.0",
//             id: requestId,
//             error: {
//               code: -32603,
//               message: "Internal error",
//               data: { details: `Agent with name ${agentId} not found` },
//             },
//           },
//           500
//         );
//       }

//       // Extract user message
//       const userMessage = extractUserMessage(params?.message);

//       if (!userMessage) {
//         console.warn("⚠️  No valid message found, using default greeting");
//       }

//       const finalMessage = userMessage || "Hello! I'm here to chat with you.";

//       console.log("💬 Processing message:", finalMessage);

//       // Generate response from agent
//       const startTime = Date.now();
//       const response = await agent.generate([
//         { role: "user", content: finalMessage },
//       ]);
//       const duration = Date.now() - startTime;

//       const agentText =
//         response.text || "I'm here to listen and chat with you.";

//       console.log(`✅ Response generated in ${duration}ms`);
//       console.log("🤖 Agent response:", agentText.substring(0, 100) + "...");

//       // Return A2A formatted response
//       return c.json({
//         jsonrpc: "2.0",
//         id: requestId,
//         result: {
//           status: { state: "completed" },
//           artifacts: [
//             {
//               artifactId: randomUUID(),
//               name: `${agentId}Response`,
//               parts: [{ kind: "text", text: agentText }],
//             },
//           ],
//         },
//       });
//     } catch (error: any) {
//       console.error("❌ Error processing A2A request:", error);
//       return c.json(
//         {
//           jsonrpc: "2.0",
//           id: null,
//           error: {
//             code: -32603,
//             message: "Internal error",
//             data: { details: error?.message || "Unknown error" },
//           },
//         },
//         500
//       );
//     }
//   },
// });



// import { registerApiRoute } from '@mastra/core/server';
// import { randomUUID } from 'crypto';

// export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
//   method: 'POST',
//   handler: async (c) => {
//     try {
//       const mastra = c.get('mastra');
//       const agentId = c.req.param('agentId');

//       // Parse JSON-RPC 2.0 request
//       const body = await c.req.json();
//       const { jsonrpc, id: requestId, method, params } = body;

//       // Validate JSON-RPC 2.0 format
//       if (jsonrpc !== '2.0' || !requestId) {
//         return c.json({
//           jsonrpc: '2.0',
//           id: requestId || null,
//           error: {
//             code: -32600,
//             message: 'Invalid Request: jsonrpc must be "2.0" and id is required'
//           }
//         }, 400);
//       }

//       const agent = mastra.getAgent(agentId);
//       if (!agent) {
//         return c.json({
//           jsonrpc: '2.0',
//           id: requestId,
//           error: {
//             code: -32602,
//             message: `Agent '${agentId}' not found`
//           }
//         }, 404);
//       }

//       // Extract messages from params
//       const { message, messages, contextId, taskId, metadata } = params || {};

//       let messagesList = [];
//       if (message) {
//         messagesList = [message];
//       } else if (messages && Array.isArray(messages)) {
//         messagesList = messages;
//       }

//       // Convert A2A messages to Mastra format
//       const mastraMessages = messagesList.map((msg) => ({
//         role: msg.role,
//         content: msg.parts?.map((part:any) => {
//           if (part.kind === 'text') return part.text;
//           if (part.kind === 'data') return JSON.stringify(part.data);
//           return '';
//         }).join('\n') || ''
//       }));

//       // Execute agent
//       const response = await agent.generate(mastraMessages);
//       const agentText = response.text || '';

//       // Build artifacts array
//       const artifacts = [
//         {
//           artifactId: randomUUID(),
//           name: `${agentId}Response`,
//           parts: [{ kind: 'text', text: agentText }]
//         }
//       ];

//       // Add tool results as artifacts
//       if (response.toolResults && response.toolResults.length > 0) {
//         artifacts.push({
//           artifactId: randomUUID(),
//           name: 'ToolResults',
//           parts: response.toolResults.map((result) => ({
//             kind: 'text',  // Changed from 'data' to 'text'
//             text: JSON.stringify(result)  // Convert result to JSON string
//           }))
//         });
//       }

//       // Build conversation history
//       const history = [
//         ...messagesList.map((msg) => ({
//           kind: 'message',
//           role: msg.role,
//           parts: msg.parts,
//           messageId: msg.messageId || randomUUID(),
//           taskId: msg.taskId || taskId || randomUUID(),
//         })),
//         {
//           kind: 'message',
//           role: 'agent',
//           parts: [{ kind: 'text', text: agentText }],
//           messageId: randomUUID(),
//           taskId: taskId || randomUUID(),
//         }
//       ];

//       // Return A2A-compliant response
//       return c.json({
//         jsonrpc: '2.0',
//         id: requestId,
//         result: {
//           id: taskId || randomUUID(),
//           contextId: contextId || randomUUID(),
//           status: {
//             state: 'completed',
//             timestamp: new Date().toISOString(),
//             message: {
//               messageId: randomUUID(),
//               role: 'agent',
//               parts: [{ kind: 'text', text: agentText }],
//               kind: 'message'
//             }
//           },
//           artifacts,
//           history,
//           kind: 'task'
//         }
//       });

//     } catch (error:any) {
//       return c.json({
//         jsonrpc: '2.0',
//         id: null,
//         error: {
//           code: -32603,
//           message: 'Internal error',
//           data: { details: error?.message || 'Unknown error' }
//         }
//       }, 500);
//     }
//   }
// });


// import { registerApiRoute } from '@mastra/core/server';
// import { randomUUID } from 'crypto';

// // Define message part types with all fields
// interface MessagePart {
//   kind: 'text' | 'data' | string;
//   text?: string | null;
//   data?: any;
//   file_url?: string | null;
// }

// // Define message structure
// interface MessageStructure {
//   kind?: string;
//   role?: string;
//   parts?: MessagePart[];
//   messageId?: string;
//   taskId?: string | null;
//   metadata?: any;
// }

// interface A2ARequestBody {
//   jsonrpc: string;
//   id: string | number | null;
//   method?: string;
//   params?: {
//     message?: any | MessageStructure;
//     messageId?: string;
//     configuration?: any;
//     [key: string]: any;
//   };
// }

// // Helper function to extract text from complex message structure
// function extractUserMessage(message: any): string {
//   if (typeof message === 'string') {
//     return message.trim();
//   }

//   if (message && typeof message === 'object') {
//     if (Array.isArray(message.parts)) {
//       // Look for the LAST text part (most recent message)
//       const textParts = message.parts.filter(
//         (part: any) => part.kind === 'text' && typeof part.text === 'string'
//       );
      
//       if (textParts.length > 0) {
//         // Get the last text part
//         const lastPart = textParts[textParts.length - 1];
//         const text = lastPart.text.trim();
        
//         // Clean HTML if present
//         if (text.startsWith('<p>')) {
//           return text
//             .replace(/<p>/g, '')
//             .replace(/<\/p>/g, '\n')
//             .replace(/&nbsp;/g, ' ')
//             .trim();
//         }
        
//         return text;
//       }
//     }

//     if (typeof message.text === 'string') {
//       return message.text.trim();
//     }

//     if (typeof message.content === 'string') {
//       return message.content.trim();
//     }
//   }

//   return '';
// }

// export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
//   method: 'POST',
//   handler: async (c) => {
//     try {
//       const mastra = c.get('mastra');
//       const agentId = c.req.param('agentId');
//       const body = await c.req.json<A2ARequestBody>();

//       console.log('📥 Received A2A request for agent:', agentId);
//       console.log('📋 Request body:', JSON.stringify(body, null, 2));

//       const { jsonrpc, id: requestId, params } = body;

//       // Validate JSON-RPC structure
//       if (jsonrpc !== '2.0' || requestId == null) {
//         console.error('❌ Invalid JSON-RPC request');
//         return c.json(
//           {
//             jsonrpc: '2.0',
//             id: requestId || null,
//             error: { code: -32600, message: 'Invalid Request' },
//           },
//           400
//         );
//       }

//       // Get the agent
//       const agent = mastra.getAgent(agentId);
//       if (!agent) {
//         console.error(`❌ Agent '${agentId}' not found`);
//         return c.json(
//           {
//             jsonrpc: '2.0',
//             id: requestId,
//             error: {
//               code: -32603,
//               message: 'Internal error',
//               data: { details: `Agent with name ${agentId} not found` },
//             },
//           },
//           500
//         );
//       }

//       // Extract user message
//       const userMessage = extractUserMessage(params?.message);

//       if (!userMessage) {
//         console.warn('⚠️  No valid message found, using default greeting');
//       }

//       const finalMessage = userMessage || "Hello! I'm here to chat with you.";

//       console.log('💬 Processing message:', finalMessage);

//       // Generate IDs for tracking
//       const taskId = randomUUID();
//       const contextId = randomUUID();
//       const agentMessageId = randomUUID();
//       const userMessageId = params?.messageId || randomUUID();

//       // Generate response from agent
//       const startTime = Date.now();
//       const response = await agent.generate([
//         { role: 'user', content: finalMessage },
//       ]);
//       const duration = Date.now() - startTime;

//       const agentText =
//         response.text || "I'm here to listen and chat with you.";

//       console.log(`✅ Response generated in ${duration}ms`);
//       console.log('🤖 Agent response:', agentText.substring(0, 100) + '...');

//       // Build artifacts array (following the example format)
//       const artifacts: any[] = [
//         {
//           artifactId: randomUUID(),
//           name: 'companionResponse',
//           parts: [
//             {
//               kind: 'text',
//               text: agentText,
//               data: null,
//               file_url: null,
//             },
//           ],
//         },
//       ];

//       // Add tool results if available (matching the example structure)
//       if (response.toolResults && response.toolResults.length > 0) {
//         artifacts.push({
//           artifactId: randomUUID(),
//           name: 'ToolResults',
//           parts: [
//             {
//               kind: 'data',
//               text: null,
//               data: {
//                 results: response.toolResults,
//               },
//               file_url: null,
//             },
//           ],
//         });
//       }

//       // Build history - only include current exchange (like the example)
//       const history: MessageStructure[] = [
//         {
//           kind: 'message',
//           role: 'user',
//           parts: [
//             {
//               kind: 'text',
//               text: finalMessage,
//               data: null,
//               file_url: null,
//             },
//           ],
//           messageId: userMessageId,
//           taskId: null,
//           metadata: null,
//         },
//       ];

//       // Return properly structured A2A response matching Telex format
//       return c.json({
//         jsonrpc: '2.0',
//         id: requestId,
//         result: {
//           id: taskId,
//           contextId: contextId,
//           status: {
//             state: 'completed',
//             timestamp: new Date().toISOString(),
//             message: {
//               kind: 'message',
//               role: 'agent',
//               parts: [
//                 {
//                   kind: 'text',
//                   text: agentText,
//                   data: null,
//                   file_url: null,
//                 },
//               ],
//               messageId: agentMessageId,
//               taskId: null,
//               metadata: null,
//             },
//           },
//           artifacts: artifacts,
//           history: history,
//           kind: 'task',
//         },
//       });
//     } catch (error: any) {
//       console.error('❌ Error processing A2A request:', error);
//       return c.json(
//         {
//           jsonrpc: '2.0',
//           id: null,
//           error: {
//             code: -32603,
//             message: 'Internal error',
//             data: { details: error?.message || 'Unknown error' },
//           },
//         },
//         500
//       );
//     }
//   },
// });

import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

export const a2aAgentRoute = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    try {
      const mastra = c.get('mastra');
      const agentId = c.req.param('agentId');

      // Parse JSON-RPC 2.0 request
      const body = await c.req.json();
      const { jsonrpc, id: requestId, method, params } = body;

      // Validate JSON-RPC 2.0 format
      if (jsonrpc !== '2.0' || !requestId) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId || null,
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc must be "2.0" and id is required'
          }
        }, 400);
      }

      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32602,
            message: `Agent '${agentId}' not found`
          }
        }, 404);
      }

      // Extract messages from params
      const { message, messages, contextId, taskId, metadata } = params || {};

      let messagesList = [];
      if (message) {
        messagesList = [message];
      } else if (messages && Array.isArray(messages)) {
        messagesList = messages;
      }

      // Convert A2A messages to Mastra format
      const mastraMessages = messagesList.map((msg) => ({
        role: msg.role,
        content: msg.parts?.map((part: {kind:string; text:string; data: object}) => {
          if (part.kind === 'text') return part.text;
          if (part.kind === 'data') return JSON.stringify(part.data);
          return '';
        }).join('\n') || ''
      }));

      // Execute agent
      const response = await agent.generate(mastraMessages);
      const agentText = response.text || '';

      // Build artifacts array
      const artifacts: any = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [{ kind: 'text', text: agentText }]
        }
      ];

      // Add tool results as artifacts
      if (response.toolResults && response.toolResults.length > 0) {
        artifacts.push({
          artifactId: randomUUID(),
          name: 'ToolResults',
          parts: response.toolResults.map((result) => ({
            kind: 'data',
            data: result
          }))
        });
      }

      // Build conversation history
      const history = [
        ...messagesList.map((msg) => ({
          kind: 'message',
          role: msg.role,
          parts: msg.parts,
          messageId: msg.messageId || randomUUID(),
          taskId: msg.taskId || taskId || randomUUID(),
        })),
        {
          kind: 'message',
          role: 'agent',
          parts: [{ kind: 'text', text: agentText }],
          messageId: randomUUID(),
          taskId: taskId || randomUUID(),
        }
      ];

      // Return A2A-compliant response
      return c.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: 'completed',
            timestamp: new Date().toISOString(),
            message: {
              messageId: randomUUID(),
              role: 'agent',
              parts: [{ kind: 'text', text: agentText }],
              kind: 'message'
            }
          },
          artifacts,
          history,
          kind: 'task'
        }
      });

    } catch (error: any) {
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: { details: error.message || 'Unknown error'}
        }
      }, 500);
    }
  }
});
