import { MouseEvent } from 'react';
import { useStepper } from '../hooks/use-stepper';
import { useCropActions, useCropRect, useCroppedImage } from '../stores/editor';
import { Button } from './button';

export function ImageDownload() {
	const { previousStep } = useStepper();

	const croppedImage = useCroppedImage();
	const { width, height } = useCropRect();
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
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-base font-medium text-neutral-800">Tada!</h1>
				<p className="text-xs text-neutral-500">Here's your cropped image!</p>
			</div>

			<div>
				<span className="relative">
					<img className="relative z-10 rounded-lg" src={croppedImage ?? ''} />
					<img
						className="absolute top-1/2 z-0 -translate-y-1/2 scale-95 rounded-lg blur-xl"
						src={croppedImage ?? ''}
					/>
				</span>
				<p className="mt-[6px] text-xs font-medium text-neutral-400">
					{width}x{height} — Free
				</p>
			</div>

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
