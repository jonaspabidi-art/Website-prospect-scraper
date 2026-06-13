'use client';

import { useState } from 'react';

interface Props {
  id: string;
  editMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  children: React.ReactNode;
  outerStyle?: React.CSSProperties;
  bgImage?: string | null;
}

export default function EditableSection({ id, editMode, selected, onSelect, children, outerStyle, bgImage }: Props) {
  const [hovered, setHovered] = useState(false);

  const hasBg = !!bgImage;

  // No edit mode and no custom background → minimal wrapper
  if (!editMode && !hasBg) return <>{children}</>;

  return (
    <div
      onMouseEnter={editMode ? () => setHovered(true) : undefined}
      onMouseLeave={editMode ? () => setHovered(false) : undefined}
      style={{
        position: 'relative',
        ...outerStyle,
        ...(hasBg ? {
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : {}),
        ...(editMode ? {
          outline: selected ? '2px solid #2563eb' : hovered ? '2px solid #60a5fa' : '2px solid transparent',
          outlineOffset: -2,
        } : {}),
      }}
    >
      {/* dark overlay for readability when bg image is set */}
      {hasBg && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', pointerEvents: 'none', zIndex: 0 }} />
      )}
      {/* transparent click capture in edit mode */}
      {editMode && (
        <div
          onClick={() => onSelect?.(id)}
          style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'pointer' }}
        />
      )}
      {/* content sits above overlay */}
      <div style={hasBg ? { position: 'relative', zIndex: 1 } : undefined}>
        {children}
      </div>
    </div>
  );
}
