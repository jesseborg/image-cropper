import { Rect } from '../stores/editor';

export function CropImageToBlob(image: HTMLImageElement, crop: Rect) {
	return new Promise((resolve: (url: string) => void, reject: () => void) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return;
		}

		ctx.canvas.width = crop.width;
		ctx.canvas.height = crop.height;

		ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

		canvas.toBlob((blob) => {
			if (!blob) {
				return reject();
			}

			return resolve(URL.createObjectURL(blob));
		});
	});
}
