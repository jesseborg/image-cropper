/* eslint-disable react-hooks/exhaustive-deps */
import { animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import clsx from 'clsx';
import { CSSProperties, ComponentProps, RefObject, useEffect, useRef, useState } from 'react';
import { TransformComponent, TransformWrapper, useTransformEffect } from 'react-zoom-pan-pinch';
import { useCropActions, useCropRect, type Rect } from '../stores/editor';
import { Button } from './button';

type ImageEditorProps = {
	src: string;
	onCancel?: () => void;
	onConfirm?: () => void;
};

export function ImageEditor({ src, onCancel, onConfirm }: ImageEditorProps) {
	const crop = useCropRect();
	const { setCropRect } = useCropActions();

	const [isLoading, setIsLoading] = useState(true);

	const imageRef = useRef<HTMLImageElement>(null);
	const imageTooSmall =
		imageRef.current &&
		(imageRef.current.naturalWidth < 350 || imageRef.current.naturalHeight < 350);

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
						contentClass={clsx('z-0 overflow-hidden h-full', {
							'h-auto': imageTooSmall
						})}
					>
						{!isLoading && <CropTool boundsRef={imageRef} onChange={setCropRect} />}
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
				<CropControls crop={crop} />
			</div>

			<div className="space-x-2 self-end">
				<Button intent="secondary" onClick={() => onCancel?.()}>
					Cancel
				</Button>
				<Button intent="primary" onClick={() => onConfirm?.()}>
					Crop
				</Button>
			</div>
		</div>
	);
}

type CropToolsProps = {
	boundsRef: RefObject<HTMLImageElement>;
	onChange?: (value: Rect) => void;
};
function CropTool({ boundsRef, onChange }: CropToolsProps) {
	const [scale, setScale] = useState(1);
	useTransformEffect(({ state }) => setScale(state.scale));

	const cropRef = useRef<HTMLDivElement>(null);

	// This is the scale factor from the original image to whats rendered on the screen
	const boundsScaleFactor = boundsRef.current!.naturalWidth / boundsRef.current!.clientWidth;
	const MIN_SIZE = 128;

	const [{ x, y, width, height }, api] = useSpring(() => ({
		x: 0,
		y: 0,
		width: MIN_SIZE / boundsScaleFactor,
		height: MIN_SIZE / boundsScaleFactor
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
						api.set({
							x: ox / scale,
							y: oy / scale,
							width: x.get() + width.get() - ox / scale,
							height: y.get() + height.get() - oy / scale
						});
						break;
					}
					case 'top-right': {
						api.set({
							y: oy / scale,
							width: ox / scale,
							height: y.get() + height.get() - oy / scale
						});
						break;
					}
					case 'bottom-right': {
						api.set({ width: ox / scale, height: oy / scale });
						break;
					}
					case 'bottom-left': {
						api.set({
							x: ox / scale,
							width: x.get() + width.get() - ox / scale,
							height: oy / scale
						});
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
						bottom: (y.get() + height.get()) * scale
					};

					const {
						dataset: { id }
					} = event?.target as HTMLDivElement;

					switch (id) {
						case 'top-left': {
							return {
								top: 0,
								left: 0,
								right: cropRect.right - minSize,
								bottom: cropRect.bottom - minSize
							};
						}
						case 'top-right': {
							return {
								top: 0,
								left: minSize,
								right: boundsRect.width - cropRect.left,
								bottom: cropRect.bottom - minSize
							};
						}
						case 'bottom-right': {
							return {
								top: minSize,
								left: minSize,
								right: boundsRect.width - cropRect.left,
								bottom: boundsRect.height - cropRect.top
							};
						}
						case 'bottom-left': {
							return {
								top: minSize,
								left: 0,
								right: cropRect.right - minSize,
								bottom: boundsRect.height - cropRect.top
							};
						}
						default: {
							return {
								top: 0,
								left: 0,
								right: boundsRect.width - width.get() * scale,
								bottom: boundsRect.height - height.get() * scale
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
		<animated.div
			{...bind()}
			ref={cropRef}
			style={{
				x: x.to(Math.round),
				y: y.to(Math.round),
				// +2px for border
				width: width.to((val) => 2 + Math.round(val)),
				height: height.to((val) => 2 + Math.round(val))
			}}
			className="fixed z-10 box-content cursor-move touch-none text-xs text-white shadow-[0px_0px_0px_20000px_rgba(0,_0,_0,_0.50)]"
		>
			<svg className="absolute h-full w-full overflow-visible">
				<g className="stroke-neutral-300" strokeWidth={2 / scale}>
					<rect id="ld" x="0" y="0" width="100%" height="100%" fill="none" />
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
	);
}

type ControlsProps = {
	crop: Rect;
};
function CropControls({ crop }: ControlsProps) {
	return (
		<div className="relative rounded-lg border border-neutral-400 bg-white p-2">
			<div className="flex gap-2 text-xs">
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">X:</b>
					{crop.x}
				</p>
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">Y:</b>
					{crop.y}
				</p>
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">W:</b>
					{crop.width}
				</p>
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">H:</b>
					{crop.height}
				</p>
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
