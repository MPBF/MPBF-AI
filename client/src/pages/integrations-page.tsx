import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Calendar, ExternalLink, Clock, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  body?: string;
  labels?: string[];
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  htmlLink?: string;
}

export default function IntegrationsPage() {
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { data: emails, isLoading: emailsLoading } = useQuery<GmailMessage[]>({
    queryKey: ['/api/gmail/messages'],
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/gmail/unread-count'],
  });

  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar/events/upcoming'],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const extractEmail = (emailString: string) => {
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  };

  const viewEmailDetails = async (email: GmailMessage) => {
    const response = await fetch(`/api/gmail/messages/${email.id}`);
    const fullEmail = await response.json();
    setSelectedEmail(fullEmail);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">
          Integrations
        </h1>
        <p className="text-muted-foreground">
          Access your business systems and data
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="gmail" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="gmail" data-testid="tab-gmail">
              <Mail className="w-4 h-4 mr-2" />
              Gmail
              {unreadCount && unreadCount.count > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount.count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">
              <Calendar className="w-4 h-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmail">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Emails</h2>
                {unreadCount && unreadCount.count > 0 && (
                  <Badge variant="secondary">{unreadCount.count} unread</Badge>
                )}
              </div>

              {emailsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : emails && emails.length > 0 ? (
                <div className="space-y-3">
                  {emails.map((email) => (
                    <Card
                      key={email.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => viewEmailDetails(email)}
                      data-testid={`card-email-${email.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1 truncate">
                              {email.subject || "(No subject)"}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <span className="truncate">{extractEmail(email.from)}</span>
                              <span className="text-xs">•</span>
                              <span className="text-xs whitespace-nowrap">{formatDate(email.date)}</span>
                            </CardDescription>
                          </div>
                          {email.labels?.includes('UNREAD') && (
                            <Badge variant="default" className="ml-2">Unread</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {email.snippet}
                        </p>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Mail className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No emails found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Upcoming Events</h2>

              {eventsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : upcomingEvents && upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <Card
                      key={event.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setSelectedEvent(event)}
                      data-testid={`card-event-${event.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1">
                              {event.summary}
                            </CardTitle>
                            <CardDescription className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{formatDate(event.start)}</span>
                              </div>
                              {event.location && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  <span className="text-xs truncate">{event.location}</span>
                                </div>
                              )}
                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Users className="w-3 h-3" />
                                  <span className="text-xs">{event.attendees.length} attendees</span>
                                </div>
                              )}
                            </CardDescription>
                          </div>
                          {event.htmlLink && (
                            <Button
                              size="icon"
                              variant="ghost"
                              asChild
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`button-open-event-${event.id}`}
                            >
                              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No upcoming events</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedEmail?.subject || "(No subject)"}</DialogTitle>
            <DialogDescription>
              From: {selectedEmail && extractEmail(selectedEmail.from)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              <div className="text-sm">
                <div className="font-semibold mb-1">To:</div>
                <div className="text-muted-foreground">{selectedEmail?.to}</div>
              </div>
              <div className="text-sm">
                <div className="font-semibold mb-1">Date:</div>
                <div className="text-muted-foreground">
                  {selectedEmail && formatDate(selectedEmail.date)}
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="whitespace-pre-wrap text-sm">
                  {selectedEmail?.body || selectedEmail?.snippet}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.summary}</DialogTitle>
            <DialogDescription>
              {selectedEvent && formatDate(selectedEvent.start)} - {selectedEvent && formatDate(selectedEvent.end)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEvent?.description && (
              <div>
                <div className="font-semibold mb-2">Description</div>
                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
              </div>
            )}
            {selectedEvent?.location && (
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
              </div>
            )}
            {selectedEvent?.attendees && selectedEvent.attendees.length > 0 && (
              <div>
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Attendees ({selectedEvent.attendees.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.attendees.map((email) => (
                    <Badge key={email} variant="secondary">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {selectedEvent?.htmlLink && (
              <div className="pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <a href={selectedEvent.htmlLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Google Calendar
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
