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
      // Create a proper filename with timestamp and original name
      const timestamp = Date.now();
      const originalName = file.name || 'recording.webm';
      const fileName = `${meetingId}/${timestamp}_${originalName}`;

      console.log(`Uploading recording to: ${fileName}`);
      console.log(`File size: ${file.size} bytes`);
      console.log(`File type: ${file.type}`);

      // Use the user's session token (not service key) for RLS to work properly
      const { data, error } = await this.supabase.storage
        .from('meeting-recordings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        
        // Provide specific error messages for common issues
        if (error.message.includes('row-level security')) {
          throw new Error(`Storage permission denied. Please ensure meeting-recordings bucket has proper RLS policies for authenticated users. Error: ${error.message}`);
        } else if (error.message.includes('not found')) {
          throw new Error(`Storage bucket 'meeting-recordings' not found. Please check bucket configuration.`);
        } else if (error.message.includes('exceeded')) {
          throw new Error(`File size limit exceeded. Maximum file size allowed is 50MB.`);
        } else {
          throw new Error(`Failed to upload recording: ${error.message}`);
        }
      }

      console.log('Upload successful:', data);

      // Get public URL (bucket is now public, so this will work)
      const { data: { publicUrl } } = this.supabase.storage
        .from('meeting-recordings')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);

      // Update meeting notes with recording URL
      const notes = await this.getMeetingNotes(meetingId);
      
      if (notes) {
        const { data: updatedNotes, error: updateError } = await this.supabase
          .from('meeting_notes')
          .update({ 
            recording_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('meeting_id', meetingId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating notes with recording URL:', updateError);
        }
      } else {
        // Create new notes entry with recording URL
        const { data: newNotes, error: insertError } = await this.supabase
          .from('meeting_notes')
          .insert([{
            meeting_id: meetingId,
            recording_url: publicUrl,
            created_by: this.currentUser.id
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating notes with recording URL:', insertError);
        }
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw error; // Don't return mock URL, throw the actual error
    }
  }

  // AI TRANSCRIPTION using Edge Function
  async transcribeRecording(file, meetingId) {
    try {
      console.log('Starting transcription process:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        meetingId: meetingId
      });

      // Convert file to base64 for Edge function
      const reader = new FileReader();
      const fileBase64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('File converted to base64, length:', fileBase64.length);

      // Use service key for transcription
      const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

      // Call Edge function for transcription
      console.log('Calling transcribe-meeting edge function...');
      const { data, error } = await this.supabase.functions.invoke('transcribe-meeting', {
        body: {
          audio_base64: fileBase64,
          filename: file.name,
          meeting_id: meetingId,
          file_type: file.type
        },
        headers: {
          'Authorization': `Bearer ${serviceKey}`
        }
      });

      if (error) {
        console.error('Transcription error:', error);
        console.warn('Edge function failed, using fallback transcription');
        return this.mockTranscription(file);
      }

      console.log('Transcription response:', data);

      // Save transcript to database if we have a meetingId
      if (data && data.transcript && meetingId) {
        const notes = await this.getMeetingNotes(meetingId);
        const fullTranscript = data.transcript;

        if (notes) {
          await this.supabase
            .from('meeting_notes')
            .update({
              transcript: fullTranscript,
              updated_at: new Date().toISOString()
            })
            .eq('meeting_id', meetingId);
        } else {
          await this.supabase
            .from('meeting_notes')
            .insert([{
              meeting_id: meetingId,
              content: fullTranscript,
              transcript: fullTranscript,
              created_by: this.currentUser.id
            }]);
        }

        return fullTranscript;
      }

      return data?.transcript || this.mockTranscription(file);
    } catch (error) {
      console.error('Error in transcription process:', error);
      return this.mockTranscription(file);
    }
  }

  // Fallback mock transcription
  mockTranscription(file) {
    console.warn('Using mock transcription - Edge function not available');
    
    const timestamp = new Date().toLocaleString();
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    
    return `Meeting Transcript - ${timestamp}

File Information:
- Recording: ${file.name}
- Size: ${fileSizeMB} MB
- Type: ${file.type}

Attendees Present:
- ${this.userName}
- Meeting Participants

Discussion Points:
1. Meeting recorded using ${file.name.replace(/\.[^/.]+$/, '')} 
   - Audio captured successfully
   - Key discussion points covered
   - Decisions and action items noted

2. Next Steps
   - Review recording as needed
   - Follow up on action items
   - Schedule follow-up meetings

Recording Details:
- Duration: Estimated ${Math.floor(file.size / 100000)} minutes
- Quality: ${file.type} format

[Note: This is a placeholder transcript. Real transcription requires Edge function setup with OpenAI/AssemblyAI integration]
[The actual audio recording has been saved to Supabase storage and can be played back from the meetings interface]`;
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
    const actionItems = await this.getActionItems(meetingId);

    // Format content for PDF
    const content = {
      title: meeting.title,
      date: new Date(meeting.start_time).toLocaleString(),
      location: meeting.location || 'Not specified',
      attendees: attendees.map(a => `${a.name || a.email} (${a.status})`),
      agenda: agendaItems.map(a => `• ${a.title}: ${a.description || 'No description'}`),
      notes: notes?.content || 'No notes recorded',
      transcript: notes?.transcript || '',
      actionItems: actionItems.map(a => ({
        description: a.description,
        assignedTo: a.assigned_to_name,
        dueDate: a.due_date ? new Date(a.due_date).toLocaleDateString() : 'Not specified',
        status: a.status
      })),
      rawData: {
        meeting,
        attendees,
        agendaItems,
        notes,
        actionItems
      }
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

  // Get all past meetings with recordings
  async getMeetingsWithRecordings(includeUnsaved = false) {
    const results = [];

    // First, get saved recordings from database
    const { data, error } = await this.supabase
      .from('meeting_notes')
      .select(`
        meeting_id,
        recording_url,
        transcript,
        content,
        meetings!inner (
          id,
          title,
          start_time,
          end_time,
          location,
          meeting_type
        )
      `)
      .not('recording_url', 'is', null)
      .order('meetings(start_time)', { ascending: false });

    if (!error && data) {
      // Add saved recordings
      data.forEach(item => {
        results.push({
          id: item.meeting_id,
          title: item.meetings.title,
          start_time: item.meetings.start_time,
          end_time: item.meetings.end_time,
          location: item.meetings.location,
          meeting_type: item.meetings.meeting_type,
          recording_url: item.recording_url,
          has_transcript: !!item.transcript,
          notes: item.content,
          is_saved: true
        });
      });
    }

    // If requested, also get unsaved recordings from storage bucket
    if (includeUnsaved) {
      try {
        console.log('Fetching unsaved recordings from storage...');

        // List all files in the meeting-recordings bucket
        const { data: files, error: storageError } = await this.supabase.storage
          .from('meeting-recordings')
          .list('', {
            limit: 1000,  // Increased limit to get all files
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        console.log('Storage files found:', files);

        if (!storageError && files) {
          // Get all meetings to match with recordings
          const { data: allMeetings } = await this.supabase
            .from('meetings')
            .select('*')
            .eq('site_id', this.currentSite)
            .order('start_time', { ascending: false });

          // Also check for nested folders
          let allFiles = [...files];

          // Check if any items are folders (they won't have extensions)
          for (const item of files) {
            if (item.name && !item.name.includes('.') && item.id) {
              // This might be a folder, try to list its contents
              const { data: folderFiles } = await this.supabase.storage
                .from('meeting-recordings')
                .list(item.name, {
                  limit: 100,
                  offset: 0
                });

              if (folderFiles) {
                // Add folder files with full path
                folderFiles.forEach(file => {
                  allFiles.push({
                    ...file,
                    name: `${item.name}/${file.name}`,
                    fullPath: `${item.name}/${file.name}`
                  });
                });
              }
            }
          }

          // Process all files
          for (const file of allFiles) {
            const filePath = file.fullPath || file.name;

            // Skip empty placeholders and non-audio files
            if (!filePath || filePath.includes('.emptyFolderPlaceholder')) continue;

            // Only process audio files (including those with recording_ prefix)
            const isAudioFile = filePath.match(/\.(webm|mp3|wav|m4a|mp4|ogg)$/i) ||
                               filePath.includes('recording_');

            if (!isAudioFile && !filePath.includes('recording')) continue;

            // Get public URL for the file
            const { data: { publicUrl } } = this.supabase.storage
              .from('meeting-recordings')
              .getPublicUrl(filePath);

            // Check if this recording is already in our results
            const alreadySaved = results.some(r => r.recording_url === publicUrl);

            if (!alreadySaved) {
              // Parse the file path
              const pathParts = filePath.split('/');
              let meetingId = null;
              let fileName = pathParts[pathParts.length - 1];

              // If in a folder, folder name might be meeting ID
              if (pathParts.length > 1) {
                meetingId = pathParts[0];
              }

              // Try to find matching meeting
              let meeting = null;
              if (meetingId && allMeetings) {
                meeting = allMeetings.find(m => m.id === meetingId);
              }

              // Try to match by date from filename
              if (!meeting && allMeetings) {
                const dateMatch = fileName.match(/^(\d{4}-\d{2}-\d{2})/);
                if (dateMatch) {
                  const fileDate = dateMatch[1];
                  meeting = allMeetings.find(m => {
                    const meetingDate = new Date(m.start_time).toISOString().split('T')[0];
                    return meetingDate === fileDate;
                  });
                }
              }

              // Special handling for timestamp-based recordings
              let displayName = fileName;
              let recordingDate = file.created_at;

              if (fileName.match(/^recording_\d+/)) {
                const timestamp = fileName.match(/recording_(\d+)/)?.[1];
                if (timestamp) {
                  const date = new Date(parseInt(timestamp));
                  displayName = `Recording from ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                  recordingDate = date.toISOString();
                }
              }

              results.push({
                id: meetingId || `unsaved_${filePath}`,
                title: meeting ? meeting.title : displayName,
                start_time: meeting ? meeting.start_time : recordingDate,
                end_time: meeting ? meeting.end_time : null,
                location: meeting ? meeting.location : 'Audio Recording',
                meeting_type: meeting ? meeting.meeting_type : 'recording',
                recording_url: publicUrl,
                has_transcript: false,
                notes: '',
                is_saved: false,
                file_name: fileName,
                file_path: filePath,
                file_size: file.metadata?.size || file.size || 0,
                created_at: recordingDate
              });
            }
          }
        } else if (storageError) {
          console.error('Storage error:', storageError);
        }
      } catch (error) {
        console.error('Error fetching storage recordings:', error);
      }
    }

    // Sort by start_time/created_at descending
    results.sort((a, b) => {
      const dateA = new Date(a.start_time || a.created_at);
      const dateB = new Date(b.start_time || b.created_at);
      return dateB - dateA;
    });

    return results;
  }

  // Generate PDF from past recording
  async generatePDFFromRecording(meetingId, recordingUrl = null) {
    try {
      // Check if it's an unsaved recording
      if (typeof meetingId === 'string' && meetingId.startsWith('unsaved_')) {
        // For unsaved recordings, we need to transcribe first
        if (!recordingUrl) {
          throw new Error('Recording URL required for unsaved recordings');
        }

        // Create a basic PDF content structure
        const fileName = meetingId.replace('unsaved_', '');
        return {
          title: `Transcription of: ${fileName}`,
          date: new Date().toLocaleString(),
          location: 'Audio Recording',
          attendees: [],
          agenda: [],
          notes: 'This recording needs to be transcribed. Please use the transcribe function first.',
          transcript: '',
          actionItems: []
        };
      }

      const pdfContent = await this.exportMeetingToPDF(meetingId);
      const notes = await this.getMeetingNotes(meetingId);

      // If there's a transcript, use it; otherwise use notes
      if (notes?.transcript) {
        pdfContent.notes = notes.transcript;
        pdfContent.transcript = notes.transcript;
      } else if (notes?.content) {
        pdfContent.notes = notes.content;
      }

      return pdfContent;
    } catch (error) {
      console.error('Error generating PDF from recording:', error);
      throw error;
    }
  }

  // Transcribe an unsaved recording
  async transcribeUnsavedRecording(recordingUrl, fileName) {
    try {
      // Fetch the audio file from the URL
      const response = await fetch(recordingUrl);
      const blob = await response.blob();

      // Create a File object
      const file = new File([blob], fileName, { type: blob.type });

      // Use the existing transcription method
      const transcript = await this.transcribeRecording(file, null);

      return transcript;
    } catch (error) {
      console.error('Error transcribing unsaved recording:', error);
      throw error;
    }
  }

  // Find a specific recording by name
  async findRecording(recordingName) {
    try {
      // Try direct path first
      const { data: directFile } = await this.supabase.storage
        .from('meeting-recordings')
        .list('', {
          search: recordingName
        });

      if (directFile && directFile.length > 0) {
        const { data: { publicUrl } } = this.supabase.storage
          .from('meeting-recordings')
          .getPublicUrl(directFile[0].name);
        return { found: true, url: publicUrl, file: directFile[0] };
      }

      // If not found, search all files
      const allRecordings = await this.getMeetingsWithRecordings(true);
      const found = allRecordings.find(r =>
        r.file_name?.includes(recordingName) ||
        r.file_path?.includes(recordingName)
      );

      if (found) {
        return { found: true, url: found.recording_url, file: found };
      }

      return { found: false, message: `Recording ${recordingName} not found in storage` };
    } catch (error) {
      console.error('Error finding recording:', error);
      return { found: false, error: error.message };
    }
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