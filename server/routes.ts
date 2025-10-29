import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertTaskSchema, insertBusinessProcessSchema } from "@shared/schema";
import { generateAIResponse } from "./openai";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { GmailService } from "./gmail";
import { GoogleCalendarService } from "./googleCalendar";

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

  // Object Storage API
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/attachments", async (req, res) => {
    if (!req.body.attachmentURL) {
      return res.status(400).json({ error: "attachmentURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.attachmentURL);
      
      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error: any) {
      console.error("Error setting attachment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Gmail API
  app.get("/api/gmail/messages", async (req, res) => {
    try {
      const gmailService = new GmailService();
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string) : 20;
      const query = req.query.q as string | undefined;
      const messages = await gmailService.listMessages(maxResults, query);
      res.json(messages);
    } catch (error: any) {
      console.error("Gmail error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Gmail not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/gmail/messages/:id", async (req, res) => {
    try {
      const gmailService = new GmailService();
      const message = await gmailService.getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error: any) {
      console.error("Gmail error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Gmail not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/gmail/send", async (req, res) => {
    try {
      const gmailService = new GmailService();
      const { to, subject, body, cc, bcc } = req.body;
      if (!to || !subject || !body) {
        return res.status(400).json({ error: "to, subject, and body are required" });
      }
      const result = await gmailService.sendMessage({ to, subject, body, cc, bcc });
      res.json(result);
    } catch (error: any) {
      console.error("Gmail send error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Gmail not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/gmail/unread-count", async (req, res) => {
    try {
      const gmailService = new GmailService();
      const count = await gmailService.getUnreadCount();
      res.json({ count });
    } catch (error: any) {
      console.error("Gmail error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Gmail not connected", available: false, count: 0 });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Google Calendar API
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const calendarService = new GoogleCalendarService();
      const maxResults = req.query.maxResults ? parseInt(req.query.maxResults as string) : 20;
      const timeMin = req.query.timeMin as string | undefined;
      const events = await calendarService.listEvents(maxResults, timeMin);
      res.json(events);
    } catch (error: any) {
      console.error("Calendar error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Calendar not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/calendar/events/upcoming", async (req, res) => {
    try {
      const calendarService = new GoogleCalendarService();
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const events = await calendarService.getUpcomingEvents(days);
      res.json(events);
    } catch (error: any) {
      console.error("Calendar error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Calendar not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/calendar/events/:id", async (req, res) => {
    try {
      const calendarService = new GoogleCalendarService();
      const event = await calendarService.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error: any) {
      console.error("Calendar error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Calendar not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/calendar/events", async (req, res) => {
    try {
      const calendarService = new GoogleCalendarService();
      const { summary, description, start, end, location, attendees } = req.body;
      if (!summary || !start || !end) {
        return res.status(400).json({ error: "summary, start, and end are required" });
      }
      const event = await calendarService.createEvent({ summary, description, start, end, location, attendees });
      res.json(event);
    } catch (error: any) {
      console.error("Calendar create error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Calendar not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/calendar/events/:id", async (req, res) => {
    try {
      const calendarService = new GoogleCalendarService();
      const event = await calendarService.updateEvent(req.params.id, req.body);
      res.json(event);
    } catch (error: any) {
      console.error("Calendar update error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Calendar not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/calendar/events/:id", async (req, res) => {
    try {
      const calendarService = new GoogleCalendarService();
      await calendarService.deleteEvent(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Calendar delete error:", error);
      if (error.message?.includes('not connected') || error.message?.includes('X_REPLIT_TOKEN')) {
        return res.status(503).json({ error: "Calendar not connected", available: false });
      }
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
