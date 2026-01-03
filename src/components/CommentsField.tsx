import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Save } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CommentsFieldProps {
  applicationId: string;
  initialComments: string;
  onCommentsSaved?: (comments: string) => void;
}

export function CommentsField({ applicationId, initialComments, onCommentsSaved }: CommentsFieldProps) {
  const [comments, setComments] = useState(initialComments || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setComments(initialComments || '');
  }, [initialComments]);

  const saveComments = async (commentsText: string) => {
    try {
      setIsSaving(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98d69961/save-comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            applicationId, 
            comments: commentsText 
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save comments');
      }

      setLastSaved(new Date());
      onCommentsSaved?.(commentsText);
    } catch (error) {
      console.error('Error saving comments:', error);
      toast.error('Failed to save comments');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newComments = e.target.value;
    setComments(newComments);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds after user stops typing)
    saveTimeoutRef.current = window.setTimeout(() => {
      saveComments(newComments);
    }, 1500);
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Save className="w-3.5 h-3.5 animate-pulse" style={{ color: '#EF9D65' }} />
              <span>Saving...</span>
            </div>
          )}
          {!isSaving && lastSaved && (
            <span className="text-sm text-green-400">
              ✓ Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      <textarea
        value={comments}
        onChange={handleCommentsChange}
        placeholder="Add notes or comments about this application..."
        rows={3}
        className="w-full px-4 py-3 backdrop-blur-xl border rounded-xl text-white placeholder-gray-400 outline-none resize-none transition"
        style={{ 
          background: 'rgba(25, 42, 57, 0.6)', 
          borderColor: 'rgba(239, 157, 101, 0.3)' 
        }}
      />
    </div>
  );
}