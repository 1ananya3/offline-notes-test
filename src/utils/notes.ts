import axios from 'axios';
import {
  storeOfflineNote,
  getOfflineNote,
  getOfflineNotes as getOfflineNotesFromDB,
  deleteOfflineNote,
  editOfflineNote
} from '../../public/indexeddb';

export interface Note {
  localId: string;
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
        
        // Update the note with sync status
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

export async function deleteNote(localId: string) {
  try {
    console.log('Starting delete operation for localId:', localId);
    
    if (!localId) {
      console.error('No localId provided for deletion');
      throw new Error('No localId provided for deletion');
    }

    // First delete from IndexedDB
    await deleteOfflineNote(localId);
    console.log('Successfully deleted from IndexedDB');
    
    // If online, try to delete from server
    if (navigator.onLine) {
      try {
        console.log('Online - attempting to delete from server with localId:', localId);
        
        const response = await fetch(`/api/delete-note?local_id=${localId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server deletion failed:', errorData);
          throw new Error(errorData.error || `Server returned ${response.status}`);
        }

        console.log('Successfully deleted from server');
      } catch (error) {
        console.error('Error deleting from server:', error);
        // If server deletion fails, restore the note in IndexedDB
        const note = await getOfflineNote(localId);
        if (note) {
          note.localDeleteSynced = false;
          await editOfflineNote(note);
          console.log('Marked note for deletion sync later');
        }
        throw error;
      }
    } else {
      // Offline - mark for sync later
      console.log('Offline - marking note for deletion sync later');
      const note = await getOfflineNote(localId);
      if (note) {
        note.localDeleteSynced = false;
        await editOfflineNote(note);
        console.log('Successfully marked note for sync');
      }
    }
  } catch (error) {
    console.error('Failed to delete note:', error);
    throw error;
  }
}

export async function editNote(localId: string, updatedTitle: string, updatedContent: string, updatedTags: string[] = []) {
  try {
    console.log('Starting edit operation for localId:', localId);
    
    // If online, try to update on server first
    if (navigator.onLine) {
      try {
        console.log('Online - attempting to update on server with localId:', localId);
        
        const response = await fetch(`/api/edit-note?local_id=${localId}`, {
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
        const note = await getOfflineNote(localId);
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
        const note = await getOfflineNote(localId);
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
      const note = await getOfflineNote(localId);
      if (note) {
        note.title = updatedTitle;
        note.content = updatedContent;
        note.tags = updatedTags;
        note.localEditSynced = false;
        await editOfflineNote(note);
      }
    }
  } catch (error) {
    console.error('Failed to edit note:', error);
    throw error;
  }
}

export async function updateSavedNote(serverNote: Note, localNotes: Note[]) {
  const matchingSyncedLocalNote = localNotes.find(
    (localNote: Note) => localNote.localId === serverNote.localId
  );
  if (matchingSyncedLocalNote === undefined) {
    const matchingUnsyncedLocalNote = localNotes.find(
      (localNote: Note) => localNote.localId === serverNote.localId
    );
    if (matchingUnsyncedLocalNote !== undefined) {
      matchingUnsyncedLocalNote.localId = serverNote.localId;
      await editOfflineNote(matchingUnsyncedLocalNote);
    } else {
      serverNote.localId = crypto.randomUUID();
      await storeOfflineNote(serverNote);
    }
  }
}

export async function updateEditedNote(serverNote: Note, localNotes: Note[]) {
  const matchingLocalNote = localNotes.find((localNote: Note) => localNote.localId === serverNote.localId);
  if (matchingLocalNote !== undefined) {
    if (matchingLocalNote.localEditSynced === false) {
      await axios.put(`/api/edit-note?local_id=${matchingLocalNote.localId}`, { 
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
  const matchingLocalNote = localNotes.find((localNote: Note) => localNote.localId === serverId.toString());
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
      if (note.localId) {
        try {
          await deleteNoteFromServer(String(note.localId));
          removeLocalNote(String(note.localId));
        } catch (error) {
          console.error('Error syncing deletion:', error);
        }
      }
    }

    // Handle new and edited notes
    for (const localNote of unsyncedLocalNotes) {
      try {
        if (localNote.localId) {
          // Update existing note
          await updateNoteOnServer(String(localNote.localId), {
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
            localId: savedNote.localId,
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
        console.log('Fetched server notes:', serverNotes);
        
        // Ensure all server notes have localId
        serverNotes = serverNotes.map(note => {
          if (!note.localId) {
            console.warn('Server note missing localId, adding one:', note);
            return {
              ...note,
              localId: crypto.randomUUID()
            };
          }
          return note;
        });

        // Sync server notes to IndexedDB
        for (const serverNote of serverNotes) {
          const existingNote = await getOfflineNote(serverNote.localId);
          if (!existingNote) {
            // If note doesn't exist in IndexedDB, store it
            await storeOfflineNote(serverNote);
          } else if (existingNote.localEditSynced === undefined) {
            // If note exists but hasn't been edited locally, update it
            await editOfflineNote(serverNote);
          }
        }
      } catch (error) {
        console.error('Error fetching server notes:', error);
      }
    }

    // Get all notes from IndexedDB
    const localNotes = await getOfflineNotes();
    console.log('Fetched local notes:', localNotes);
    
    // Only include unsynced local notes in the final list
    const unsyncedLocalNotes = localNotes.filter((note: Note) => 
      note.localId && (!note.localEditSynced || !note.localDeleteSynced)
    );

    // Merge server notes with unsynced local notes
    const mergedNotes = [...serverNotes];
    
    for (const localNote of unsyncedLocalNotes) {
      if (!localNote.localId) {
        console.warn('Local note missing localId, skipping:', localNote);
        continue;
      }
      const existingNoteIndex = mergedNotes.findIndex(n => n.localId === localNote.localId);
      if (existingNoteIndex === -1) {
        mergedNotes.push(localNote);
      }
    }

    console.log('Final merged notes:', mergedNotes);
    return mergedNotes;
  } catch (error) {
    console.error('Error getting notes:', error);
    return getOfflineNotes();
  }
};

export const getOfflineNotes = async (): Promise<Note[]> => {
  try {
    const notes = await getOfflineNotesFromDB();
    return notes.map((note: Note) => ({
      ...note,
      localId: note.localId || crypto.randomUUID(),
      createdAt: note.createdAt ? new Date(note.createdAt) : new Date()
    }));
  } catch (error) {
    console.error('Error getting offline notes:', error);
    return [];
  }
};