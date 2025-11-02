import { registerApiRoute } from "@mastra/core/server";
import { randomUUID } from "crypto";

interface A2AMessage {
  role: string;
  parts?: Array<{
    kind: string;
    text?: string;
    data?: any;
  }>;
  messageId?: string;
  taskId?: string;
}

interface A2ARequestParams {
  message?: A2AMessage;
  messages?: A2AMessage[];
  contextId?: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

interface A2ARequestBody {
  jsonrpc: string;
  id: string | number | null;
  method: string;
  params?: A2ARequestParams;
}

export const a2aAgentRoute = registerApiRoute("/a2a/agent/:agentId", {
  method: "POST",
  handler: async (c) => {
    try {
      const mastra = c.get("mastra");
      const agentId = c.req.param("agentId");

      // Parse JSON-RPC 2.0 request
      const body = await c.req.json<A2ARequestBody>();
      const { jsonrpc, id: requestId, method, params } = body;

      // Validate JSON-RPC 2.0 format
      if (jsonrpc !== "2.0" || !requestId) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId || null,
            error: {
              code: -32600,
              message:
                'Invalid Request: jsonrpc must be "2.0" and id is required',
            },
          },
          400
        );
      }

      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json(
          {
            jsonrpc: "2.0",
            id: requestId,
            error: {
              code: -32602,
              message: `Agent '${agentId}' not found`,
            },
          },
          404
        );
      }

      // Extract messages from params
      const { message, messages, contextId, taskId, metadata } = params || {};

      let messagesList: A2AMessage[] = [];
      if (message) {
        messagesList = [message];
      } else if (messages && Array.isArray(messages)) {
        messagesList = messages;
      }

      // Convert A2A messages to Mastra format - pass as a single string or proper message format
      const lastMessage = messagesList[messagesList.length - 1];
      const userMessage =
        lastMessage?.parts
          ?.map((part) => {
            if (part.kind === "text") return part.text || "";
            if (part.kind === "data") return JSON.stringify(part.data);
            return "";
          })
          .join("\n") || "";

      // Execute agent with just the message content
      const response = await agent.generate(userMessage);
      const agentText = response.text || "";

      // Build artifacts array
      const artifacts = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [{ kind: "text", text: agentText }],
        },
      ];

      // Add tool results as artifacts
      if (response.toolResults && response.toolResults.length > 0) {
        artifacts.push({
          artifactId: randomUUID(),
          name: "ToolResults",
          parts: response.toolResults.map((result: any) => ({
            kind: "text", // Changed from 'data' to 'text'
            text: JSON.stringify(result), // Convert data to text string
          })),
        });
      }

      // Build conversation history
      const history = [
        ...messagesList.map((msg) => ({
          kind: "message",
          role: msg.role,
          parts: msg.parts || [],
          messageId: msg.messageId || randomUUID(),
          taskId: msg.taskId || taskId || randomUUID(),
        })),
        {
          kind: "message",
          role: "agent",
          parts: [{ kind: "text", text: agentText }],
          messageId: randomUUID(),
          taskId: taskId || randomUUID(),
        },
      ];

      // Return A2A-compliant response
      return c.json({
        jsonrpc: "2.0",
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: "completed",
            timestamp: new Date().toISOString(),
            message: {
              messageId: randomUUID(),
              role: "agent",
              parts: [{ kind: "text", text: agentText }],
              kind: "message",
            },
          },
          artifacts,
          history,
          kind: "task",
        },
      });
    } catch (error: any) {
      return c.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32603,
            message: "Internal error",
            data: { details: error?.message || "Unknown error" },
          },
        },
        500
      );
    }
  },
});
