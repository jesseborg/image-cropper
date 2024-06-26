/* eslint-disable react-hooks/exhaustive-deps */
import clsx from 'clsx';
import { ComponentProps, useRef } from 'react';
import {
	ReactZoomPanPinchContentRef,
	ReactZoomPanPinchRef,
	TransformComponent,
	TransformWrapper
} from 'react-zoom-pan-pinch';
import { useHotKeys } from '../../hooks/use-hotkeys';
import { useStepper } from '../../hooks/use-stepper';
import {
	AspectRatio,
	useAspectRatio,
	useCropActions,
	useCropRect,
	useOriginalImage,
	useTransform
} from '../../stores/editor';
import { cropImage } from '../../utils/crop-image';
import { Button } from '../common/button';
import { CropTool } from './crop-tool';

export function ImageEditor() {
	const { previousStep, nextStep } = useStepper();

	const originalImage = useOriginalImage();

	const crop = useCropRect();
	const aspectRatio = useAspectRatio();
	const transform = useTransform();
	const { setCropRect, setCroppedImage, resetCropState, setTransform, setAspectRatio } =
		useCropActions();

	const imageTooSmall =
		originalImage && (originalImage.naturalWidth < 300 || originalImage.naturalHeight < 300);

	const transformRef = useRef<ReactZoomPanPinchContentRef>(null);

	useHotKeys({
		keys: {
			'0': {
				ctrlKey: true,
				action: () => transformRef.current!.zoomToElement('image', undefined, 0)
			},
			'-': {
				ctrlKey: true,
				action: () => transformRef.current!.zoomOut(0.1, 0)
			},
			'=': {
				ctrlKey: true,
				action: () => transformRef.current!.zoomIn(0.1, 0)
			},
			'.': {
				ctrlKey: true,
				action: () => transformRef.current!.zoomToElement('croppable', undefined, 0)
			},
			'Enter': handleCropImage,
			'Escape': handleCancelCrop
		}
	});

	function handleCancelCrop() {
		resetCropState();
		previousStep();
	}

	async function handleCropImage() {
		if (!originalImage) {
			return;
		}

		setCroppedImage(await cropImage(originalImage, crop));
		nextStep();
	}

	function handleTransformInit(ref: ReactZoomPanPinchRef) {
		// On init, zoom to the image so it's centered
		if (!transform) {
			ref.zoomToElement('image', undefined, 0);
			return;
		}

		// Otherwise, set the transform
		ref.setTransform(transform?.x ?? 0, transform?.y ?? 0, transform?.scale ?? 1, 10);
	}

	function handleTransform({ state: { positionX: x, positionY: y, scale } }: ReactZoomPanPinchRef) {
		setTransform({ x, y, scale });
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="relative flex h-full flex-col gap-2 self-center overflow-hidden rounded-lg p-2">
				{/* Checkerboard */}
				<CheckerBoard className="pointer-events-none absolute inset-0 z-0 h-full" />

				{/* Pan & Zoom Canvas */}
				<TransformWrapper
					ref={transformRef}
					onInit={handleTransformInit}
					onTransformed={handleTransform}
					minScale={0.1}
					maxScale={50}
					centerZoomedOut
					smooth={false}
					disablePadding={false}
					doubleClick={{ disabled: true }}
					panning={{
						velocityDisabled: true,
						allowRightClickPan: false,
						excluded: ['panning-none', 'rect', 'line', 'svg', 'circle', 'g']
					}}
				>
					{({
						instance: {
							transformState: { scale }
						}
					}) => (
						<TransformComponent
							wrapperClass={clsx('relative rounded-lg w-full border border-neutral-200 shadow-lg', {
								'min-h-[300px] min-w-[300px]': imageTooSmall,
								'[image-rendering:pixelated]': scale >= 5
							})}
						>
							<CropTool
								showGridLines
								initialCrop={crop}
								aspectRatio={aspectRatio.value}
								onChange={setCropRect}
								onChangeAspectRatio={setAspectRatio}
							>
								<img id="image" tabIndex={0} src={originalImage?.src} />
							</CropTool>
						</TransformComponent>
					)}
				</TransformWrapper>

				{/* Metadata & Controls */}
				<CropControls />
			</div>

			<div className="space-x-2 self-end">
				<Button variant="secondary" onClick={handleCancelCrop}>
					Cancel
				</Button>
				<Button variant="primary" onClick={handleCropImage}>
					Crop
				</Button>
			</div>
		</div>
	);
}

function CropControls() {
	const crop = useCropRect();
	const aspectRatio = useAspectRatio();
	const { setAspectRatio } = useCropActions();

	const aspectRatios: AspectRatio[] = [
		{ key: 'Free', value: 0 },
		{ key: '1:1', value: 1 / 1 },
		{ key: '3:4', value: 3 / 4 },
		{ key: '9:16', value: 9 / 16 }
	];

	return (
		<div className="relative flex flex-wrap justify-around gap-2 rounded-lg border border-neutral-400 bg-white p-2 px-3 sm:justify-between">
			<div className="flex gap-2 text-xs font-medium text-neutral-600">
				<p>
					<span className="pr-1 font-semibold text-neutral-950">W:</span>
					{Math.round(crop.width)}px
				</p>
				<p>
					<span className="pr-1 font-semibold text-neutral-950">H:</span>
					{Math.round(crop.height)}px
				</p>
			</div>

			<div className="flex gap-2">
				{aspectRatios.map((ratio) => (
					<Button
						key={ratio.key}
						className={clsx('rounded-sm font-medium text-neutral-400 hover:text-neutral-950', {
							'text-neutral-950': ratio.value === aspectRatio.value
						})}
						variant="blank"
						padding="none"
						onClick={() => setAspectRatio(ratio)}
					>
						{ratio.key}
					</Button>
				))}
			</div>
		</div>
	);
}

function CheckerBoard({ className, ...props }: ComponentProps<'svg'>) {
	return (
		<svg className={className} width="100%" height="100%" {...props}>
			<defs>
				<pattern id="checker" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
					<rect x="0" y="0" width="10" height="10" fill="#8e8e8e" />
					<rect x="10" y="0" width="10" height="10" fill="#a7a7a7" />
					<rect x="0" y="10" width="10" height="10" fill="#a7a7a7" />
					<rect x="10" y="10" width="10" height="10" fill="#8e8e8e" />
				</pattern>
			</defs>
			<rect x="0" y="0" width="100%" height="100%" fill="url(#checker)" />
		</svg>
	);
}
