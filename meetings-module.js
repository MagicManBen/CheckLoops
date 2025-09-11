// Meetings Module - Full Supabase Integration
// This module provides complete meetings functionality with database persistence

export class MeetingsManager {
  constructor(supabase) {
    this.supabase = supabase;
    this.currentUser = null;
    this.currentSite = null;
    this.userProfile = null;
  }

  // Set current user and site context
  async setContext(session) {
    this.currentUser = session.user;
    
    // Get user profile and site
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .select('site_id, role, full_name')
      .eq('user_id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error fetching profile:', error);
      // Fallback to session metadata
      this.currentSite = session.user.raw_user_meta_data?.site_id || null;
      this.userRole = session.user.raw_user_meta_data?.role || 'Staff';
      this.userName = session.user.email;
    } else {
      this.userProfile = profile;
      this.currentSite = profile.site_id;
      this.userRole = profile.role;
      this.userName = profile.full_name || session.user.email;
    }
  }

  // MEETINGS CRUD OPERATIONS
  async createMeeting(meetingData) {
    const meeting = {
      title: meetingData.title,
      description: meetingData.description,
      start_time: meetingData.start,
      end_time: meetingData.end,
      location: meetingData.location || 'Conference Room',
      site_id: this.currentSite,
      created_by: this.currentUser.id,
      status: 'scheduled',
      meeting_type: meetingData.meeting_type || 'general'
    };

    const { data, error } = await this.supabase
      .from('meetings')
      .insert([meeting])
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }

    // Add creator as attendee with accepted status
    await this.addAttendee(data.id, this.currentUser.id, this.userName, 'accepted');

    return data;
  }

  async getMeetings(startDate, endDate) {
    let query = this.supabase
      .from('meetings')
      .select('*')
      .eq('site_id', this.currentSite)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }

    return data || [];
  }

  async updateMeeting(meetingId, updates) {
    // Prepare update object, mapping fields correctly
    const updateData = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.start) updateData.start_time = updates.start;
    if (updates.end) updateData.end_time = updates.end;
    if (updates.location) updateData.location = updates.location;
    if (updates.status) updateData.status = updates.status;
    if (updates.meeting_type) updateData.meeting_type = updates.meeting_type;

    const { data, error } = await this.supabase
      .from('meetings')
      .update(updateData)
      .eq('id', meetingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }

    return data;
  }

  async deleteMeeting(meetingId) {
    // Delete meeting (cascade will handle related records)
    const { error } = await this.supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }

    return true;
  }

  // ATTENDEE MANAGEMENT
  async addAttendee(meetingId, userId, name, status = 'pending') {
    const attendee = {
      meeting_id: meetingId,
      user_id: userId,
      name: name,
      email: this.currentUser.email,
      status: status
    };

    const { data, error } = await this.supabase
      .from('meeting_attendees')
      .insert([attendee])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (attendee already exists)
      if (error.code === '23505') {
        return await this.updateAttendeeStatus(meetingId, userId, status);
      }
      console.error('Error adding attendee:', error);
      throw error;
    }

    return data;
  }

  async updateAttendeeStatus(meetingId, userId, status) {
    const { data: existing } = await this.supabase
      .from('meeting_attendees')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing attendee
      const { data, error } = await this.supabase
        .from('meeting_attendees')
        .update({ 
          status: status,
          responded_at: new Date().toISOString()
        })
        .eq('meeting_id', meetingId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating attendee status:', error);
        throw error;
      }

      return data;
    } else {
      // Create new attendee record
      return await this.addAttendee(meetingId, userId, this.userName, status);
    }
  }

  async getMeetingAttendees(meetingId) {
    const { data, error } = await this.supabase
      .from('meeting_attendees')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching attendees:', error);
      return [];
    }

    return data || [];
  }

  // AGENDA ITEMS
  async createAgendaItem(agendaData) {
    const item = {
      meeting_id: agendaData.meeting_id,
      title: agendaData.title,
      description: agendaData.description,
      submitted_by: this.currentUser.id,
      submitter_name: this.userName,
      order_index: agendaData.order_index || 0,
      status: 'pending'
    };

    const { data, error } = await this.supabase
      .from('agenda_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating agenda item:', error);
      throw error;
    }

    return data;
  }

  async getAgendaItems(meetingId) {
    const { data, error } = await this.supabase
      .from('agenda_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching agenda items:', error);
      return [];
    }

    return data || [];
  }

  async updateAgendaItem(itemId, updates) {
    const { data, error } = await this.supabase
      .from('agenda_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agenda item:', error);
      throw error;
    }

    return data;
  }

  async deleteAgendaItem(itemId) {
    const { error } = await this.supabase
      .from('agenda_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting agenda item:', error);
      throw error;
    }

    return true;
  }

  // MEETING NOTES
  async saveMeetingNotes(meetingId, content) {
    // Check if notes already exist
    const { data: existing } = await this.supabase
      .from('meeting_notes')
      .select('id')
      .eq('meeting_id', meetingId)
      .single();

    if (existing) {
      // Update existing notes
      const { data, error } = await this.supabase
        .from('meeting_notes')
        .update({ 
          content: content,
          updated_at: new Date().toISOString()
        })
        .eq('meeting_id', meetingId)
        .select()
        .single();

      if (error) {
        console.error('Error updating meeting notes:', error);
        throw error;
      }

      return data;
    } else {
      // Create new notes
      const { data, error } = await this.supabase
        .from('meeting_notes')
        .insert([{
          meeting_id: meetingId,
          content: content,
          created_by: this.currentUser.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating meeting notes:', error);
        throw error;
      }

      return data;
    }
  }

  async getMeetingNotes(meetingId) {
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', meetingId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
      console.error('Error fetching meeting notes:', error);
    }

    return data;
  }

  // FILE UPLOADS (using Supabase Storage)
  async uploadMeetingRecording(meetingId, file) {
    try {
      const fileName = `${meetingId}/${Date.now()}_${file.name}`;
      
      const { data, error } = await this.supabase.storage
        .from('meeting-recordings')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(fileName);

      // Update meeting notes with recording URL
      const notes = await this.getMeetingNotes(meetingId);
      const { data: updatedNotes, error: updateError } = await this.supabase
        .from('meeting_notes')
        .update({ recording_url: publicUrl })
        .eq('meeting_id', meetingId)
        .select()
        .single();

      if (updateError && !notes) {
        // Create new notes entry with recording URL
        await this.supabase
          .from('meeting_notes')
          .insert([{
            meeting_id: meetingId,
            recording_url: publicUrl,
            created_by: this.currentUser.id
          }]);
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error;
    }
  }

  // AI TRANSCRIPTION using Edge Function
  async transcribeRecording(file, meetingId) {
    try {
      // First upload the file
      const recordingUrl = await this.uploadMeetingRecording(meetingId, file);
      
      // Convert file to base64 for Edge function
      const reader = new FileReader();
      const fileBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call Edge function for transcription
      const { data, error } = await this.supabase.functions.invoke('transcribe-meeting', {
        body: {
          audio_base64: fileBase64,
          filename: file.name,
          meeting_id: meetingId,
          file_type: file.type
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        // Fallback to mock transcription
        return this.mockTranscription(file);
      }

      // Save transcript to database
      if (data && data.transcript) {
        const notes = await this.getMeetingNotes(meetingId);
        if (notes) {
          await this.supabase
            .from('meeting_notes')
            .update({ 
              transcript: data.transcript,
              recording_url: recordingUrl
            })
            .eq('meeting_id', meetingId);
        } else {
          await this.supabase
            .from('meeting_notes')
            .insert([{
              meeting_id: meetingId,
              transcript: data.transcript,
              recording_url: recordingUrl,
              created_by: this.currentUser.id
            }]);
        }
      }

      return data?.transcript || this.mockTranscription(file);
    } catch (error) {
      console.error('Error in transcription process:', error);
      return this.mockTranscription(file);
    }
  }

  // Fallback mock transcription
  mockTranscription(file) {
    return `Meeting Transcript - ${new Date().toLocaleDateString()}

Attendees Present:
- ${this.userName}
- Team Members

Discussion Points:
1. ${file.name.replace(/\.[^/.]+$/, '')} Review
   - Key points discussed
   - Decisions made

2. Action Items
   - Follow-up required
   - Next steps identified

Meeting Duration: ${Math.floor(file.size / 1000000)} minutes (estimated)

[Note: This is a placeholder transcript. Real transcription requires Edge function setup]`;
  }

  // CALENDAR INTEGRATION
  formatForFullCalendar(meetings) {
    return meetings.map(meeting => ({
      id: meeting.id,
      title: meeting.title,
      start: meeting.start_time,
      end: meeting.end_time,
      extendedProps: {
        description: meeting.description,
        location: meeting.location,
        status: meeting.status,
        meeting_type: meeting.meeting_type,
        created_by: meeting.created_by
      }
    }));
  }

  // SEARCH AND FILTER
  async searchMeetings(query) {
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('site_id', this.currentSite)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error searching meetings:', error);
      return [];
    }

    return data || [];
  }

  async getPastMeetings(limit = 10) {
    const now = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('site_id', this.currentSite)
      .lt('start_time', now)
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching past meetings:', error);
      return [];
    }

    return data || [];
  }

  async getUpcomingMeetings(limit = 10) {
    const now = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('site_id', this.currentSite)
      .gte('start_time', now)
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming meetings:', error);
      return [];
    }

    return data || [];
  }

  // EXPORT FUNCTIONS
  async exportMeetingToPDF(meetingId) {
    const { data: meeting } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (!meeting) return null;

    const attendees = await this.getMeetingAttendees(meetingId);
    const agendaItems = await this.getAgendaItems(meetingId);
    const notes = await this.getMeetingNotes(meetingId);

    // Format content for PDF
    const content = {
      title: meeting.title,
      date: new Date(meeting.start_time).toLocaleString(),
      location: meeting.location,
      attendees: attendees.map(a => `${a.name || a.email} (${a.status})`),
      agenda: agendaItems.map(a => `• ${a.title}: ${a.description || 'No description'}`),
      notes: notes?.content || 'No notes recorded'
    };

    return content;
  }

  // AI-ENHANCED PDF GENERATION
  async generateEnhancedPDF(meetingId, notes) {
    try {
      // Get meeting details
      const { data: meeting } = await this.supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single();

      if (!meeting) throw new Error('Meeting not found');

      // Get attendees and agenda
      const attendees = await this.getMeetingAttendees(meetingId);
      const agendaItems = await this.getAgendaItems(meetingId);

      // Call Edge function to enhance notes with AI
      const { data, error } = await this.supabase.functions.invoke('enhance-meeting-notes', {
        body: {
          meeting_title: meeting.title,
          meeting_date: meeting.start_time,
          raw_notes: notes,
          agenda_items: agendaItems.map(a => ({ title: a.title, description: a.description })),
          attendees: attendees.map(a => a.name || a.email)
        }
      });

      if (error) {
        console.error('AI enhancement error:', error);
        // Fallback to basic formatting
        return this.basicFormatNotes(notes, meeting, attendees, agendaItems);
      }

      return data?.enhanced_notes || this.basicFormatNotes(notes, meeting, attendees, agendaItems);
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      return notes; // Return original notes as fallback
    }
  }

  // Basic formatting fallback
  basicFormatNotes(notes, meeting, attendees, agendaItems) {
    let formatted = `Meeting Title: ${meeting.title}\n`;
    formatted += `Date: ${new Date(meeting.start_time).toLocaleString()}\n`;
    formatted += `Location: ${meeting.location || 'Not specified'}\n\n`;
    
    formatted += 'Attendees:\n';
    attendees.forEach(a => {
      formatted += `• ${a.name || a.email} (${a.status})\n`;
    });
    
    formatted += '\nAgenda Items:\n';
    agendaItems.forEach(a => {
      formatted += `• ${a.title}: ${a.description || 'No description'}\n`;
    });
    
    formatted += '\nMeeting Notes:\n';
    formatted += notes;
    
    return formatted;
  }

  // STATISTICS
  async getMeetingStats() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Get all meetings for site
    const { data: allMeetings } = await this.supabase
      .from('meetings')
      .select('id, start_time')
      .eq('site_id', this.currentSite);

    const meetings = allMeetings || [];
    const nowISO = now.toISOString();

    return {
      total: meetings.length,
      upcoming: meetings.filter(m => m.start_time >= nowISO).length,
      past: meetings.filter(m => m.start_time < nowISO).length,
      thisMonth: meetings.filter(m => 
        m.start_time >= currentMonthStart && m.start_time <= currentMonthEnd
      ).length
    };
  }

  // ACTION ITEMS
  async createActionItem(actionData) {
    const item = {
      meeting_id: actionData.meeting_id,
      description: actionData.description,
      assigned_to: actionData.assigned_to,
      assigned_to_name: actionData.assigned_to_name,
      due_date: actionData.due_date,
      status: 'pending'
    };

    const { data, error } = await this.supabase
      .from('meeting_action_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating action item:', error);
      throw error;
    }

    return data;
  }

  async getActionItems(meetingId) {
    const { data, error } = await this.supabase
      .from('meeting_action_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching action items:', error);
      return [];
    }

    return data || [];
  }

  async updateActionItem(itemId, updates) {
    if (updates.status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('meeting_action_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) {
      console.error('Error updating action item:', error);
      throw error;
    }

    return data;
  }
}

// Export for use in staff-meetings.html
window.MeetingsManager = MeetingsManager;