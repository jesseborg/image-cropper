/* eslint-disable react-hooks/exhaustive-deps */
import { animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import clsx from 'clsx';
import { CSSProperties, ComponentProps, RefObject, useEffect, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper, useTransformEffect } from 'react-zoom-pan-pinch';
import {
	AspectRatio,
	useAspectRatio,
	useCropActions,
	useCropRect,
	type Rect
} from '../stores/editor';
import { Button } from './button';

type ImageEditorProps = {
	src: string;
	onCancel?: () => void;
	onConfirm?: () => void;
};

export function ImageEditor({ src, onCancel, onConfirm }: ImageEditorProps) {
	const crop = useCropRect();
	const aspectRatio = useAspectRatio();
	const { setCropRect, setCroppedImage, setAspectRatio, resetCropState } = useCropActions();

	const [isLoading, setIsLoading] = useState(true);

	const imageRef = useRef<HTMLImageElement>(null);
	const imageTooSmall =
		imageRef.current &&
		(imageRef.current.naturalWidth < 350 || imageRef.current.naturalHeight < 350);

	function handleCancelCrop() {
		resetCropState();
		onCancel?.();
	}

	function handleCropImage() {
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		if (!ctx || !imageRef.current) {
			return;
		}

		ctx.canvas.width = crop.width;
		ctx.canvas.height = crop.height;

		ctx.drawImage(
			imageRef.current,
			crop.x,
			crop.y,
			crop.width,
			crop.height,
			0,
			0,
			crop.width,
			crop.height
		);

		canvas.toBlob((blob) => {
			if (!blob) {
				return;
			}

			setCroppedImage(URL.createObjectURL(blob));
			onConfirm?.();
		});
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="relative flex h-full flex-col gap-2 self-center overflow-hidden rounded-lg p-2">
				{/* Checkerboard */}
				<CheckerBoard className="pointer-events-none absolute inset-0 z-0 h-full" />

				{/* Pan & Zoom Canvas */}
				<TransformWrapper
					minScale={0.5}
					centerZoomedOut
					limitToBounds={false}
					disablePadding={true}
					doubleClick={{ disabled: true }}
					panning={{
						velocityDisabled: true,
						allowRightClickPan: false,
						excluded: ['panning-none', 'rect', 'line', 'svg', 'circle', 'g']
					}}
				>
					<TransformComponent
						wrapperClass={clsx(
							'relative rounded-lg w-full border border-neutral-200 shadow-lg flex items-center justify-center',
							{
								'min-h-[350px] min-w-[350px] !block': imageTooSmall
							}
						)}
						contentClass={clsx('z-0 h-full', {
							'!h-auto': imageTooSmall
						})}
					>
						{!isLoading && (
							<CropTool
								initialCrop={crop}
								aspectRatio={aspectRatio.value}
								boundsRef={imageRef}
								onChange={setCropRect}
							/>
						)}
						<div className="contents max-h-full w-full items-center justify-center">
							<img
								ref={imageRef}
								className="max-h-full"
								src={src}
								onLoad={() => setIsLoading(false)}
							/>
						</div>
					</TransformComponent>
				</TransformWrapper>

				{/* Metadata & Controls */}
				<CropControls crop={crop} onAspectRatioChange={setAspectRatio} />
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

type CropToolsProps = {
	initialCrop: Rect;
	aspectRatio?: number;
	boundsRef: RefObject<HTMLImageElement>;
	onChange?: (value: Rect) => void;
};
function CropTool({ initialCrop, aspectRatio, boundsRef, onChange }: CropToolsProps) {
	const [scale, setScale] = useState(1);
	useTransformEffect(({ state }) => setScale(state.scale));

	const cropRef = useRef<HTMLDivElement>(null);

	// This is the scale factor from the original image to whats rendered on the screen
	const boundsScaleFactor = boundsRef.current!.naturalWidth / boundsRef.current!.clientWidth;
	const MIN_SIZE = 128;

	const [{ x, y, width, height }, api] = useSpring(() => ({
		x: initialCrop.x / boundsScaleFactor,
		y: initialCrop.y / boundsScaleFactor,
		width: initialCrop.width / boundsScaleFactor,
		height: initialCrop.height / boundsScaleFactor
	}));

	function convertToOriginalCoordinates(rect: Rect) {
		return {
			x: Math.round(rect.x * boundsScaleFactor),
			y: Math.round(rect.y * boundsScaleFactor),
			width: Math.round(rect.width * boundsScaleFactor),
			height: Math.round(rect.height * boundsScaleFactor)
		};
	}

	const bind = useGesture(
		{
			onDrag: ({ event, offset: [ox, oy] }) => {
				const {
					dataset: { id }
				} = event.target as HTMLDivElement;

				switch (id) {
					case 'top-left': {
						if (aspectRatio) {
							const newWidth = x.get() + width.get() - ox / scale;
							const newHeight = newWidth / aspectRatio;
							api.set({
								x: ox / scale,
								y: y.get() + height.get() - newHeight,
								width: newWidth,
								height: newHeight
							});
						} else {
							api.set({
								x: ox / scale,
								y: oy / scale,
								width: x.get() + width.get() - ox / scale,
								height: y.get() + height.get() - oy / scale
							});
						}
						break;
					}
					case 'top-right': {
						if (aspectRatio) {
							const newWidth = ox / scale;
							const newHeight = newWidth / aspectRatio;
							api.set({
								y: y.get() + height.get() - newHeight,
								width: newWidth,
								height: newHeight
							});
						} else {
							api.set({
								y: oy / scale,
								width: ox / scale,
								height: y.get() + height.get() - oy / scale
							});
						}
						break;
					}
					case 'bottom-right': {
						if (aspectRatio) {
							const newSize = ox / scale;
							api.set({
								width: newSize,
								height: newSize / aspectRatio
							});
						} else {
							api.set({ width: ox / scale, height: oy / scale });
						}
						break;
					}
					case 'bottom-left': {
						if (aspectRatio) {
							const newSize = x.get() + width.get() - ox / scale;
							api.set({
								x: ox / scale,
								width: newSize,
								height: newSize / aspectRatio
							});
						} else {
							api.set({
								x: ox / scale,
								width: x.get() + width.get() - ox / scale,
								height: oy / scale
							});
						}
						break;
					}
					default: {
						api.set({ x: ox / scale, y: oy / scale });
						break;
					}
				}

				// handle onchange event
				onChange?.(
					convertToOriginalCoordinates({
						x: x.get(),
						y: y.get(),
						width: width.get(),
						height: height.get()
					})
				);
			}
		},
		{
			drag: {
				filterTaps: true,
				bounds: (event) => {
					if (!boundsRef.current) {
						return {};
					}

					const minSize =
						MIN_SIZE /
						(boundsRef.current.naturalWidth / boundsRef.current.getBoundingClientRect().width);

					const boundsRect = boundsRef.current.getBoundingClientRect();
					const cropRect = {
						top: y.get() * scale,
						left: x.get() * scale,
						right: (x.get() + width.get()) * scale,
						bottom: (y.get() + height.get()) * scale,
						width: width.get() * scale,
						height: height.get() * scale
					};

					const {
						dataset: { id }
					} = event?.target as HTMLDivElement;

					/* NOTE: Bounds are based on the "from" coordinates, NOT the image bounds */

					switch (id) {
						case 'top-left': {
							const left = aspectRatio
								? Math.max(0, cropRect.right - cropRect.bottom * aspectRatio)
								: 0;

							return {
								top: 0,
								left,
								right: cropRect.right - minSize,
								bottom: cropRect.bottom - minSize
							};
						}
						case 'top-right': {
							const right = aspectRatio
								? Math.min(boundsRect.width - cropRect.left, cropRect.bottom * aspectRatio)
								: boundsRect.width - cropRect.left;

							return {
								top: 0,
								left: minSize,
								right,
								bottom: cropRect.bottom - minSize
							};
						}
						case 'bottom-right': {
							const right = aspectRatio
								? Math.min(
										boundsRect.width - cropRect.left,
										(boundsRect.height - cropRect.top) * aspectRatio
								  )
								: boundsRect.width - cropRect.left;

							return {
								top: minSize,
								left: minSize,
								right,
								bottom: boundsRect.height - cropRect.top
							};
						}
						case 'bottom-left': {
							const left = aspectRatio
								? Math.max(0, cropRect.right - (boundsRect.height - cropRect.top) * aspectRatio)
								: 0;

							return {
								top: minSize,
								left,
								right: cropRect.right - minSize,
								bottom: boundsRect.height - cropRect.top
							};
						}
						default: {
							return {
								top: 0,
								left: 0,
								right: boundsRect.width - cropRect.width,
								bottom: boundsRect.height - cropRect.height
							};
						}
					}
				},
				from: (event) => {
					const {
						dataset: { id }
					} = event.target as HTMLDivElement;

					switch (id) {
						case 'top-right': {
							return [width.get() * scale, y.get() * scale];
						}
						case 'bottom-right': {
							return [width.get() * scale, height.get() * scale];
						}
						case 'bottom-left': {
							return [x.get() * scale, height.get() * scale];
						}
						default: {
							return [x.get() * scale, y.get() * scale];
						}
					}
				}
			}
		}
	);

	useEffect(() => {
		if (!boundsRef.current) {
			return;
		}

		onChange?.(
			convertToOriginalCoordinates({
				x: x.get(),
				y: y.get(),
				width: width.get(),
				height: height.get()
			})
		);

		function keepCropToolInBounds() {
			// const relativeBoundsRect = getRelativeBounds(containerElement, boundsRef.current);
			// console.log(relativeBoundsRect.left);
			// setBoundsLeft(relativeBoundsRect.left);
			// const relativeImageRect = getRelativeBounds(containerElement, imageElement);
			// api.set({
			// 	x: clamp(x.get(), relativeImageRect.left, relativeImageRect.right - cropRect.width),
			// 	y: clamp(y.get(), relativeImageRect.top, relativeImageRect.bottom - cropRect.height)
			// });
		}

		window.addEventListener('resize', keepCropToolInBounds);

		return () => {
			window.removeEventListener('resize', keepCropToolInBounds);
		};
	}, []);

	return (
		<div>
			<animated.div
				{...bind()}
				ref={cropRef}
				style={{
					x: x.to(Math.round),
					y: y.to(Math.round),
					// +2px for border
					width: width.to((val) => Math.round(val) + 2),
					height: height.to((val) => Math.round(val) + 2)
				}}
				className="absolute z-10 cursor-move touch-none"
			>
				<svg className="absolute h-full w-full overflow-visible">
					<g className="stroke-neutral-300" strokeWidth={2 / scale}>
						<rect x="0" y="0" width="100%" height="100%" fill="none" />
					</g>
					<g
						style={{ r: 6 / scale } as CSSProperties}
						className="fill-neutral-50 [r:6] [&>circle]:[r:inherit]"
					>
						<circle data-id="top-left" className="cursor-nw-resize" cx="0" cy="0" />
						<circle data-id="top-right" className="cursor-ne-resize" cx="100%" cy="0" />
						<circle data-id="bottom-right" className="cursor-nw-resize" cx="100%" cy="100%" />
						<circle data-id="bottom-left" className="cursor-ne-resize" cx="0" cy="100%" />
					</g>
					<g className="stroke-white opacity-30" strokeWidth={2 / scale}>
						<line x1="33.33%" y1="0" x2="33.33%" y2="100%" />
						<line x1="66.66%" y1="0" x2="66.66%" y2="100%" />
						<line x1="0" y1="33.33%" x2="100%" y2="33.33%" />
						<line x1="0" y1="66.66%" x2="100%" y2="66.66%" />
					</g>
				</svg>
			</animated.div>

			{/* Shadow */}
			<svg id="crop-shadow" className="pointer-events-none absolute h-full w-full">
				<defs>
					<mask id="crop">
						<rect x="0" y="0" width="100%" height="100%" fill="white" />
						<rect
							x={Math.round(x.get())}
							y={Math.round(y.get())}
							width={Math.round(width.get() + 2)}
							height={Math.round(height.get() + 2)}
							fill="black"
						/>
					</mask>
				</defs>

				<rect className="h-full w-full fill-black/50" mask="url(#crop)" />
			</svg>
		</div>
	);
}

type ControlsProps = {
	crop: Rect;
	onAspectRatioChange?: (aspectRatio: AspectRatio) => void;
};

function CropControls({ crop, onAspectRatioChange }: ControlsProps) {
	const aspectRatio = useAspectRatio();
	const aspectRatios: AspectRatio[] = [
		{ key: 'Free', value: 0 },
		{ key: '1:1', value: 1 / 1 },
		{ key: '3:4', value: 3 / 4 },
		{ key: '9:16', value: 9 / 16 }
	];

	return (
		<div className="relative flex flex-wrap gap-2 rounded-lg border border-neutral-400 bg-white p-2 px-3">
			<div className="mx-auto flex w-auto gap-2 text-xs sm:mx-0 sm:w-0">
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">W:</b>
					{crop.width}px
				</p>
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">H:</b>
					{crop.height}px
				</p>
			</div>

			<div className="mx-auto flex gap-2">
				{aspectRatios.map((ratio) => (
					<Button
						key={ratio.key}
						className={clsx('rounded-sm font-medium text-neutral-500 hover:text-neutral-950', {
							'text-neutral-950': ratio.value === aspectRatio.value
						})}
						variant="blank"
						padding="none"
						onClick={() => onAspectRatioChange?.(ratio)}
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
