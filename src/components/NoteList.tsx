import { useCallback, useEffect, useState } from 'react';
import { Container, Heading } from '../styles/styled';
import { SpinnerContainer } from './LoadingSpinner';
import {
  Note,
  createNote,
  submitNote,
  deleteNote,
  editNote,
  refreshNotes,
  getNotes,
} from '../utils/notes';

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
  width: 90%;
  margin: auto;
`;

const NoteListLoadingSpinner = styled(SpinnerContainer)`
  margin-top: 20px;
  margin-bottom: 10px;
`;

const TagFilterWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
`;

const TagCheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
`;

export default function NoteList() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleNoteSubmit = useCallback(async (noteTitle: string, tags: string[]) => {
    const note: Note = createNote(noteTitle, tags);
    await submitNote(note);
    setAllNotes(await getNotes());
  }, []);

  const handleNoteDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
    setAllNotes(await getNotes());
  }, []);

  const handleEditNote = useCallback(async (noteId: string, updatedTitle: string) => {
    await editNote(noteId, updatedTitle);
    setAllNotes(await getNotes());
  }, []);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
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
          window.addEventListener('online', async () => {
            registration.sync.register('sync-notes')
              .then(() => console.log('Sync event registered'))
              .catch((error) => console.error('Sync event registration failed:', error));
          });
        })
        .catch((error) => console.error('Service Worker registration failed:', error));
    }

    window.addEventListener('online', async () => {
      await fetchNotes();
    });
  }, [fetchNotes]);

  const allTags = Array.from(new Set(allNotes.flatMap(note => note.tags || [])));

  const filteredNotes = selectedTags.length > 0
    ? allNotes.filter(note => note.tags?.some(tag => selectedTags.includes(tag)))
    : allNotes;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <NotesContainer>
      <Heading>Notes</Heading>
      <NoteListWrapper>
        <NoteForm onNoteSubmit={handleNoteSubmit} />

        {allTags.length > 0 && (
          <TagFilterWrapper>
            {allTags.map((tag) => (
              <TagCheckboxLabel key={tag}>
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </TagCheckboxLabel>
            ))}
          </TagFilterWrapper>
        )}

        {loading && <NoteListLoadingSpinner />}
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
      </NoteListWrapper>
      <OfflineIndicator />
    </NotesContainer>
  );
}
