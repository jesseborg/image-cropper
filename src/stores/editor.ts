import { create } from 'zustand';

export type Rect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

type EditorState = {
	croppedImage: string | null;
	cropRect: Rect;
};
interface EditorStore extends EditorState {
	actions: {
		setCropRect: (crop: Rect) => void;
		setCroppedImage: (image: string) => void;
		removeCroppedImage: () => void;
		resetCropState: () => void;
	};
}

const intitialState: EditorState = {
	croppedImage: null,
	cropRect: { x: 0, y: 0, width: 128, height: 128 }
};

const useEditorStore = create<EditorStore>((set) => ({
	...intitialState,
	actions: {
		setCropRect: (crop: Rect) => set(() => ({ cropRect: crop })),
		setCroppedImage: (image: string) => set(() => ({ croppedImage: image })),
		removeCroppedImage: () =>
			set((state) => {
				URL.revokeObjectURL(state.croppedImage!);
				return { croppedImage: null };
			}),
		resetCropState: () => set(() => intitialState)
	}
}));

export const useCropRect = () => useEditorStore((state) => state.cropRect);
export const useCroppedImage = () => useEditorStore((state) => state.croppedImage);
export const useCropActions = () => useEditorStore((state) => state.actions);
