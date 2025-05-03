import { useCallback, useEffect, useState, useMemo } from 'react';
import { Container, Heading } from '../styles/styled';
import { SpinnerContainer } from './LoadingSpinner';
import { Note,
  createNote, submitNote, deleteNote, editNote, refreshNotes, getNotes, getOfflineNotes,
} from '../utils/notes'

import styled from 'styled-components';
import { TAG_COLORS, tagColorMap, assignTagColors } from '../utils/tagColors';

import NoteForm from './NoteForm';
import NoteItem from './NoteItem';
import OfflineIndicator from './OfflineIndicator';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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

// Helper to darken a hex color
function darken(hex: string, amount = 0.18) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const FilterTag = styled.button<{ active: boolean; tag: string }>`
  background-color: ${({ active, tag }) =>
    active
      ? darken(tagColorMap[tag] || '#e2e8f0', 0.18)
      : tagColorMap[tag] || '#e2e8f0'};
  color: #1e293b;
  font-weight: ${({ active }) => (active ? 700 : 500)};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background-color: ${({ active, tag }) =>
      active
        ? darken(tagColorMap[tag] || '#e2e8f0', 0.28)
        : darken(tagColorMap[tag] || '#cbd5e1', 0.12)};
  }
`;

const NoNotesMessage = styled.p`
  color: #64748b;
  font-size: 1rem;
  margin: 2rem 0;
  text-align: center;
`;

const HeadingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  width: 100%;
`;

const CenteredHeading = styled(Heading)`
  flex: 1;
  text-align: center;
  margin: 0;
  font-size: 2.1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: #8f3cc8;
`;

const Subheader = styled.div`
  text-align: center;
  color: #ff9800;
  font-size: 1.08rem;
  font-weight: 400;
  margin-top: 0.2rem;
  margin-bottom: 1.2rem;
  letter-spacing: 0.01em;
`;

const PlusButton = styled.button`
  width: 32px;
  height: 32px;
  background: #36b8d9;
  border: none;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.07);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: #249bb7;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255,255,255,0.55); /* whiteish overlay */
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  padding: 2rem 1.5rem;
  min-width: 350px;
  max-width: 95vw;
`;

const AppBackground = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: #eaf2f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const NotesCard = styled.div`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 6px 32px rgba(0,0,0,0.08);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  margin-top: 2.5rem;
  margin-bottom: 2.5rem;
  min-width: 700px;
  max-width: 900px;
  width: 100%;
`;

export default function NoteList() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

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

  const handleNoteDelete = useCallback(async (noteId: string) => {
    try {
      console.log('Starting note deletion in NoteList:', noteId);
      
      // Find the note to be deleted
      const noteToDelete = allNotes.find(note => note.localId === noteId);
      if (!noteToDelete) {
        console.error('Note not found for deletion:', noteId);
        alert('Note not found. Please refresh the page and try again.');
        return;
      }

      // Optimistically update the UI first
      setAllNotes(prevNotes => prevNotes.filter(note => note.localId !== noteId));

      try {
        // Then perform the actual deletion
        await deleteNote(noteId);
        console.log('Note deleted successfully');
      } catch (deleteError) {
        console.error('Error during note deletion:', deleteError);
        // Restore the note in the UI if deletion failed
        setAllNotes(prevNotes => [...prevNotes, noteToDelete]);
        throw deleteError; // Re-throw to be caught by outer catch
      }
      
      // Refresh notes to ensure consistency
      const updatedNotes = await getNotes();
      setAllNotes(updatedNotes);
    } catch (error) {
      console.error('Error in handleNoteDelete:', error);
      // Show a more specific error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete note';
      alert(`Failed to delete note: ${errorMessage}. Please try again.`);
      
      // Refresh notes to ensure UI is in sync with server
      try {
        const updatedNotes = await getNotes();
        setAllNotes(updatedNotes);
      } catch (refreshError) {
        console.error('Error refreshing notes after deletion failure:', refreshError);
      }
    }
  }, [allNotes]);

  const handleEditNote = useCallback(async (noteId: string, updatedTitle: string, updatedContent: string, updatedTags: string[]) => {
    try {
      console.log('Starting note edit in NoteList:', { noteId, updatedTitle });
      
      // Find the note to be edited
      const noteToEdit = allNotes.find(note => note.localId === noteId);
      if (!noteToEdit) {
        console.error('Note not found for editing:', noteId);
        return;
      }

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
  }, [allNotes]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      await refreshNotes();
      const notes = await getNotes();
      
      // Ensure all notes have localId and add it if missing
      const validNotes = notes.map(note => {
        if (!note.localId) {
          console.warn('Note missing localId, generating new one:', note);
          return {
            ...note,
            localId: crypto.randomUUID()
          };
        }
        return note;
      });

      // After fetching notes from the DB:
      const parsedNotes = validNotes.map(note => ({
        ...note,
        tags: typeof note.tags === 'string' ? JSON.parse(note.tags) : note.tags
      }));

      console.log('Fetched notes:', parsedNotes);
      setAllNotes(parsedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Try to get notes from IndexedDB as fallback
      try {
        const offlineNotes = await getOfflineNotes();
        const validOfflineNotes = offlineNotes.map(note => {
          if (!note.localId) {
            console.warn('Offline note missing localId, generating new one:', note);
            return {
              ...note,
              localId: crypto.randomUUID()
            };
          }
          return note;
        });
        setAllNotes(validOfflineNotes);
      } catch (offlineError) {
        console.error('Error fetching offline notes:', offlineError);
        setAllNotes([]);
      }
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

  // Before rendering FilterTag, assign colors to allTags
  assignTagColors(allTags);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <AppBackground>
      <NotesCard>
        <HeadingRow>
          <CenteredHeading>Notes</CenteredHeading>
          <PlusButton onClick={handleOpenModal} title="Add Note">
            <FontAwesomeIcon icon={faPlus} />
          </PlusButton>
        </HeadingRow>
        <Subheader>Capture what's on your mind easily !</Subheader>
        {showModal && (
          <ModalOverlay onClick={handleCloseModal}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <NoteForm onNoteSubmit={async (...args) => {
                await handleNoteSubmit(...args);
                setShowModal(false);
              }} />
            </ModalContent>
          </ModalOverlay>
        )}
        {allTags.length > 0 && (
          <FilterContainer>
            {allTags.map(tag => (
              <FilterTag
                key={tag}
                tag={tag}
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
            {filteredNotes.map((note) => (
              <NoteItem
                key={note.localId}
                note={note}
                onDeleteNote={handleNoteDelete}
                onEditNote={handleEditNote}
              />
            ))}
          </ul>
        )}
        <OfflineIndicator />
      </NotesCard>
    </AppBackground>
  );
}