import { MouseEvent } from 'react';
import { useStepper } from '../hooks/use-stepper';
import { useAspectRatio, useCropActions, useCropRect, useCroppedImage } from '../stores/editor';
import { Button } from './button';

export function ImageDownload() {
	const { previousStep } = useStepper();

	const croppedImage = useCroppedImage();
	const { width, height } = useCropRect();
	const aspectRatio = useAspectRatio();
	const { removeCroppedImage } = useCropActions();

	function handleBackToCrop() {
		removeCroppedImage();
		previousStep();
	}

	function handleDownloadImage(event: MouseEvent) {
		event.preventDefault();

		if (!croppedImage) {
			return;
		}

		const link = document.createElement('a');
		link.download = `cropped_${width}x${height}.png`;
		link.href = croppedImage;
		link.click();
	}

	return (
		<div className="relative flex max-h-full flex-col gap-4">
			<div>
				<h1 className="text-base font-medium text-neutral-800">Tada!</h1>
				<p className="text-xs text-neutral-500">Here's your cropped image!</p>
			</div>

			<div className="relative flex h-full items-center justify-center overflow-hidden">
				<img
					className="relative z-10 max-h-full w-auto rounded-lg object-cover"
					src={croppedImage!}
					alt="Cropped Image"
				/>
			</div>
			<p className="-mt-[6px] text-xs font-medium text-neutral-400">
				{width}x{height} — {aspectRatio.key}
			</p>

			<div className="space-x-2 self-end">
				<Button variant="secondary" onClick={handleBackToCrop}>
					Edit
				</Button>
				<Button variant="primary" onClick={handleDownloadImage}>
					Download
				</Button>
			</div>
		</div>
	);
}
