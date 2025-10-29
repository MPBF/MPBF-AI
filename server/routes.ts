import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertTaskSchema, insertBusinessProcessSchema } from "@shared/schema";
import { generateAIResponse } from "./openai";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);
        
        ws.send(JSON.stringify({ type: 'ack', data: message }));
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Conversations API
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const conversation = await storage.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const data = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(data);
      broadcast({ type: 'conversation_created', data: conversation });
      res.json(conversation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Messages API
  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.conversationId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/messages/current", async (req, res) => {
    try {
      const messages = await storage.getCurrentMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/messages/:conversationId?", async (req, res) => {
    try {
      const { content } = req.body;
      let conversationId = req.params.conversationId;

      // Create a new conversation if none exists
      if (!conversationId) {
        const conversation = await storage.createConversation({
          title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        });
        conversationId = conversation.id;
      }

      // Save user message
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content,
      });

      broadcast({ type: 'message_created', data: userMessage });

      // Get conversation history for context (including the user message we just saved)
      const conversationMessages = await storage.getMessages(conversationId);
      
      // Generate AI response with full conversation context
      const aiContent = await generateAIResponse(
        conversationMessages.map(m => ({ role: m.role, content: m.content }))
      );

      // Save AI message
      const aiMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: aiContent,
      });

      broadcast({ type: 'message_created', data: aiMessage });

      res.json({ userMessage, aiMessage, conversationId });
    } catch (error: any) {
      console.error('Message creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Tasks API
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const data = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(data);
      broadcast({ type: 'task_created', data: task });
      res.json(task);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateTask(req.params.id, req.body);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      broadcast({ type: 'task_updated', data: task });
      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      broadcast({ type: 'task_deleted', data: { id: req.params.id } });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Knowledge Base API
  app.get("/api/knowledge", async (req, res) => {
    try {
      const processes = await storage.getBusinessProcesses();
      res.json(processes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/knowledge/:id", async (req, res) => {
    try {
      const process = await storage.getBusinessProcess(req.params.id);
      if (!process) {
        return res.status(404).json({ error: "Knowledge entry not found" });
      }
      res.json(process);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/knowledge", async (req, res) => {
    try {
      const data = insertBusinessProcessSchema.parse(req.body);
      const process = await storage.createBusinessProcess(data);
      broadcast({ type: 'knowledge_created', data: process });
      res.json(process);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/knowledge/:id", async (req, res) => {
    try {
      await storage.deleteBusinessProcess(req.params.id);
      broadcast({ type: 'knowledge_deleted', data: { id: req.params.id } });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
