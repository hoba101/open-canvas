import { useCallback } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, NodeToolbar } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ThemePalette } from '../themes';

export type ImageNodeData = {
  imageUrl?: string;
  _theme?: ThemePalette;
};

export const ImageNode = ({ id, data, selected }: NodeProps) => {
  const { imageUrl, _theme: t } = data as ImageNodeData;
  const { updateNodeData, deleteElements } = useReactFlow();

  const onImageUpload = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      updateNodeData(id, { imageUrl: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  }, [id, updateNodeData]);

  const onDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const bg = t?.nodeBg ?? 'rgba(255,255,255,0.5)';
  const border = t?.nodeBorder ?? 'rgba(200,200,200,0.5)';
  const ring = t?.nodeSelectedRing ?? '#3b82f6';
  const shadow = t?.nodeSelectedShadow ?? '0 0 16px rgba(59,130,246,0.3)';
  const textColor = t?.textSecondary ?? '#6b7280';
  const accent = t?.accent ?? '#3b82f6';
  const dangerColor = t?.danger ?? '#ef4444';

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
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
            title="Delete Image Block"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </NodeToolbar>

      <NodeResizer color={ring} isVisible={selected} minWidth={150} minHeight={150} keepAspectRatio={!!imageUrl} handleClassName="!w-2.5 !h-2.5 !border-none !rounded-sm" handleStyle={{ background: ring }} />

      <div style={{
        width: '100%', height: '100%', minWidth: 150, minHeight: 150,
        borderRadius: 20, position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: selected ? `2px solid ${ring}` : `1px solid ${border}`,
        boxShadow: selected ? shadow : '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <Handle type="target" position={Position.Top} style={{ width: 8, height: 8, background: textColor, border: 'none', opacity: 0 }} />

        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Node media"
            draggable={false}
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', background: bg, backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <label style={{ cursor: 'pointer', color: textColor, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 16, textAlign: 'center' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 8, opacity: 0.8 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>Upload Image</span>
              <input type="file" accept="image/png, image/jpeg, image/gif, image/webp" onChange={onImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        <Handle type="source" position={Position.Bottom} style={{ width: 8, height: 8, background: textColor, border: 'none', opacity: 0 }} />
      </div>
    </>
  );
};
