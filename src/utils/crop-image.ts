import { Rectangle } from '../stores/editor';

export function CropImage(image: HTMLImageElement, crop: Rectangle) {
	return new Promise((resolve: (image: HTMLImageElement) => void, reject: () => void) => {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return;
		}

		ctx.canvas.width = crop.width;
		ctx.canvas.height = crop.height;

		ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);

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
