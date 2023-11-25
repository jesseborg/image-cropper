import { SpringValue, animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import { CSSProperties, ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useTransformEffect } from 'react-zoom-pan-pinch';
import { useHotKeys } from '../hooks/use-hotkeys';
import { AspectRatio, type Rectangle } from '../stores/editor';
import { clamp } from '../utils/clamp';
import { RefHolder } from './ref-holder';

type CropToolsProps = {
	initialCrop: Rectangle;
	aspectRatio?: number;
	showGridLines?: boolean;
	onChange?: (value: Rectangle) => void;
	onChangeAspectRatio?: (aspectRatio: AspectRatio) => void;
};

type CropToolsPropsWithChildren = CropToolsProps & {
	children: ReactElement<HTMLImageElement>;
};

const MIN_SIZE = 1;
const MOVE_DISTANCE = 1;
const SHIFT_MULTIPLIER = 10;

export function CropTool({
	initialCrop,
	aspectRatio = 0,
	showGridLines = true,
	onChange,
	onChangeAspectRatio,
	children
}: CropToolsPropsWithChildren) {
	const [scale, setScale] = useState(1);
	useTransformEffect(({ state }) => setScale(state.scale));

	const cropRef = useRef<HTMLDivElement>(null);
	const boundsRef = useRef<HTMLImageElement>(null);

	// This is the scale factor from the original image to whats rendered on the screen
	const boundsScaleFactor = boundsRef.current
		? boundsRef.current.naturalWidth / boundsRef.current.clientWidth
		: 1;

	const handleArrowKey = (
		axis: SpringValue<number>,
		size: SpringValue<number>,
		{ key, ctrlKey, shiftKey }: KeyboardEvent
	) => {
		const direction = key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;
		const distance = (shiftKey ? MOVE_DISTANCE * SHIFT_MULTIPLIER : MOVE_DISTANCE) * direction;

		if (ctrlKey) {
			onChangeAspectRatio?.({ key: 'Free', value: 0 });
		}

		api.set({
			[axis.key!]: ctrlKey ? axis.get() : axis.get() + distance,
			[size.key!]: ctrlKey ? size.get() + distance : size.get()
		});
	};

	useHotKeys({
		keys: {
			ArrowUp: { action: (event) => handleArrowKey(y, height, event) },
			ArrowDown: { action: (event) => handleArrowKey(y, height, event) },
			ArrowLeft: { action: (event) => handleArrowKey(x, width, event) },
			ArrowRight: { action: (event) => handleArrowKey(x, width, event) }
		}
	});

	const keepCropInBounds = useCallback(
		(crop: Rectangle) => {
			if (!boundsRef.current) {
				return crop;
			}

			// Calculate new height considering aspect ratio
			const newHeight = aspectRatio ? crop.width / aspectRatio : crop.height;

			// Ensure new height is within specified bounds
			const clampedHeight = clamp(
				newHeight,
				MIN_SIZE / boundsScaleFactor,
				boundsRef.current.clientHeight
			);

			// Calculate new width based on clamped height and aspect ratio
			const clampedWidth = clamp(
				aspectRatio ? clampedHeight * aspectRatio : crop.width,
				MIN_SIZE / boundsScaleFactor,
				boundsRef.current.clientWidth
			);

			// Keep crop within bounds
			const adjustedX = Math.min(crop.x, boundsRef.current.clientWidth - clampedWidth);
			const adjustedY = Math.min(crop.y, boundsRef.current.clientHeight - clampedHeight);

			// Return the final values for the rectangle within bounds
			return {
				x: Math.max(0, adjustedX),
				y: Math.max(0, adjustedY),
				width: clampedWidth,
				height: clampedHeight
			};
		},
		[aspectRatio, boundsScaleFactor]
	);

	const [{ x, y, width, height }, api] = useSpring(
		{
			...keepCropInBounds({
				x: initialCrop.x / boundsScaleFactor,
				y: initialCrop.y / boundsScaleFactor,
				width: initialCrop.width / boundsScaleFactor,
				height: initialCrop.height / boundsScaleFactor
			}),
			immediate: true,
			onChange: ({ value }) => {
				api.set(
					keepCropInBounds({
						x: value.x,
						y: value.y,
						width: value.width,
						height: value.height
					})
				);

				onChange?.({
					x: x.get() * boundsScaleFactor,
					y: y.get() * boundsScaleFactor,
					width: width.get() * boundsScaleFactor,
					height: height.get() * boundsScaleFactor
				});
			}
		},
		[boundsRef.current, aspectRatio, boundsScaleFactor]
	);

	const bind = useGesture(
		{
			onDrag: ({ event, offset: [ox, oy] }) => {
				const {
					dataset: { id }
				} = event.target as HTMLDivElement;

				switch (id) {
					case 'top-left': {
						if (aspectRatio) {
							const yDiff = y.get() - oy / scale;
							const xDiff = x.get() - yDiff;

							const newX = Math.min(ox / scale, xDiff);
							const newWidth = x.get() + width.get() - newX;
							const newHeight = newWidth / aspectRatio;

							api.set({
								x: newX,
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
							const yDiff = y.get() - oy / scale;
							const xDiff = width.get() + yDiff;

							const newWidth = Math.max(ox / scale, xDiff);
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
							const newSize = Math.max(ox, oy * aspectRatio) / scale;
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
							const yDiff = height.get() - oy / scale;
							const xDiff = x.get() + yDiff;

							const newX = Math.min(ox / scale, xDiff);
							const newSize = x.get() + width.get() - newX;

							api.set({
								x: newX,
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

							const top = Math.max(0, cropRect.top - cropRect.left / aspectRatio);

							return {
								top,
								left,
								right: cropRect.right - minSize,
								bottom: cropRect.bottom - minSize
							};
						}
						case 'top-right': {
							const right = aspectRatio
								? Math.min(boundsRect.width - cropRect.left, cropRect.bottom * aspectRatio)
								: boundsRect.width - cropRect.left;

							const top = Math.max(
								0,
								cropRect.top - (boundsRect.width - cropRect.right) / aspectRatio
							);

							return {
								top,
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

							const bottom = Math.min(
								boundsRect.height - cropRect.top,
								(boundsRect.width - cropRect.left) / aspectRatio
							);

							return {
								top: minSize,
								left: minSize,
								right,
								bottom
							};
						}
						case 'bottom-left': {
							const left = aspectRatio
								? Math.max(0, cropRect.right - (boundsRect.height - cropRect.top) * aspectRatio)
								: 0;

							const bottom = Math.min(
								boundsRect.height - cropRect.top,
								(cropRect.right - left) / aspectRatio
							);

							return {
								top: minSize,
								left,
								right: cropRect.right - minSize,
								bottom
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
		function handleResize() {
			api.set(
				keepCropInBounds({
					x: x.get(),
					y: y.get(),
					width: width.get(),
					height: height.get()
				})
			);

			onChange?.({
				x: x.get() * boundsScaleFactor,
				y: y.get() * boundsScaleFactor,
				width: width.get() * boundsScaleFactor,
				height: height.get() * boundsScaleFactor
			});
		}

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [api, x, y, width, height, boundsScaleFactor, keepCropInBounds, onChange]);

	return (
		<>
			<span>
				<animated.div
					{...bind()}
					ref={cropRef}
					style={{
						x: x.to(Math.round),
						y: y.to(Math.round),
						// +2px for border
						width: width.to((val) => Math.max(MIN_SIZE, Math.round(val))),
						height: height.to((val) => Math.max(MIN_SIZE, Math.round(val)))
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

						{/* Grid Lines */}
						{showGridLines && (
							<g className="stroke-white opacity-30" strokeWidth={2 / scale}>
								<line x1="33.33%" y1="0" x2="33.33%" y2="100%" />
								<line x1="66.66%" y1="0" x2="66.66%" y2="100%" />
								<line x1="0" y1="33.33%" x2="100%" y2="33.33%" />
								<line x1="0" y1="66.66%" x2="100%" y2="66.66%" />
							</g>
						)}
					</svg>
				</animated.div>
				{/* Shadow */}
				<svg id="crop-shadow" className="pointer-events-none absolute h-full w-full">
					<defs>
						<mask id="crop">
							<rect x="0" y="0" width="100%" height="100%" fill="white" />
							<animated.rect
								style={{
									x: x.to(Math.round),
									y: y.to(Math.round),
									width: width.to((val) => Math.max(MIN_SIZE, Math.round(val))),
									height: height.to((val) => Math.max(MIN_SIZE, Math.round(val)))
								}}
								fill="black"
							/>
						</mask>
					</defs>
					<rect className="fill-black/50" width="100%" height="100%" mask="url(#crop)" />
				</svg>
			</span>

			<RefHolder ref={boundsRef} children={children} />
		</>
	);
}
