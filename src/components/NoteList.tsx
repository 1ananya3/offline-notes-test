import { useCallback, useEffect, useState, useMemo } from 'react';
import { Container, Heading } from '../styles/styled';
import { SpinnerContainer } from './LoadingSpinner';
import { Note,
  createNote, submitNote, deleteNote, editNote, refreshNotes, getNotes,
} from '../utils/notes'

import styled from 'styled-components';

import NoteForm from './NoteForm';
import NoteItem from './NoteItem';
import OfflineIndicator from './OfflineIndicator';

const NotesContainer = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NoteListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%; /* Adjust the width to a percentage value */
  margin: auto; /* Add margin: auto to center the wrapper */
`;

const NoteListLoadingSpinner = styled(SpinnerContainer)`
  margin-top: 20px;
  margin-bottom: 10px;
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
  width: 100%;
  max-width: 800px;
`;

const FilterTag = styled.button<{ active: boolean }>`
  background-color: ${props => props.active ? '#3b82f6' : '#e2e8f0'};
  color: ${props => props.active ? 'white' : '#1e293b'};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.active ? '#2563eb' : '#cbd5e1'};
  }
`;

const NoNotesMessage = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 2rem 0;
  text-align: center;
`;

export default function NoteList() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allNotes.forEach(note => {
        if (Array.isArray(note.tags)) {
          note.tags.forEach(tag => tags.add(tag));
        }
        
    });
    return Array.from(tags).sort();
  }, [allNotes]);

  const filteredNotes = useMemo(() => {
    if (selectedTags.length === 0) return allNotes;
    return allNotes.filter(note => 
      note.tags?.length && selectedTags.every(tag => note.tags?.includes(tag))
    );
  }, [allNotes, selectedTags]);

  const handleNoteSubmit = useCallback(async (noteTitle: string, content: string, tags: string[]) => {
    try {
      const note = createNote(noteTitle, content, tags);
      console.log('Creating new note:', note);
      
      const savedNote = await submitNote(note);
      console.log('Note submitted successfully:', savedNote);
      
      // Optimistically update the UI
      setAllNotes(prevNotes => [...prevNotes, note]);
      
      // Then refresh to ensure consistency
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);
    } catch (error) {
      console.error('Error submitting note:', error);
      // Refresh notes to ensure UI is in sync with server
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);
    }
  }, []);

  const handleNoteDelete = useCallback(async (noteId: number) => {
    try {
      console.log('Starting note deletion in NoteList:', noteId);
      
      // Find the note to get its id
      const noteToDelete = allNotes.find(note => note.id === noteId);
      if (!noteToDelete) {
        throw new Error('Note not found');
      }

      console.log('Found note to delete:', noteToDelete);

      // Optimistically update the UI first
      setAllNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      
      // Then perform the actual deletion using the id
      await deleteNote(String(noteToDelete.id));
      
      // Refresh notes to ensure consistency
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);
    } catch (error) {
      console.error('Error in handleNoteDelete:', error);
      // Show more specific error message
      alert(error instanceof Error ? error.message : 'Failed to delete note. Please try again.');
      // Refresh notes to ensure UI is in sync with server
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);
    }
  }, [allNotes]);

  const handleEditNote = useCallback(async (noteId: string, updatedTitle: string, updatedContent: string, updatedTags: string[]) => {
    try {
      console.log('Starting note edit in NoteList:', { noteId, updatedTitle });
      
      // Optimistically update the UI first
      setAllNotes(prevNotes => 
        prevNotes.map(note => 
          note.localId === noteId 
            ? { ...note, title: updatedTitle, content: updatedContent, tags: updatedTags }
            : note
        )
      );

      // Then perform the actual edit
      await editNote(noteId, updatedTitle, updatedContent, updatedTags);
      
      // Refresh notes to ensure consistency
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);
    } catch (error) {
      console.error('Error in handleEditNote:', error);
      alert('Failed to edit note. Please try again.');
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);
    }
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);

    // Simulate a longer loading time (e.g., 2 seconds)
    // await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await refreshNotes();
      setAllNotes(await getNotes());
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { type: 'module' })
        .then((registration) => {
          console.log('Service Worker registered:', registration);
  
          // Listen for the "online" event to trigger sync
          window.addEventListener('online', async () => {
            registration.sync.register('sync-notes')
              .then(() => {
                console.log('Sync event registered');
              })
              .catch((error) => {
                console.error('Sync event registration failed:', error);
              });
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    window.addEventListener('online', async () => {
      await fetchNotes();
    })

  }, [fetchNotes]);

  return (
    <NotesContainer>
      <Heading>Notes</Heading>
      <NoteListWrapper>
        <NoteForm onNoteSubmit={handleNoteSubmit} />
        {allTags.length > 0 && (
          <FilterContainer>
            {allTags.map(tag => (
              <FilterTag
                key={tag}
                active={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </FilterTag>
            ))}
          </FilterContainer>
        )}
        {loading && <NoteListLoadingSpinner />}
        {!loading && filteredNotes.length === 0 ? (
          <NoNotesMessage>
            {selectedTags.length > 0
              ? "No notes match the selected tags"
              : "No notes yet. Add your first note!"}
          </NoNotesMessage>
        ) : (
          <ul>
            {filteredNotes.map((note, index) => (
              <NoteItem
                key={index}
                note={note}
                onDeleteNote={handleNoteDelete}
                onEditNote={handleEditNote}
              />
            ))}
          </ul>
        )}
      </NoteListWrapper>
      <OfflineIndicator />
    </NotesContainer>
  );
}