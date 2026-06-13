'use client';

import { useState } from 'react';

interface Props {
  id: string;
  editMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  children: React.ReactNode;
  outerStyle?: React.CSSProperties;
}

export default function EditableSection({ id, editMode, selected, onSelect, children, outerStyle }: Props) {
  const [hovered, setHovered] = useState(false);

  if (!editMode) return <>{children}</>;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        ...outerStyle,
        outline: selected ? '2px solid #2563eb' : hovered ? '2px solid #60a5fa' : '2px solid transparent',
        outlineOffset: -2,
      }}
    >
      {/* transparent overlay captures all clicks — prevents template-internal handlers from firing */}
      <div
        onClick={() => onSelect?.(id)}
        style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'pointer' }}
      />
      {children}
    </div>
  );
}
