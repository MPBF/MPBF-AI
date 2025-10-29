import OpenAI from "openai";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export async function generateAIResponse(
  messages: Array<{ role: string; content: string }>,
  systemContext?: string
): Promise<string> {
  const systemMessage = systemContext || 
    `You are Modern, an intelligent AI assistant working for AbuKhalid's company. Your role is to:
    - Help with business processes and tasks
    - Remember all information shared with you
    - Follow instructions and orders from AbuKhalid
    - Be professional, helpful, and proactive
    - Learn and understand the business context
    - Suggest improvements and track tasks when appropriate
    
    Always respond in a helpful, professional manner and remember context from previous messages.`;

  try {
    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-5",
      messages: [
        { role: "system", content: systemMessage },
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
