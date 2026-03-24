import { useCallback, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, NodeToolbar } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ThemePalette } from '../themes';

export type TextNodeData = {
  text?: string;
  _theme?: ThemePalette;
};

export const TextNode = ({ id, data, selected }: NodeProps) => {
  const { text, _theme: t } = data as TextNodeData;
  const { updateNodeData, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onTextChange = useCallback((evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { text: evt.target.value });
  }, [id, updateNodeData]);

  const onDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  // Mobile double-tap detection
  const lastTapRef = useRef<number>(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    const delta = now - lastTapRef.current;
    if (tapTimerRef.current) { clearTimeout(tapTimerRef.current); tapTimerRef.current = null; }
    if (delta > 0 && delta < 350) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    } else {
      tapTimerRef.current = setTimeout(() => { tapTimerRef.current = null; }, 350);
    }
    lastTapRef.current = now;
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // Fallback colors if theme not injected
  const bg = t?.nodeBg ?? 'rgba(255,255,255,0.5)';
  const border = t?.nodeBorder ?? 'rgba(200,200,200,0.5)';
  const ring = t?.nodeSelectedRing ?? '#3b82f6';
  const shadow = t?.nodeSelectedShadow ?? '0 0 16px rgba(59,130,246,0.3)';
  const textColor = t?.textPrimary ?? '#1f2937';
  const placeholder = t?.textMuted ?? '#9ca3af';
  const dangerColor = t?.danger ?? '#ef4444';

  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
      >
        <div style={{
          background: t?.panelBg ?? 'rgba(255,255,255,0.95)',
          border: `1px solid ${t?.panelBorder ?? 'rgba(200,200,200,0.8)'}`,
          boxShadow: t?.panelShadow ?? '0 4px 16px rgba(0,0,0,0.1)',
          borderRadius: 12, padding: 4, display: 'flex', gap: 4,
          backdropFilter: 'blur(12px)',
        }}>
          <button
            onClick={onDelete}
            style={{ color: dangerColor, padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', cursor: 'pointer', background: 'transparent', border: 'none' }}
            title="Delete Text Block"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </NodeToolbar>

      <NodeResizer color={ring} isVisible={selected} minWidth={100} minHeight={40} handleClassName="!w-2.5 !h-2.5 !border-none !rounded-sm" handleStyle={{ background: ring }} />

      <div
        style={{
          width: '100%', height: '100%', minWidth: 100, minHeight: 40,
          borderRadius: 16, overflow: 'hidden', position: 'relative',
          background: bg, backdropFilter: 'blur(12px)',
          border: selected ? `2px solid ${ring}` : `1px solid ${border}`,
          boxShadow: selected ? shadow : '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
        }}
      >
        <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, background: placeholder, border: 'none', opacity: 0 }} />

        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={text || ''}
              onChange={onTextChange}
              onBlur={() => setIsEditing(false)}
              placeholder="Start typing..."
              dir="auto"
              className="nodrag"
              style={{
                width: '100%', height: '100%', background: 'transparent',
                color: textColor, fontSize: 15, fontWeight: 600, padding: 16,
                resize: 'none', outline: 'none', border: 'none', fontFamily: 'inherit',
              }}
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditing(true)}
              onTouchEnd={handleTouchEnd}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <div
                dir="auto"
                style={{
                  width: '100%', height: '100%', color: textColor,
                  fontSize: 15, fontWeight: 600, padding: 16,
                  pointerEvents: 'none', whiteSpace: 'pre-wrap', overflow: 'hidden',
                }}
              >
                {text ? text : <span style={{ color: placeholder, fontWeight: 500 }}>Double tap to edit</span>}
              </div>
            </div>
          )}
        </div>

        <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, background: placeholder, border: 'none', opacity: 0 }} />
      </div>
    </>
  );
};
