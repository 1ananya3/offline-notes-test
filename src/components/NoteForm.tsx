import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { LoadingSpinner } from './LoadingSpinner'
import { Button } from '../styles/styled';

const NoteFormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
`;

const TitleInput = styled.textarea`
  height: 50px;
  width: 100%;
  resize: vertical;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const ContentInput = styled.textarea`
  height: 150px;
  width: 100%;
  resize: vertical;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const TagInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  background-color: #e2e8f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
`;

const AddNoteButton = styled(Button)`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  align-self: flex-end;
`;

interface NoteFormProps {
  onNoteSubmit: (noteTitle: string, content: string, tags: string[]) => Promise<void>;
}

const NoteForm: React.FC<NoteFormProps> = ({ onNoteSubmit }) => {
  const [isSyncing, setSyncing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleNoteTitleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteTitle(event.target.value);
  };

  const handleNoteContentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(event.target.value);
  };

  const handleTagInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (noteTitle.trim() === '') {
      return;
    }
    setSyncing(true);
    await onNoteSubmit(noteTitle, noteContent, tags);
    setSyncing(false);
    setNoteTitle('');
    setNoteContent('');
    setTags([]);
  };

  return (
    <NoteFormContainer onSubmit={handleSubmit}>
      <TitleInput
        rows={2}
        value={noteTitle}
        onChange={handleNoteTitleChange}
        placeholder="Enter note title..."
      />
      <ContentInput
        rows={6}
        value={noteContent}
        onChange={handleNoteContentChange}
        placeholder="Enter note content..."
      />
      <TagInput
        type="text"
        value={tagInput}
        onChange={handleTagInputChange}
        onKeyDown={handleTagKeyDown}
        placeholder="Add tags (press Enter or comma to add)"
      />
      {tags.length > 0 && (
        <TagsContainer>
          {tags.map(tag => (
            <Tag key={tag}>
              {tag}
              <RemoveTagButton onClick={() => removeTag(tag)}>×</RemoveTagButton>
            </Tag>
          ))}
        </TagsContainer>
      )}
      <AddNoteButton type="submit">
        {isSyncing ? <LoadingSpinner/> : "Add Note"}
      </AddNoteButton>
    </NoteFormContainer>
  );
};

export default NoteForm;