import { create } from 'zustand';

export type Rect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type AspectRatio = {
	key: string;
	value: number;
};

type EditorState = {
	croppedImage: string | null;
	cropRect: Rect;
	aspectRatio: AspectRatio;
};
interface EditorStore extends EditorState {
	actions: {
		setCropRect: (crop: Rect) => void;
		setCroppedImage: (image: string) => void;
		setAspectRatio: (aspectRatio: AspectRatio) => void;
		removeCroppedImage: () => void;
		resetCropState: () => void;
	};
}

const intitialState: EditorState = {
	croppedImage: null,
	cropRect: { x: 0, y: 0, width: 128, height: 128 },
	aspectRatio: {
		key: 'Free',
		value: 0
	}
};

const useEditorStore = create<EditorStore>((set) => ({
	...intitialState,
	actions: {
		setCropRect: (cropRect: Rect) => set(() => ({ cropRect })),
		setCroppedImage: (croppedImage: string) => set(() => ({ croppedImage })),
		setAspectRatio: (aspectRatio: AspectRatio) => set(() => ({ aspectRatio })),
		removeCroppedImage: () =>
			set((state) => {
				URL.revokeObjectURL(state.croppedImage!);
				return { croppedImage: null };
			}),
		resetCropState: () => set(() => intitialState)
	}
}));

export const useCroppedImage = () => useEditorStore((state) => state.croppedImage);
export const useCropRect = () => useEditorStore((state) => state.cropRect);
export const useAspectRatio = () => useEditorStore((state) => state.aspectRatio);
export const useCropActions = () => useEditorStore((state) => state.actions);
