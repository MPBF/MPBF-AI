import {
  conversations,
  messages,
  tasks,
  businessProcesses,
  settings,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Task,
  type InsertTask,
  type UpdateTask,
  type BusinessProcess,
  type InsertBusinessProcess,
  type Settings,
  type UpdateSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Conversations
  getConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, title: string): Promise<Conversation | undefined>;
  
  // Messages
  getMessages(conversationId: string): Promise<Message[]>;
  getCurrentMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  // Business Processes
  getBusinessProcesses(): Promise<BusinessProcess[]>;
  getBusinessProcess(id: string): Promise<BusinessProcess | undefined>;
  createBusinessProcess(process: InsertBusinessProcess): Promise<BusinessProcess>;
  deleteBusinessProcess(id: string): Promise<void>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(updates: UpdateSettings): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  // Conversations
  async getConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations).orderBy(desc(conversations.updatedAt));
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: string, title: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  // Messages
  async getMessages(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async getCurrentMessages(): Promise<Message[]> {
    const latestConversation = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(1);
    
    if (latestConversation.length === 0) {
      return [];
    }

    return await this.getMessages(latestConversation[0].id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, insertMessage.conversationId));
    
    return message;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Business Processes
  async getBusinessProcesses(): Promise<BusinessProcess[]> {
    return await db.select().from(businessProcesses).orderBy(desc(businessProcesses.updatedAt));
  }

  async getBusinessProcess(id: string): Promise<BusinessProcess | undefined> {
    const [process] = await db.select().from(businessProcesses).where(eq(businessProcesses.id, id));
    return process || undefined;
  }

  async createBusinessProcess(insertProcess: InsertBusinessProcess): Promise<BusinessProcess> {
    const [process] = await db
      .insert(businessProcesses)
      .values(insertProcess)
      .returning();
    return process;
  }

  async deleteBusinessProcess(id: string): Promise<void> {
    await db.delete(businessProcesses).where(eq(businessProcesses.id, id));
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const [existingSettings] = await db.select().from(settings).limit(1);
    
    if (existingSettings) {
      return existingSettings;
    }
    
    // Create default settings if none exist
    const [newSettings] = await db
      .insert(settings)
      .values({})
      .returning();
    
    return newSettings;
  }

  async updateSettings(updates: UpdateSettings): Promise<Settings> {
    const currentSettings = await this.getSettings();
    
    const [updatedSettings] = await db
      .update(settings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(settings.id, currentSettings.id))
      .returning();
    
    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();
