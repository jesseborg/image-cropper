import { create } from 'zustand';

export type Rectangle = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type AspectRatio = {
	key: string;
	value: number;
};

export type Transform = {
	x: number;
	y: number;
	scale: number;
};

type EditorState = {
	originalImage: string | null;
	croppedImage: string | null;
	cropRect: Rectangle;
	aspectRatio: AspectRatio;
	transform: Transform;
};

const intitialState: EditorState = {
	originalImage: null,
	croppedImage: null,
	cropRect: { x: 0, y: 0, width: 128, height: 128 },
	aspectRatio: {
		key: 'Free',
		value: 0
	},
	transform: {
		x: 0,
		y: 0,
		scale: 1
	}
};

interface EditorStore extends EditorState {
	actions: {
		setOriginalImage: (originalImage: string) => void;
		setCroppedImage: (croppedImage: string) => void;
		setCropRect: (cropRect: Rectangle) => void;
		setAspectRatio: (aspectRatio: AspectRatio) => void;
		setTransform: (transform: Transform) => void;
		removeCroppedImage: () => void;
		resetCropState: () => void;
	};
}

const useEditorStore = create<EditorStore>((set) => ({
	...intitialState,
	actions: {
		setOriginalImage: (originalImage: string) =>
			set((state) => {
				URL.revokeObjectURL(state.originalImage!);
				return { originalImage };
			}),
		setCroppedImage: (croppedImage: string) => set(() => ({ croppedImage })),
		setCropRect: (cropRect: Rectangle) => set(() => ({ cropRect })),
		setAspectRatio: (aspectRatio: AspectRatio) => set(() => ({ aspectRatio })),
		setTransform: (transform: Transform) => set(() => ({ transform })),
		removeCroppedImage: () =>
			set((state) => {
				URL.revokeObjectURL(state.croppedImage!);
				return { croppedImage: null };
			}),
		resetCropState: () =>
			set((state) => {
				URL.revokeObjectURL(state.originalImage!);
				return intitialState;
			})
	}
}));

export const useOriginalImage = () => useEditorStore((state) => state.originalImage);
export const useCroppedImage = () => useEditorStore((state) => state.croppedImage);
export const useCropRect = () => useEditorStore((state) => state.cropRect);
export const useAspectRatio = () => useEditorStore((state) => state.aspectRatio);
export const useTransform = () => useEditorStore((state) => state.transform);
export const useCropActions = () => useEditorStore((state) => state.actions);
