import React, { useState, useEffect, ChangeEvent } from 'react';
import { Check, Edit2 } from 'lucide-react';

interface CmsEditableTextProps {
  cmsEditable: boolean;
  value: string;
  field: string;
  onUpdate: (field: string, newValue: string) => void;
  multiline?: boolean;
  elementClass?: string;
  className?: string;
}

export default function CmsEditableText({
  cmsEditable,
  value,
  field,
  onUpdate,
  multiline = false,
  elementClass = "",
  className = ""
}: CmsEditableTextProps) {
  const [localVal, setLocalVal] = useState(value);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setLocalVal(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onUpdate(field, localVal);
  };

  if (!cmsEditable) {
    if (multiline) {
      return (
        <p className={elementClass || className || "text-sm text-brand-charcoal"}>
          {value}
        </p>
      );
    }
    return <span className={elementClass || className}>{value}</span>;
  }

  return (
    <div className={`relative inline-block w-full group/cms ${isFocused ? 'ring-2 ring-brand-gold rounded p-1 bg-brand-cream/40' : 'hover:outline-dashed hover:outline-1 hover:outline-brand-gold/70 rounded p-1'}`}>
      {multiline ? (
        <textarea
          value={localVal}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setIsFocused(true)}
          rows={3}
          id={`cms-${field}`}
          className={`w-full bg-brand-cream/20 text-brand-charcoal focus:outline-none focus:ring-0 border-none resize-y p-1 font-sans ${elementClass}`}
        />
      ) : (
        <input
          type="text"
          value={localVal}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setIsFocused(true)}
          id={`cms-${field}`}
          className={`w-full bg-transparent text-brand-charcoal focus:outline-none focus:ring-0 border-none p-0 inline-block font-sans ${elementClass}`}
        />
      )}
      <span className="absolute right-2 top-2 opacity-0 group-hover/cms:opacity-100 transition text-[9px] bg-brand-gold text-brand-charcoal font-semibold px-1 rounded flex items-center gap-1 cursor-default pointer-events-none select-none z-10">
        <Edit2 size={8} /> Sửa CMS
      </span>
    </div>
  );
}
