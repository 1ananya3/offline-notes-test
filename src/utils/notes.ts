import axios from 'axios';
import {
  storeOfflineNote,
  getOfflineNote,
  getOfflineNotes,
  deleteOfflineNote,
  editOfflineNote
} from '../../public/indexeddb';

export interface Note {
  id?: number; // Used by datastore
  localId?: string;

  localDeleteSynced?: boolean;
  localEditSynced?: boolean;

  title: string;
  content?: string;
  tags?: string[];
  createdAt: Date;
}

function createServerNote(note: Note) {
  const serverNote: Note = {
    title: note.title,
    content: note.content,
    tags: note.tags,
    localId: note.localId,
    createdAt: note.createdAt
  }
  return serverNote
}

export function createNote(noteTitle: string, content: string = '', tags: string[] = []) {
  const note: Note = {
    title: noteTitle,
    content: content,
    tags: Array.isArray(tags) ? tags : [],
    localId: crypto.randomUUID(),
    createdAt: new Date()
  };
  return note;
}

export async function submitNote(note: Note) {
  // Store note locally first
  await storeOfflineNote(note);

  if (navigator.onLine) {
    try {
      console.log('Submitting note to server:', note);
      const response = await fetch('/api/save-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: note.title,
          content: note.content || '',
          tags: Array.isArray(note.tags) ? note.tags : [],
          localId: note.localId,
          createdAt: note.createdAt
        }),
      });

      if (response.ok) {
        const savedNote = await response.json();
        console.log('Note submitted successfully:', savedNote);
        
        // Update the note with server ID and sync status
        note.id = savedNote.id;
        note.localEditSynced = undefined;
        await editOfflineNote(note);
        
        return savedNote;
      } else {
        console.error('Failed to submit note:', response.statusText);
        note.localEditSynced = false;
        await editOfflineNote(note);
        throw new Error('Failed to submit note: ' + response.statusText);
      }
    } catch (error) {
      console.error('Failed to submit note:', error);
      note.localEditSynced = false;
      await editOfflineNote(note);
      throw error;
    }
  } else {
    // Offline mode - mark as not synced
    note.localEditSynced = false;
    await editOfflineNote(note);
  }
}

export async function deleteNote(noteId: string) {
  try {
    console.log('Starting delete operation for noteId:', noteId);
    
    // If online, try to delete from server first
    if (navigator.onLine) {
      try {
        console.log('Online - attempting to delete from server with ID:', noteId);
        
        const response = await fetch(`/api/delete-note?id=${noteId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server returned ${response.status}`);
        }

        console.log('Successfully deleted from server');
        
        // After successful server deletion, delete from IndexedDB
        await deleteOfflineNote(noteId);
      } catch (error) {
        console.error('Error deleting from server:', error);
        // If server deletion fails, mark for sync later
        const note = await getOfflineNote(noteId);
        if (note) {
          note.localDeleteSynced = false;
          await editOfflineNote(note);
        }
        throw error;
      }
    } else {
      // Offline - mark for sync later
      console.log('Offline - marking note for deletion sync later');
      const note = await getOfflineNote(noteId);
      if (note) {
        note.localDeleteSynced = false;
        await editOfflineNote(note);
      }
    }
  } catch (error) {
    console.error('Failed to delete note:', error);
    throw error;
  }
}

export async function editNote(noteId: string, updatedTitle: string, updatedContent: string, updatedTags: string[] = []) {
  try {
    console.log('Starting edit operation for noteId:', noteId);
    
    // If online, try to update on server first
    if (navigator.onLine) {
      try {
        console.log('Online - attempting to update on server with ID:', noteId);
        
        const response = await fetch(`/api/edit-note?id=${noteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: updatedTitle,
            content: updatedContent,
            tags: updatedTags
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server returned ${response.status}`);
        }

        console.log('Successfully updated on server');
        
        // After successful server update, update in IndexedDB
        const note = await getOfflineNote(noteId);
        if (note) {
          note.title = updatedTitle;
          note.content = updatedContent;
          note.tags = updatedTags;
          note.localEditSynced = undefined;
          await editOfflineNote(note);
          console.log('Updated local storage after server sync');
        }
        return note;
      } catch (error) {
        console.error('Error updating on server:', error);
        // If server update fails, mark for sync later
        const note = await getOfflineNote(noteId);
        if (note) {
          note.title = updatedTitle;
          note.content = updatedContent;
          note.tags = updatedTags;
          note.localEditSynced = false;
          await editOfflineNote(note);
          console.log('Marked note for sync later due to server error');
        }
        throw error;
      }
    } else {
      // Offline - mark for sync later
      console.log('Offline - marking note for edit sync later');
      const note = await getOfflineNote(noteId);
      if (note) {
        note.title = updatedTitle;
        note.content = updatedContent;
        note.tags = updatedTags;
        note.localEditSynced = false;
        await editOfflineNote(note);
        console.log('Note saved locally and marked for sync when online');
      }
      return note;
    }
  } catch (error) {
    console.error('Failed to edit note:', error);
    throw error;
  }
}

export async function updateSavedNote(serverNote: Note, localNotes: Note[]) {
  const matchingSyncedLocalNote = localNotes.find(
    (localNote: Note) => localNote.id === serverNote.id
  );
  if (matchingSyncedLocalNote === undefined) {
    const matchingUnsyncedLocalNote = localNotes.find(
      (localNote: Note) => localNote.localId === serverNote.localId
    );
    if (matchingUnsyncedLocalNote !== undefined) {
      matchingUnsyncedLocalNote.id = serverNote.id;
      await editOfflineNote(matchingUnsyncedLocalNote);
    } else {
      serverNote.localId = crypto.randomUUID();
      await storeOfflineNote(serverNote);
    }
  }
}

export async function updateEditedNote(serverNote: Note, localNotes: Note[]) {
  const matchingLocalNote = localNotes.find((localNote: Note) => localNote.id === serverNote.id);
  if (matchingLocalNote !== undefined) {
    if (matchingLocalNote.localEditSynced === false) {
      await axios.put(`/api/edit-note?id=${matchingLocalNote.id}`, { 
        title: matchingLocalNote.title,
        tags: matchingLocalNote.tags
      });
      matchingLocalNote.localEditSynced = undefined;
      await editOfflineNote(matchingLocalNote);
    } else if (matchingLocalNote.localEditSynced === undefined) {
      matchingLocalNote.title = serverNote.title;
      matchingLocalNote.tags = serverNote.tags;
      await editOfflineNote(matchingLocalNote);
    }
  }
}

export async function updateDeletedNote(serverId: number, localNotes: Note[]) {
  const matchingLocalNote = localNotes.find((localNote: Note) => localNote.id === serverId);
  if (matchingLocalNote !== undefined) {
    await deleteOfflineNote(matchingLocalNote.localId);
  }
}

// Helper functions for server operations
const fetchNotesFromServer = async (): Promise<Note[]> => {
  const response = await fetch('/api/notes');
  if (!response.ok) throw new Error('Failed to fetch notes');
  return response.json();
};

const deleteNoteFromServer = async (id: string): Promise<void> => {
  const response = await fetch(`/api/delete-note?id=${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete note');
};

const updateNoteOnServer = async (id: string, data: Partial<Note>): Promise<void> => {
  const response = await fetch(`/api/edit-note?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update note');
};

// Helper functions for local storage operations
const getLocalNotes = (): Note[] => {
  const notes = localStorage.getItem('notes');
  return notes ? JSON.parse(notes) : [];
};

const updateLocalNote = (localId: string, updates: Partial<Note>): void => {
  const notes = getLocalNotes();
  const updatedNotes = notes.map((note: Note) => 
    note.localId === localId ? { ...note, ...updates } : note
  );
  localStorage.setItem('notes', JSON.stringify(updatedNotes));
};

const removeLocalNote = (localId: string): void => {
  const notes = getLocalNotes();
  const updatedNotes = notes.filter((note: Note) => note.localId !== localId);
  localStorage.setItem('notes', JSON.stringify(updatedNotes));
};

export const refreshNotes = async (): Promise<void> => {
  try {
    if (!navigator.onLine) {
      console.log('Offline - skipping refresh');
      return;
    }

    // Get local notes that need syncing
    const localNotes = getLocalNotes();
    const unsyncedLocalNotes = localNotes.filter((note: Note) => 
      !note.localEditSynced || !note.localDeleteSynced
    );

    if (unsyncedLocalNotes.length === 0) {
      console.log('No notes to sync');
      return;
    }

    // Get server notes to compare
    const serverNotes = await fetchNotesFromServer();
    
    // Handle deletions first
    const localDeleteNotes = localNotes.filter((note: Note) => note.localDeleteSynced === false);
    for (const note of localDeleteNotes) {
      if (note.id && note.localId) {
        try {
          await deleteNoteFromServer(String(note.id));
          removeLocalNote(String(note.localId));
        } catch (error) {
          console.error('Error syncing deletion:', error);
        }
      }
    }

    // Handle new and edited notes
    for (const localNote of unsyncedLocalNotes) {
      try {
        if (localNote.id && localNote.localId) {
          // Update existing note
          await updateNoteOnServer(String(localNote.id), {
            title: localNote.title,
            content: localNote.content,
            tags: localNote.tags
          });
          updateLocalNote(String(localNote.localId), { localEditSynced: true });
        } else if (localNote.localId) {
          // Create new note
          const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: localNote.title,
              content: localNote.content,
              tags: localNote.tags
            })
          });
          
          if (!response.ok) throw new Error('Failed to create note');
          
          const savedNote = await response.json();
          updateLocalNote(String(localNote.localId), {
            id: savedNote.id,
            localEditSynced: true
          });
        }
      } catch (error) {
        console.error('Error syncing note:', error);
      }
    }
  } catch (error) {
    console.error('Error refreshing notes:', error);
  }
};

export const getNotes = async (): Promise<Note[]> => {
  try {
    let serverNotes: Note[] = [];
    
    if (navigator.onLine) {
      try {
        serverNotes = await fetchNotesFromServer();
      } catch (error) {
        console.error('Error fetching server notes:', error);
      }
    }

    const localNotes = getLocalNotes();
    
    // Only include unsynced local notes in the final list
    const unsyncedLocalNotes = localNotes.filter((note: Note) => 
      !note.localEditSynced || !note.localDeleteSynced
    );

    // Merge server notes with unsynced local notes
    const mergedNotes = [...serverNotes];
    
    for (const localNote of unsyncedLocalNotes) {
      if (localNote.id) {
        const existingNoteIndex = mergedNotes.findIndex(n => n.id === localNote.id);
        if (existingNoteIndex === -1) {
          mergedNotes.push(localNote);
        }
      } else {
        mergedNotes.push(localNote);
      }
    }

    return mergedNotes;
  } catch (error) {
    console.error('Error getting notes:', error);
    return getLocalNotes();
  }
};