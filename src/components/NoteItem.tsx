import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import SyncIndicator from './SyncIndicator'
import { Note } from '../utils/notes'
import { Button } from '../styles/styled';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faTimes, faPen, faCheck, faTimes as faTimesCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TAG_COLORS, tagColorMap, assignTagColors } from '../utils/tagColors';

const NoteItemWrapper = styled.div`
  margin-bottom: 1rem;
`;

const NoteFrame = styled.li<{ isSubmitted?: boolean; borderColor: string }>`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  margin-right: 2rem;
  max-height: none;
  overflow-y: auto;
  width: 690px;
  word-wrap: break-word;
  overflow: visible;
  background-color: ${props => (!props.isSubmitted ? '#eee' : 'transparent')};
  border-left: 12px solid ${props => props.borderColor};
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;

  .note-timestamp {
    position: absolute;
    bottom: 0;
    left: 0;
    margin: 0.5rem;
    margin-top: 1.2rem;
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
  margin-bottom: 1rem;
`;

const Tag = styled.span<{ tagText: string }>`
  background-color: ${props => tagColorMap[props.tagText] || TAG_COLORS[0]};
  color: #333;
  padding: 0.25rem 1rem;
  border-radius: 4px;
  font-size: 0.95em;
  display: flex;
  align-items: center;
  gap: 0.4em;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(0,0,0,0.07);
  border: none;
  margin-bottom: 2px;
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

const SaveButton = styled.button`
  width: 25px;
  height: 25px;
  background: #36b8d9;
  border: none;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.07);
  transition: background 0.2s, box-shadow 0.2s;
  margin-right: 10px;
  &:hover {
    background: #249bb7;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const CancelButton = styled.button`
  width: 25px;
  height: 25px;
  background: #b0b8c1;
  border: none;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.07);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: #8a929a;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const DeleteButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 25px;
  height: 25px;
  background: #36b8d9;
  border: none;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.07);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: #249bb7;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
`;

const EditButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 40px;
  width: 25px;
  height: 25px;
  background: #36b8d9;
  border: none;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.07);
  transition: background 0.2s, box-shadow 0.2s;
  &:hover {
    background: #249bb7;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
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

const NoteTitle = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: #444;
  margin-bottom: 0.5rem;
  font-family: inherit;
`;

const NoteContent = styled.div`
  font-size: 1.05rem;
  color: #888;
  font-style: italic;
  opacity: 0.85;
  letter-spacing: 0.01em;
  font-family: inherit;
`;

interface NoteItemProps {
  note: Note,
  onDeleteNote: (noteId: string) => Promise<void>;
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

  useEffect(() => {
    // Ensure note has a localId when component mounts
    if (!note.localId) {
      console.error('Note missing localId:', note);
      // Generate a new localId if missing
      note.localId = crypto.randomUUID();
      console.log('Generated new localId:', note.localId);
    }
  }, [note]);

  const handleDelete = async () => {
    if (!note.localId) {
      console.error('No localId found for note:', note);
      alert('Cannot delete note: Missing identifier');
      return;
    }

    setSyncing(true);
    try {
      console.log('Deleting note with localId:', note.localId);
      await onDeleteNote(note.localId);
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
    if (!note.localId) {
      console.error('No localId found for note');
      return;
    }

    setSyncing(true);
    try {
      console.log('Saving note:', { localId: note.localId, title, content, tags });
      await onEditNote(note.localId, title, content, tags);
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

  assignTagColors(tags);

  const getNoteBorderColor = (tags: string[]) => {
    if (tags && tags.length > 0) {
      return tagColorMap[tags[0]] || TAG_COLORS[0];
    }
    return '#fbbf24'; // default orange if no tags
  };

  return (
    <NoteItemWrapper>
      <NoteFrame isSubmitted={note.localId !== undefined} borderColor={getNoteBorderColor(tags)}>
        {isSyncing && <SyncIndicator/>}
        {!isEditing && (
          <EditButton onClick={handleEdit}>
            <FontAwesomeIcon icon={faPen} />
          </EditButton>
        )}
        <DeleteButton onClick={handleDelete}>
          <FontAwesomeIcon icon={faTrash} />
        </DeleteButton>
        <p className="note-timestamp">
          {new Date(note.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
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
              <NoteTitle>{note.title}</NoteTitle>
              {note.content && <NoteContent>{note.content}</NoteContent>}
            </>
          )}
        </div>
        <TagsContainer>
          {isEditing ? (
            <>
              {tags.map(tag => (
                <Tag key={tag} tagText={tag}>
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
            (Array.isArray(tags) ? tags : []).map(tag => (
              <Tag key={tag} tagText={tag}>{tag}</Tag>
            ))
          )}
        </TagsContainer>
        {isEditing ? (
          <div className="edit-buttons">
            <SaveButton onClick={handleSave} title="Save">
              <FontAwesomeIcon icon={faCheck} />
            </SaveButton>
            <CancelButton onClick={handleCancel} title="Cancel">
              <FontAwesomeIcon icon={faTimesCircle} />
            </CancelButton>
          </div>
        ) : (
          <EditButton onClick={handleEdit}>
            <FontAwesomeIcon icon={faPen} />
          </EditButton>
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
          {note.localId === undefined && note.localEditSynced !== false && (
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