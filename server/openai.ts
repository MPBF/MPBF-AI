import OpenAI from "openai";
import { GmailService } from "./gmail";
import { GoogleCalendarService } from "./googleCalendar";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

async function enrichContextWithBusinessData(userMessage: string): Promise<string> {
  let additionalContext = "";

  if (!userMessage) {
    return additionalContext;
  }

  const lowerMessage = userMessage.toLowerCase();
  
  // Check if user is asking about emails
  if (lowerMessage.includes('email') || lowerMessage.includes('mail') || lowerMessage.includes('inbox')) {
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

  // Check if user is asking about calendar/schedule/meetings
  if (lowerMessage.includes('calendar') || lowerMessage.includes('meeting') || lowerMessage.includes('schedule') || lowerMessage.includes('event')) {
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
  
  // Enrich context with business data if relevant
  const businessContext = await enrichContextWithBusinessData(latestUserMessage);
  
  const baseSystemMessage = 
    `You are Modern, an intelligent AI assistant working for AbuKhalid's company. Your role is to:
    - Help with business processes and tasks
    - Remember all information shared with you
    - Follow instructions and orders from AbuKhalid
    - Be professional, helpful, and proactive
    - Learn and understand the business context
    - Suggest improvements and track tasks when appropriate
    - Access and use data from connected business systems (Gmail, Google Calendar, etc.)
    
    Always respond in a helpful, professional manner and remember context from previous messages.`;
  
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
