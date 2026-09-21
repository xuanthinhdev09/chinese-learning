import { createContext, useContext } from 'react';

export interface ImageSlotSelection {
  /** slot currently targeted by Ctrl+V paste, null = none */
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** lets the page route clipboard pastes to a slot's uploader */
  registerUpload: (id: string, upload: ((file: File) => void) | null) => void;
}

export const ImageSlotSelectionContext = createContext<ImageSlotSelection | null>(null);

/** Null when rendered outside the exercises page (selection simply off). */
export function useImageSlotSelection(): ImageSlotSelection | null {
  return useContext(ImageSlotSelectionContext);
}
