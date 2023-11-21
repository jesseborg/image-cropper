import { Rectangle } from '../stores/editor';

export function cropImage(image: HTMLImageElement, crop: Rectangle) {
	return new Promise((resolve: (image: HTMLImageElement) => void, reject: () => void) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return;
		}

		// Clamp to original image bounds
		const width = Math.min(crop.width, image.width);
		const height = Math.min(crop.height, image.height);

		ctx.canvas.width = width;
		ctx.canvas.height = height;

		ctx.drawImage(image, crop.x, crop.y, width, height, 0, 0, width, height);

		canvas.toBlob(async (blob) => {
			if (!blob) {
				return reject();
			}

			const image = new Image();
			image.src = URL.createObjectURL(blob);
			await image.decode();

			return resolve(image);
		});
	});
}
