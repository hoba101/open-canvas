import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  MarkerType,
  getNodesBounds,
  getViewportForBounds
} from '@xyflow/react';
import type { Connection, Edge, NodeTypes, DefaultEdgeOptions, Node } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { TextNode } from './components/TextNode';
import { ImageNode } from './components/ImageNode';
import { themes, type ThemeId, type ThemePalette } from './themes';

const nodeTypes: NodeTypes = { text: TextNode, image: ImageNode };

const makeInitialNodes = (): Node[] => [
  {
    id: 'node-1', type: 'text', position: { x: 0, y: 0 },
    data: { text: "Hello! 👋\nDouble-click anywhere to add notes." },
    style: { width: 300, height: 120 },
  },
  {
    id: 'node-2', type: 'image', position: { x: 350, y: 0 },
    data: {}, style: { width: 200, height: 200 },
  },
];

const initialEdges: Edge[] = [];

type Project = { id: string; name: string };

// Remove the React Flow watermark
const proOptions = { hideAttribution: true };

/* ─── ICONS (tiny SVGs) ──────────────────────────────────────────── */
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const CloudUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const SpinIcon = () => <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>;
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;

/* ─── FLOW ────────────────────────────────────────────────────────── */
function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(makeInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition, getNodes } = useReactFlow();

  const [themeId, setThemeId] = useState<ThemeId>(() => {
    return (localStorage.getItem('canvas-theme') as ThemeId) || 'midnight';
  });
  const t: ThemePalette = themes[themeId];

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [shareCode, setShareCode] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadCode, setLoadCode] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  const activeProjectIdRef = useRef<string | null>(null);
  const isInitializing = useRef(true);

  // Persist theme choice
  useEffect(() => { localStorage.setItem('canvas-theme', themeId); }, [themeId]);

  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(() => ({
    style: { strokeWidth: 2, stroke: t.edgeStroke },
    markerEnd: { type: MarkerType.ArrowClosed, color: t.edgeStroke },
  }), [t]);

  // Inject theme palette into every node's data so TextNode/ImageNode can read it
  useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, _theme: t },
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeId]);

  const loadProject = useCallback((id: string) => {
    setActiveProjectId(id);
    activeProjectIdRef.current = id;
    localStorage.setItem('canvas-last-active', id);
    const raw = localStorage.getItem(`canvas-data-${id}`);
    if (raw) {
      const { nodes: sn, edges: se } = JSON.parse(raw);
      setNodes(sn || []); setEdges(se || []);
    } else {
      setNodes([]); setEdges([]);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    const reg = localStorage.getItem('canvas-projects-registry');
    let loaded: Project[] = reg ? JSON.parse(reg) : [];
    if (loaded.length === 0) {
      const did = crypto.randomUUID();
      loaded = [{ id: did, name: 'Default Canvas' }];
      localStorage.setItem('canvas-projects-registry', JSON.stringify(loaded));
      localStorage.setItem(`canvas-data-${did}`, JSON.stringify({ nodes: makeInitialNodes(), edges: initialEdges }));
    }
    setProjects(loaded);
    const last = localStorage.getItem('canvas-last-active');
    loadProject(last && loaded.find(p => p.id === last) ? last : loaded[0].id);
    setTimeout(() => { isInitializing.current = false; }, 100);
  }, [loadProject]);

  useEffect(() => {
    if (isInitializing.current || !activeProjectIdRef.current) return;
    // Strip _theme before saving to localStorage to avoid bloat
    const strippedNodes = nodes.map(n => ({ ...n, data: { ...n.data, _theme: undefined } }));
    localStorage.setItem(`canvas-data-${activeProjectIdRef.current}`, JSON.stringify({ nodes: strippedNodes, edges }));
  }, [nodes, edges]);

  const handleNewProject = useCallback(() => {
    const name = window.prompt('Enter a name for the new Canvas:');
    if (!name?.trim()) return;
    const id = crypto.randomUUID();
    const up = [...projects, { id, name: name.trim() }];
    setProjects(up);
    localStorage.setItem('canvas-projects-registry', JSON.stringify(up));
    loadProject(id);
  }, [projects, loadProject]);

  const onConnect = useCallback((p: Connection | Edge) => setEdges(eds => addEdge(p, eds)), [setEdges]);

  const handleAddNode = useCallback((type: 'text' | 'image') => {
    setNodes(nds => [...nds, {
      id: crypto.randomUUID(), type,
      position: { x: Math.random() * 50 - 25, y: Math.random() * 50 - 25 },
      data: type === 'text' ? { text: 'New Note', _theme: t } : { _theme: t },
      style: type === 'text' ? { width: 220, height: 100 } : { width: 200, height: 200 },
    }]);
  }, [setNodes, t]);

  const onPaneClick = useCallback((e: ReactMouseEvent) => {
    if (e.detail === 2) {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setNodes(nds => [...nds, {
        id: crypto.randomUUID(), type: 'text', position: pos,
        data: { text: '', _theme: t }, style: { width: 220, height: 100 },
      }]);
    }
  }, [screenToFlowPosition, setNodes, t]);

  const handleDownloadImage = useCallback(() => {
    const cur = getNodes(); if (cur.length === 0) return;
    const bounds = getNodesBounds(cur);
    const vp = getViewportForBounds(bounds, bounds.width, bounds.height, 0.5, 2, 0.1);
    const el = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    toPng(el, {
      backgroundColor: t.canvasBg, width: bounds.width, height: bounds.height,
      style: { width: String(bounds.width), height: String(bounds.height), transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})` },
    }).then(url => { const a = document.createElement('a'); a.download = 'open-canvas-export.png'; a.href = url; a.click(); })
      .catch(err => console.error('Export failed', err));
  }, [getNodes, t]);

  const generateShortCode = () => {
    const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let r = '';
    for (let i = 0; i < 6; i++) r += c[Math.floor(Math.random() * c.length)];
    return r;
  };

  const handleShareCanvas = async () => {
    setIsSharing(true);
    try {
      const code = generateShortCode();
      const cur = getNodes();
      // Clone & strip _theme
      const cleanNodes: Node[] = JSON.parse(JSON.stringify(cur.map(n => ({ ...n, data: { ...n.data, _theme: undefined } }))));
      const cleanEdges = JSON.parse(JSON.stringify(edges));

      // Upload Base64 images to Firebase Storage
      await Promise.all(cleanNodes.map(async (node) => {
        if (node.type === 'image') {
          const url = (node.data as { imageUrl?: string }).imageUrl;
          if (url?.startsWith('data:')) {
            try {
              const blob = await (await fetch(url)).blob();
              const ext = blob.type.split('/')[1] || 'png';
              const storageRef = ref(storage, `canvas-images/${code}-${node.id}.${ext}`);
              const snap = await uploadBytes(storageRef, blob);
              (node.data as { imageUrl?: string }).imageUrl = await getDownloadURL(snap.ref);
            } catch { (node.data as { imageUrl?: string }).imageUrl = undefined; }
          }
        }
      }));

      await setDoc(doc(db, 'shared_canvases', code), { nodes: cleanNodes, edges: cleanEdges, createdAt: new Date().toISOString() });
      setShareCode(code);
    } catch (err) {
      console.error('Share failed:', err);
      alert('Failed to share. Check Firebase config.');
    } finally { setIsSharing(false); }
  };

  const handleLoadCanvas = async () => {
    const code = loadCode.trim().toUpperCase();
    if (code.length !== 6) { setLoadError('Enter a valid 6-character code.'); return; }
    setIsLoadingCloud(true); setLoadError('');
    try {
      const snap = await getDoc(doc(db, 'shared_canvases', code));
      if (snap.exists()) {
        const d = snap.data();
        setNodes(d.nodes || []); setEdges(d.edges || []);
        setShowLoadModal(false); setLoadCode('');
      } else { setLoadError(`No canvas found for "${code}".`); }
    } catch { setLoadError('Network error. Try again.'); }
    finally { setIsLoadingCloud(false); }
  };

  // Cycle theme: midnight → rose → contrast → midnight
  const cycleTheme = () => {
    const order: ThemeId[] = ['midnight', 'rose', 'contrast'];
    const next = order[(order.indexOf(themeId) + 1) % order.length];
    setThemeId(next);
  };

  /* ─── SHARED INLINE STYLE HELPERS ─── */
  const btnStyle = (hoverColor?: string): React.CSSProperties => ({
    padding: 7, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', background: 'transparent', border: 'none',
    color: t.textSecondary, transition: 'color 150ms',
  });

  const dividerStyle: React.CSSProperties = { width: 1, height: 20, background: t.panelBorder, margin: '0 4px' };

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onConnect={onConnect} onPaneClick={onPaneClick}
      nodeTypes={nodeTypes} defaultEdgeOptions={defaultEdgeOptions}
      colorMode={t.rfColorMode} proOptions={proOptions}
      style={{ background: t.canvasBg }}
    >
      <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color={t.dotColor} />

      {/* ── TOP LEFT TOOLBAR ─────────────────────────────────── */}
      <Panel position="top-left" style={{ margin: 16, pointerEvents: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: t.panelBg, backdropFilter: 'blur(16px)',
          padding: '6px 8px', borderRadius: 16,
          border: `1px solid ${t.panelBorder}`, boxShadow: t.panelShadow,
        }}>
          {/* Canvas select */}
          <select
            value={activeProjectId || ''} onChange={e => loadProject(e.target.value)}
            style={{
              background: 'transparent', color: t.textPrimary, fontWeight: 700, fontSize: 14,
              border: 'none', outline: 'none', cursor: 'pointer', maxWidth: 130,
              padding: '2px 4px',
            }}
          >
            {projects.map(p => <option key={p.id} value={p.id} style={{ background: t.modalBg, color: t.textPrimary }}>{p.name}</option>)}
          </select>

          <div style={dividerStyle} />

          <button onClick={handleNewProject} style={btnStyle()} title="New Canvas"><PlusIcon /></button>

          {/* Theme cycle button */}
          <button onClick={cycleTheme} style={{ ...btnStyle(), fontSize: 18 }} title={`Theme: ${t.name}`}>
            {t.emoji}
          </button>

          <div style={dividerStyle} />

          <button onClick={handleDownloadImage} style={btnStyle()} title="Download Image"><DownloadIcon /></button>
          <button onClick={() => { setShowLoadModal(true); setLoadCode(''); setLoadError(''); }} style={btnStyle()} title="Load Shared Canvas"><CloudUpIcon /></button>
          <button onClick={handleShareCanvas} disabled={isSharing} style={{ ...btnStyle(), opacity: isSharing ? 0.5 : 1 }} title="Share Canvas">
            {isSharing ? <SpinIcon /> : <ShareIcon />}
          </button>
        </div>
      </Panel>

      {/* ── BOTTOM FAB ───────────────────────────────────────── */}
      <Panel position="bottom-center" style={{ marginBottom: 24, pointerEvents: 'auto' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: t.panelBg, backdropFilter: 'blur(16px)',
          padding: 6, borderRadius: 999,
          border: `1px solid ${t.panelBorder}`, boxShadow: t.panelShadow,
        }}>
          <button onClick={() => handleAddNode('text')}
            style={{ ...btnStyle(), padding: 12, borderRadius: 999 }} title="Add Text">
            <TextIcon />
          </button>
          <div style={{ width: 1, height: 24, background: t.panelBorder, margin: '0 4px' }} />
          <button onClick={() => handleAddNode('image')}
            style={{ ...btnStyle(), padding: 12, borderRadius: 999 }} title="Add Image">
            <ImageIcon />
          </button>
        </div>
      </Panel>

      {/* ── SHARE MODAL ──────────────────────────────────────── */}
      {shareCode && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.overlayBg, backdropFilter: 'blur(6px)', padding: 16 }}>
          <div style={{ background: t.modalBg, borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', border: `1px solid ${t.modalBorder}`, boxShadow: '0 24px 48px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <h3 style={{ color: t.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Share this code!</h3>
            <p style={{ color: t.textSecondary, fontSize: 14, marginBottom: 24 }}>Your friend can load an exact copy of your canvas.</p>
            <div style={{ background: t.inputBg, borderRadius: 14, padding: 16, marginBottom: 24 }}>
              <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, color: t.accent, userSelect: 'all' }}>{shareCode}</span>
            </div>
            <button onClick={() => setShareCode(null)} style={{ width: '100%', background: t.accent, color: t.accentText, fontWeight: 700, fontSize: 15, padding: '12px 0', borderRadius: 14, border: 'none', cursor: 'pointer' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── LOAD MODAL ───────────────────────────────────────── */}
      {showLoadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.overlayBg, backdropFilter: 'blur(6px)', padding: 16 }}>
          <div style={{ background: t.modalBg, borderRadius: 20, padding: 32, maxWidth: 380, width: '100%', border: `1px solid ${t.modalBorder}`, boxShadow: '0 24px 48px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color: t.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>Load a Shared Canvas</h3>
            <p style={{ color: t.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20 }}>Enter the 6-character code from a friend.</p>
            <input
              type="text" value={loadCode} maxLength={6} autoFocus
              onChange={e => { setLoadCode(e.target.value.toUpperCase()); setLoadError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLoadCanvas()}
              placeholder="e.g. A7X9WQ"
              style={{
                width: '100%', background: t.inputBg, color: t.inputText,
                fontSize: 24, fontWeight: 900, letterSpacing: 6, textAlign: 'center',
                borderRadius: 14, padding: '14px 16px', marginBottom: 12,
                border: `2px solid ${t.panelBorder}`, outline: 'none', boxSizing: 'border-box',
                textTransform: 'uppercase',
              }}
            />
            {loadError && <p style={{ color: t.danger, fontSize: 13, textAlign: 'center', marginBottom: 12, fontWeight: 600 }}>{loadError}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowLoadModal(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: `1px solid ${t.panelBorder}`, background: 'transparent', color: t.textPrimary, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={handleLoadCanvas} disabled={isLoadingCloud || loadCode.trim().length !== 6}
                style={{ flex: 1, padding: '12px 0', borderRadius: 14, border: 'none', background: t.accent, color: t.accentText, fontWeight: 700, cursor: 'pointer', fontSize: 14, opacity: (isLoadingCloud || loadCode.trim().length !== 6) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {isLoadingCloud ? <SpinIcon /> : 'Load Canvas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ReactFlow>
  );
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', touchAction: 'none', overflow: 'hidden' }}>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </div>
  );
}

export default App;
