import { MessageSquare, Plus, Search, CheckSquare, FileText, Settings, Plug } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import type { Conversation } from "@shared/schema";
import { useState } from "react";

export function AppSidebar() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3" dir="rtl">
          <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">مودرن</h2>
            <p className="text-xs text-muted-foreground">مساعد ذكي</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <div className="mb-4">
          <Button 
            asChild 
            className="w-full justify-start gap-2" 
            size="default"
            data-testid="button-new-conversation"
          >
            <Link href="/">
              <Plus className="w-4 h-4" />
              <span dir="rtl">محادثة جديدة</span>
            </Link>
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث في المحادثات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9"
              dir="rtl"
              data-testid="input-search-conversations"
            />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel dir="rtl">التنقل</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-chat">
                    <MessageSquare className="w-4 h-4" />
                    <span dir="rtl">المحادثة</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/tasks"}>
                  <Link href="/tasks" data-testid="link-tasks">
                    <CheckSquare className="w-4 h-4" />
                    <span dir="rtl">المهام</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/knowledge"}>
                  <Link href="/knowledge" data-testid="link-knowledge">
                    <FileText className="w-4 h-4" />
                    <span dir="rtl">قاعدة المعرفة</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/integrations"}>
                  <Link href="/integrations" data-testid="link-integrations">
                    <Plug className="w-4 h-4" />
                    <span dir="rtl">التكاملات</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel dir="rtl">المحادثات الأخيرة</SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[300px]">
              <SidebarMenu>
                {filteredConversations.length === 0 ? (
                  <div className="px-2 py-8 text-center text-sm text-muted-foreground" dir="rtl">
                    لا توجد محادثات بعد
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <SidebarMenuItem key={conversation.id}>
                      <SidebarMenuButton asChild>
                        <Link 
                          href={`/chat/${conversation.id}`}
                          data-testid={`link-conversation-${conversation.id}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="truncate" dir="auto">{conversation.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3" dir="rtl">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              AK
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">أبو خالد</p>
            <p className="text-xs text-muted-foreground">المدير</p>
          </div>
          <Button variant="ghost" size="icon" data-testid="button-settings">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
