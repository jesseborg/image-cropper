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
	originalImage: HTMLImageElement | null;
	croppedImage: HTMLImageElement | null;
	cropRect: Rectangle;
	aspectRatio: AspectRatio;
	transform: Transform | null;
};

const intitialState: EditorState = {
	originalImage: null,
	croppedImage: null,
	cropRect: { x: 0, y: 0, width: 128, height: 128 },
	aspectRatio: {
		key: 'Free',
		value: 0
	},
	transform: null
};

interface EditorStore extends EditorState {
	actions: {
		setOriginalImage: (originalImage: HTMLImageElement) => void;
		setCroppedImage: (croppedImage: HTMLImageElement) => void;
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
		setOriginalImage: (originalImage) =>
			set((state) => {
				if (state.originalImage?.src) {
					URL.revokeObjectURL(state.originalImage.src);
				}

				return { originalImage };
			}),
		setCroppedImage: (croppedImage) => set(() => ({ croppedImage })),
		setCropRect: (cropRect) => set(() => ({ cropRect })),
		setAspectRatio: (aspectRatio) => set(() => ({ aspectRatio })),
		setTransform: (transform) => set(() => ({ transform })),
		removeCroppedImage: () =>
			set((state) => {
				URL.revokeObjectURL(state.croppedImage!.src);
				return { croppedImage: null };
			}),
		resetCropState: () =>
			set((state) => {
				URL.revokeObjectURL(state.originalImage!.src);
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
