import type { Conversation, Message, Task, BusinessProcess } from "@shared/schema";

// Export conversations to JSON
export function exportConversationsToJSON(conversations: Conversation[]): void {
  const dataStr = JSON.stringify(conversations, null, 2);
  downloadFile(dataStr, `conversations-${getDateString()}.json`, "application/json");
}

// Export conversations with messages to JSON
export function exportConversationsWithMessagesToJSON(
  conversations: Conversation[],
  allMessages: Record<string, Message[]>
): void {
  const data = conversations.map(conv => ({
    ...conv,
    messages: allMessages[conv.id] || []
  }));
  const dataStr = JSON.stringify(data, null, 2);
  downloadFile(dataStr, `conversations-full-${getDateString()}.json`, "application/json");
}

// Export conversations to Markdown
export function exportConversationsToMarkdown(
  conversations: Conversation[],
  allMessages: Record<string, Message[]>
): void {
  let markdown = "# Conversations Export\n\n";
  markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
  markdown += `Total conversations: ${conversations.length}\n\n---\n\n`;

  conversations.forEach((conv) => {
    markdown += `## ${conv.title}\n\n`;
    markdown += `**Created:** ${new Date(conv.createdAt).toLocaleString()}\n\n`;
    
    const messages = allMessages[conv.id] || [];
    if (messages.length > 0) {
      markdown += "### Messages\n\n";
      messages.forEach((msg) => {
        const sender = msg.role === "user" ? "**You**" : "**Modern**";
        markdown += `${sender} (${new Date(msg.createdAt).toLocaleTimeString()}):\n`;
        markdown += `${msg.content}\n\n`;
      });
    }
    markdown += "---\n\n";
  });

  downloadFile(markdown, `conversations-${getDateString()}.md`, "text/markdown");
}

// Export tasks to JSON
export function exportTasksToJSON(tasks: Task[]): void {
  const dataStr = JSON.stringify(tasks, null, 2);
  downloadFile(dataStr, `tasks-${getDateString()}.json`, "application/json");
}

// Export tasks to CSV
export function exportTasksToCSV(tasks: Task[]): void {
  const headers = ["ID", "Title", "Description", "Status", "Created At", "Updated At"];
  const rows = tasks.map(task => [
    task.id,
    escapeCSV(task.title),
    escapeCSV(task.description || ""),
    task.status,
    new Date(task.createdAt).toLocaleString(),
    new Date(task.updatedAt).toLocaleString()
  ]);

  const csv = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
  downloadFile(csv, `tasks-${getDateString()}.csv`, "text/csv");
}

// Export tasks to Markdown
export function exportTasksToMarkdown(tasks: Task[]): void {
  let markdown = "# Tasks Export\n\n";
  markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
  markdown += `Total tasks: ${tasks.length}\n\n`;

  const statusGroups = {
    pending: tasks.filter(t => t.status === "pending"),
    in_progress: tasks.filter(t => t.status === "in_progress"),
    completed: tasks.filter(t => t.status === "completed")
  };

  Object.entries(statusGroups).forEach(([status, statusTasks]) => {
    if (statusTasks.length > 0) {
      markdown += `## ${status.replace("_", " ").toUpperCase()}\n\n`;
      statusTasks.forEach(task => {
        markdown += `### ${task.title}\n\n`;
        if (task.description) {
          markdown += `${task.description}\n\n`;
        }
        markdown += `- **Status:** ${task.status}\n`;
        markdown += `- **Created:** ${new Date(task.createdAt).toLocaleString()}\n`;
        markdown += `- **Updated:** ${new Date(task.updatedAt).toLocaleString()}\n\n`;
      });
    }
  });

  downloadFile(markdown, `tasks-${getDateString()}.md`, "text/markdown");
}

// Export knowledge base to JSON
export function exportKnowledgeToJSON(processes: BusinessProcess[]): void {
  const dataStr = JSON.stringify(processes, null, 2);
  downloadFile(dataStr, `knowledge-base-${getDateString()}.json`, "application/json");
}

// Export knowledge base to Markdown
export function exportKnowledgeToMarkdown(processes: BusinessProcess[]): void {
  let markdown = "# Knowledge Base Export\n\n";
  markdown += `Exported on: ${new Date().toLocaleString()}\n\n`;
  markdown += `Total entries: ${processes.length}\n\n`;

  const categories = Array.from(new Set(processes.map(p => p.category)));
  
  categories.forEach(category => {
    const categoryProcesses = processes.filter(p => p.category === category);
    markdown += `## ${category}\n\n`;
    
    categoryProcesses.forEach(process => {
      markdown += `### ${process.title}\n\n`;
      markdown += `${process.description}\n\n`;
      markdown += `**Content:**\n\n${process.content}\n\n`;
      if (process.tags && process.tags.length > 0) {
        markdown += `**Tags:** ${process.tags.join(", ")}\n\n`;
      }
      markdown += `**Created:** ${new Date(process.createdAt).toLocaleString()}\n\n`;
      markdown += "---\n\n";
    });
  });

  downloadFile(markdown, `knowledge-base-${getDateString()}.md`, "text/markdown");
}

// Utility functions
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function escapeCSV(str: string): string {
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
