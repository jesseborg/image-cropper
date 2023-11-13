import { create } from 'zustand';

export type Rect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

interface EditorStore {
	originalImage: HTMLImageElement | null;
	croppedImage: HTMLImageElement | null;
	cropRect: Rect;
	actions: {
		setCropRect: (crop: Rect) => void;
	};
}

const useEditorStore = create<EditorStore>((set) => ({
	originalImage: null,
	croppedImage: null,
	cropRect: {
		x: 0,
		y: 0,
		width: 128,
		height: 128
	},
	actions: {
		setCropRect: (crop: Rect) => set(() => ({ cropRect: crop }))
	}
}));

export const useCropRect = () => useEditorStore((state) => state.cropRect);
export const useOriginalImage = () => useEditorStore((state) => state.originalImage);
export const useCroppedImage = () => useEditorStore((state) => state.croppedImage);
export const useCropActions = () => useEditorStore((state) => state.actions);
