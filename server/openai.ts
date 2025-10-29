import OpenAI from "openai";
import { GmailService } from "./gmail";
import { GoogleCalendarService } from "./googleCalendar";
import { storage } from "./storage";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

// Detect if text contains Arabic characters
function containsArabic(text: string): boolean {
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

async function enrichContextWithBusinessData(userMessage: string): Promise<string> {
  let additionalContext = "";

  if (!userMessage) {
    return additionalContext;
  }

  const lowerMessage = userMessage.toLowerCase();
  
  // Check if user is asking about emails (in English or Arabic)
  if (lowerMessage.includes('email') || lowerMessage.includes('mail') || lowerMessage.includes('inbox') || 
      userMessage.includes('بريد') || userMessage.includes('رسائل') || userMessage.includes('إيميل')) {
    try {
      const gmailService = new GmailService();
      const recentEmails = await gmailService.listMessages(5);
      const unreadCount = await gmailService.getUnreadCount();
      
      additionalContext += `\n\nRecent Email Context:\n`;
      additionalContext += `You have ${unreadCount} unread emails.\n`;
      additionalContext += `Recent emails:\n`;
      recentEmails.forEach((email, i) => {
        additionalContext += `${i + 1}. From: ${email.from}\n   Subject: ${email.subject}\n   Date: ${email.date}\n   Snippet: ${email.snippet}\n\n`;
      });
    } catch (gmailError: any) {
      console.log('Gmail not available for context enrichment');
      // Silently fail - don't add context if Gmail isn't available
    }
  }

  // Check if user is asking about calendar/schedule/meetings (in English or Arabic)
  if (lowerMessage.includes('calendar') || lowerMessage.includes('meeting') || lowerMessage.includes('schedule') || lowerMessage.includes('event') ||
      userMessage.includes('تقويم') || userMessage.includes('اجتماع') || userMessage.includes('موعد') || userMessage.includes('جدول')) {
    try {
      const calendarService = new GoogleCalendarService();
      const upcomingEvents = await calendarService.getUpcomingEvents(7);
      
      additionalContext += `\n\nUpcoming Calendar Events:\n`;
      if (upcomingEvents.length === 0) {
        additionalContext += `No upcoming events in the next 7 days.\n`;
      } else {
        upcomingEvents.forEach((event, i) => {
          additionalContext += `${i + 1}. ${event.summary}\n   When: ${event.start}\n`;
          if (event.location) additionalContext += `   Where: ${event.location}\n`;
          if (event.attendees && event.attendees.length > 0) {
            additionalContext += `   Attendees: ${event.attendees.length} people\n`;
          }
          additionalContext += `\n`;
        });
      }
    } catch (calendarError: any) {
      console.log('Calendar not available for context enrichment');
      // Silently fail - don't add context if Calendar isn't available
    }
  }

  return additionalContext;
}

export async function generateAIResponse(
  messages: Array<{ role: string; content: string }>,
  systemContext?: string
): Promise<string> {
  // Get the latest user message for context enrichment
  const latestUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  
  // Detect if the user is writing in Arabic
  const isArabic = containsArabic(latestUserMessage);
  
  // Get custom settings
  const settings = await storage.getSettings();
  
  // Enrich context with business data if relevant
  const businessContext = await enrichContextWithBusinessData(latestUserMessage);
  
  // Use custom system instructions from settings or default
  const customInstructions = settings.systemInstructions || (isArabic
    ? `أنت مساعد ذكي متخصص في مساعدة الشركات. تتعلم من المحادثات السابقة وتتذكر كل شيء. ساعد المستخدم بطريقة احترافية ومنظمة.`
    : `You are an intelligent assistant specialized in helping businesses. You learn from previous conversations and remember everything. Help the user in a professional and organized manner.`);
  
  const assistantName = settings.assistantName || "Modern";
  
  const baseSystemMessage = isArabic
    ? `أنت ${assistantName}، مساعد ذكاء اصطناعي ذكي يعمل لدى شركة أبو خالد.
    
توجيهاتك الأولية:
${customInstructions}

قدراتك:
- المساعدة في العمليات التجارية والمهام
- تذكر جميع المعلومات المشاركة معك
- اتباع التعليمات والأوامر
- أن تكون محترفًا ومفيدًا واستباقيًا
- تعلم وفهم سياق العمل
- اقتراح التحسينات وتتبع المهام عند الاقتضاء
- الوصول إلى البيانات من الأنظمة التجارية المتصلة (Gmail، Google Calendar، إلخ) واستخدامها

دائمًا استجب بطريقة مفيدة ومهنية وتذكر السياق من الرسائل السابقة.

مهم جدًا: يجب أن تستجيب دائمًا باللغة العربية عندما يكتب المستخدم بالعربية، وبالإنجليزية عندما يكتب بالإنجليزية.`
    : `You are ${assistantName}, an intelligent AI assistant working for AbuKhalid's company.
    
Your Initial Instructions:
${customInstructions}

Your Capabilities:
- Help with business processes and tasks
- Remember all information shared with you
- Follow instructions and orders
- Be professional, helpful, and proactive
- Learn and understand the business context
- Suggest improvements and track tasks when appropriate
- Access and use data from connected business systems (Gmail, Google Calendar, etc.)

Always respond in a helpful, professional manner and remember context from previous messages.

Important: Always respond in the same language as the user. If they write in Arabic, respond in Arabic. If they write in English, respond in English.`;
  
  const systemMessage = systemContext || baseSystemMessage;
  const fullSystemMessage = businessContext 
    ? `${systemMessage}\n\n${businessContext}` 
    : systemMessage;

  try {
    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-5",
      messages: [
        { role: "system", content: fullSystemMessage },
        ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content }))
      ],
      max_completion_tokens: 8192,
    });

    return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time.";
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return "I'm experiencing high demand right now. Please try again in a moment.";
    }
    
    if (error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
      return "I'm having trouble connecting to my AI service. Please try again shortly.";
    }
    
    return "I apologize, but I encountered an error while processing your request. Please try again.";
  }
}
