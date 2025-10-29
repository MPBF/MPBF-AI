import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings?.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !connectionSettings.settings || !accessToken) {
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

async function getUncachableGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  htmlLink?: string;
}

export interface CreateEventOptions {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
}

export class GoogleCalendarService {
  async listEvents(maxResults: number = 20, timeMin?: string): Promise<CalendarEvent[]> {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      maxResults,
      timeMin: timeMin || new Date().toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    return events.map(event => ({
      id: event.id!,
      summary: event.summary || 'Untitled Event',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
      htmlLink: event.htmlLink || undefined,
    }));
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId,
    });

    if (!response.data) {
      return null;
    }

    const event = response.data;
    return {
      id: event.id!,
      summary: event.summary || 'Untitled Event',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
      htmlLink: event.htmlLink || undefined,
    };
  }

  async createEvent(options: CreateEventOptions): Promise<CalendarEvent> {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: options.summary,
        description: options.description,
        start: {
          dateTime: options.start,
          timeZone: 'UTC',
        },
        end: {
          dateTime: options.end,
          timeZone: 'UTC',
        },
        location: options.location,
        attendees: options.attendees?.map(email => ({ email })),
      },
    });

    const event = response.data;
    return {
      id: event.id!,
      summary: event.summary || 'Untitled Event',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
      htmlLink: event.htmlLink || undefined,
    };
  }

  async updateEvent(eventId: string, options: Partial<CreateEventOptions>): Promise<CalendarEvent> {
    const calendar = await getUncachableGoogleCalendarClient();
    
    const updateBody: any = {};
    if (options.summary) updateBody.summary = options.summary;
    if (options.description) updateBody.description = options.description;
    if (options.start) updateBody.start = { dateTime: options.start, timeZone: 'UTC' };
    if (options.end) updateBody.end = { dateTime: options.end, timeZone: 'UTC' };
    if (options.location) updateBody.location = options.location;
    if (options.attendees) updateBody.attendees = options.attendees.map(email => ({ email }));

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: updateBody,
    });

    const event = response.data;
    return {
      id: event.id!,
      summary: event.summary || 'Untitled Event',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
      htmlLink: event.htmlLink || undefined,
    };
  }

  async deleteEvent(eventId: string): Promise<void> {
    const calendar = await getUncachableGoogleCalendarClient();
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
  }

  async getUpcomingEvents(days: number = 7): Promise<CalendarEvent[]> {
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const calendar = await getUncachableGoogleCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    return events.map(event => ({
      id: event.id!,
      summary: event.summary || 'Untitled Event',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
      attendees: event.attendees?.map(a => a.email!).filter(Boolean),
      htmlLink: event.htmlLink || undefined,
    }));
  }
}
