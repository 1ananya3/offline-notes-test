import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import SyncIndicator from './SyncIndicator'
import { Note } from '../utils/notes'
import { Button } from '../styles/styled';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const NoteItemWrapper = styled.div`
  margin-bottom: 1rem;
`;

const NoteFrame = styled.li<{ isSubmitted?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  max-height: none;
  overflow-y: auto;
  width: 500px;
  word-wrap: break-word;
  overflow: visible;
  background-color: ${props => (!props.isSubmitted ? '#eee' : 'transparent')};

  .note-timestamp {
    position: absolute;
    bottom: 0;
    left: 0;
    margin: 0.5rem;
    font-size: 0.8rem;
    color: #888;
  }

  .edit-buttons {
    position: absolute;
    bottom: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.5rem;
  }

  .note-content {
    width: 95%;
    flex-grow: 1;
    overflow-wrap: break-word;
    word-wrap: break-word;
    word-break: break-word;
    overflow-y: auto;
    max-width: 100%;
    margin-bottom: 0.75rem;
  }

  textarea {
    width: 100%;
    border: none;
    resize: none;
    overflow: hidden;
    font-size: 1rem;
    line-height: 1;
    padding: 0;
    margin: 0;
    height: auto;
    min-height: 0rem;
  }
`;

const Content = styled.div`
  flex-grow: 1;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  overflow-y: auto;
  max-width: 100%;
  margin-bottom: 1rem;
  padding-bottom: 0.25rem;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
  width: 100%;
`;

const Tag = styled.span`
  background-color: #e2e8f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TagInput = styled.input`
  width: 100px;
  padding: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  font-size: 0.75rem;
  line-height: 1;
`;

const SaveButton = styled(Button)`
  padding: 5px 10px;
  font-size: 0.8rem;
`;

const CancelButton = styled(Button)`
  padding: 5px 10px;
  font-size: 0.8rem;
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.4);
  font-size: 1rem;
  cursor: pointer;
`;

const EditButton = styled(Button)`
  position: absolute;
  padding: 5px 10px;
  bottom: 0.5rem;
  right: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
`;

const OfflineIndicatorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  position: relative;
  bottom: 0;
  right: 0;
  font-size: 0.75rem;
  color: #fff;
`;

const OfflineIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 0.25rem;
`;

const OfflineIndicatorIcon = styled(FontAwesomeIcon)`
  color: red;
  margin-right: 0.25rem;
`;

const OfflineIndicatorText = styled.span`
  font-size: 0.8rem;
  color: red;
`;

const ContentInput = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  resize: vertical;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
`;

interface NoteItemProps {
  note: Note,
  onDeleteNote: (noteId: number) => Promise<void>;
  onEditNote: (noteId: string, updatedTitle: string, updatedContent: string, updatedTags: string[]) => Promise<void>;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onDeleteNote, onEditNote }) => {
  const [isSyncing, setSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content || '');
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [newTag, setNewTag] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleDelete = async () => {
    if (!note.id) {
      console.error('No note ID found');
      return;
    }

    setSyncing(true);
    try {
      console.log('Deleting note with ID:', note.id);
      await onDeleteNote(note.id);
      setIsEditing(false);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTitle(note.title);
    setContent(note.content || '');
    setTags(note.tags || []);
  };

  const handleSave = async () => {
    if (!note.id) {
      console.error('No localId found for note');
      return;
    }

    setSyncing(true);
    try {
      console.log('Saving note:', { noteId: note.id, title, content, tags });
      await onEditNote(note.id, title, content, tags);
      console.log('Note saved successfully');
      
      // Update the note object with new values
      note.title = title;
      note.content = content;
      note.tags = tags;
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
      // Revert to original values on error
      setTitle(note.title);
      setContent(note.content || '');
      setTags(note.tags || []);
      // Show error to user
      alert('Failed to save note. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTitle(note.title);
    setContent(note.content || '');
    setTags(note.tags || []);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && newTag.trim()) {
      e.preventDefault();
      if (!tags.includes(newTag.trim())) {
        setTags([...tags, newTag.trim()]);
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.value = note.title;
    }
  }, [isEditing, title]);

  return (
    <NoteItemWrapper>
      <NoteFrame isSubmitted={note.id !== undefined}>
        {isSyncing && <SyncIndicator/>}
        <DeleteButton onClick={handleDelete}>[x]</DeleteButton>
        <p className="note-timestamp">{new Date(note.createdAt).toUTCString()}</p>
        <div className="note-content">
          {isEditing ? (
            <>
              <textarea
                ref={textareaRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                placeholder="Note title"
              />
              <ContentInput
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Note content"
              />
            </>
          ) : (
            <>
              <Content>{note.title}</Content>
              {note.content && <Content>{note.content}</Content>}
            </>
          )}
        </div>
        <TagsContainer>
          {isEditing ? (
            <>
              {tags.map(tag => (
                <Tag key={tag}>
                  {tag}
                  <RemoveTagButton onClick={() => removeTag(tag)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </RemoveTagButton>
                </Tag>
              ))}
              <TagInput
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag..."
              />
            </>
          ) : (
           
          (Array.isArray(tags) ? tags : []).map(tag => <Tag key={tag}>{tag}</Tag>)

         ) }
        </TagsContainer>
        {isEditing ? (
          <div className="edit-buttons">
            <SaveButton onClick={handleSave}>Save</SaveButton>
            <CancelButton onClick={handleCancel}>Cancel</CancelButton>
          </div>
        ) : (
          <EditButton onClick={handleEdit}>Edit</EditButton>
        )}
      </NoteFrame>
      {navigator.onLine && (
        <OfflineIndicatorWrapper>
          {note.localDeleteSynced === false && (
            <OfflineIndicator>
              <OfflineIndicatorIcon icon={faExclamationCircle} />
              <OfflineIndicatorText>Note deletion not synced</OfflineIndicatorText>
            </OfflineIndicator>
          )}
          {note.localEditSynced === false && (
            <OfflineIndicator>
              <OfflineIndicatorIcon icon={faExclamationCircle} />
              <OfflineIndicatorText>Note edit not synced</OfflineIndicatorText>
            </OfflineIndicator>
          )}
          {note.id === undefined && note.localEditSynced !== false && (
            <OfflineIndicator>
              <OfflineIndicatorIcon icon={faExclamationCircle} />
              <OfflineIndicatorText>Note submission not synced</OfflineIndicatorText>
            </OfflineIndicator>
          )}
        </OfflineIndicatorWrapper>
      )}
    </NoteItemWrapper>
  );
};

export default NoteItem;