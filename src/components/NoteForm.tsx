import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { LoadingSpinner } from './LoadingSpinner';
import { Button } from '../styles/styled';

const NoteFormContainer = styled.form`
  display: flex;
  flex-direction: column; /* Allow vertical stacking for input and tags */
  gap: 0.5rem;
  align-self: center;
`;

const NoteInput = styled.textarea`
  height: 100px;
  width: 100%;
  resize: vertical;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const AddNoteButton = styled(Button)`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  align-self: flex-end;
`;

const TagInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  font-size: 0.9rem;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  background-color: #d1e7ff;
  color: #084298;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
`;

interface NoteFormProps {
  onNoteSubmit: (noteTitle: string, tags: string[]) => Promise<void>;
}

const NoteForm: React.FC<NoteFormProps> = ({ onNoteSubmit }) => {
  const [isSyncing, setSyncing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleNoteTitleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteTitle(event.target.value);
  };

  const handleTagInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim() !== '') {
      event.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (noteTitle.trim() === '') {
      return;
    }
    setSyncing(true);
    await onNoteSubmit(noteTitle, tags);
    setSyncing(false);
    setNoteTitle('');
    setTags([]);
    setTagInput('');
  };

  return (
    <NoteFormContainer onSubmit={handleSubmit}>
      <NoteInput
        rows={3}
        value={noteTitle}
        onChange={handleNoteTitleChange}
        placeholder="Enter your note..."
      />
      <TagInput
        type="text"
        value={tagInput}
        onChange={handleTagInputChange}
        onKeyDown={handleTagKeyDown}
        placeholder="Add tags and press Enter"
      />
      {tags.length > 0 && (
        <TagList>
          {tags.map((tag, index) => (
            <Tag key={index}>{tag}</Tag>
          ))}
        </TagList>
      )}
      <AddNoteButton type="submit">
        {isSyncing ? <LoadingSpinner /> : 'Add Note'}
      </AddNoteButton>
    </NoteFormContainer>
  );
};

export default NoteForm;
