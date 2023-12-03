import { SpringValue, animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import { CSSProperties, ReactElement, useCallback, useEffect, useRef, useState } from 'react';
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
	const [lastCrop, setLastCrop] = useState(initialCrop);

	const cropRef = useRef<HTMLDivElement>(null);
	const boundsRef = useRef<HTMLImageElement>(null);

	// This is the scale factor from the original image to whats rendered on the screen
	const boundsScaleFactor = boundsRef.current
		? boundsRef.current.naturalWidth / boundsRef.current.clientWidth
		: 1;

	const scale = boundsRef.current
		? Math.round(
				(boundsRef.current.getBoundingClientRect().width / boundsRef.current.clientWidth) * 10
		  ) / 10
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

		api.set(
			keepCropInBounds({
				x: x.get(),
				y: y.get(),
				width: width.get(),
				height: height.get(),
				[axis.key!]: ctrlKey ? axis.get() : axis.get() + distance,
				[size.key!]: ctrlKey ? size.get() + distance : size.get()
			})
		);
	};

	useHotKeys({
		keys: {
			ArrowUp: (event) => handleArrowKey(y, height, event),
			ArrowDown: (event) => handleArrowKey(y, height, event),
			ArrowLeft: (event) => handleArrowKey(x, width, event),
			ArrowRight: (event) => handleArrowKey(x, width, event)
		}
	});

	const keepCropInBounds = useCallback(
		(crop: Rectangle) => {
			if (!boundsRef.current) {
				return crop;
			}

			// Ensure new height is within specified bounds
			const clampedHeight = clamp(
				aspectRatio ? crop.width / aspectRatio : crop.height,
				MIN_SIZE,
				boundsRef.current.clientHeight
			);

			// Calculate new width based on clamped height and aspect ratio
			const clampedWidth = clamp(
				aspectRatio ? clampedHeight * aspectRatio : crop.width,
				MIN_SIZE,
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
		[aspectRatio]
	);

	const [{ x, y, width, height }, api] = useSpring(
		{
			...keepCropInBounds(initialCrop),
			immediate: true,
			onChange: () => {
				onChange?.({
					x: x.get() * boundsScaleFactor,
					y: y.get() * boundsScaleFactor,
					width: width.get() * boundsScaleFactor,
					height: height.get() * boundsScaleFactor
				});
			}
		},
		[aspectRatio, boundsScaleFactor]
	);

	// Update crop whenever aspect ratio changes
	useEffect(() => {
		const crop = keepCropInBounds({
			x: x.get(),
			y: y.get(),
			width: width.get(),
			height: height.get()
		});

		api.set(crop);
		setLastCrop(crop);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [aspectRatio]);

	function setCrop(crop: Partial<Rectangle>) {
		const rect = Object.fromEntries(
			Object.entries(crop).map(([key, value]) => {
				if (key === 'width' || key === 'height') {
					return [key, Math.max(MIN_SIZE, Math.round(value))];
				}
				return [key, Math.round(value)];
			})
		);
		api.set(rect);
	}

	const bind = useGesture(
		{
			onDrag: ({ event, offset }) => {
				const {
					dataset: { id }
				} = event.target as HTMLDivElement;

				const ox = Math.round(offset[0] / scale);
				const oy = Math.round(offset[1] / scale);

				switch (id) {
					case 'top-left': {
						if (aspectRatio) {
							const yDiff = Math.round((lastCrop.y - oy) * aspectRatio);
							const xDiff = lastCrop.x - yDiff;

							const newX = Math.min(ox, xDiff);
							const newWidth = lastCrop.x + lastCrop.width - newX;
							const newHeight = newWidth / aspectRatio;

							setCrop({
								x: newX,
								y: lastCrop.y + lastCrop.height - newHeight,
								width: newWidth,
								height: newHeight
							});
						} else {
							setCrop({
								x: ox,
								y: oy,
								width: lastCrop.width - (ox - lastCrop.x),
								height: lastCrop.height - (oy - lastCrop.y)
							});
						}
						break;
					}
					case 'top-right': {
						if (aspectRatio) {
							const yDiff = Math.round((lastCrop.y - oy) * aspectRatio);
							const xDiff = lastCrop.width + yDiff;

							const newWidth = Math.max(ox - lastCrop.x, xDiff);
							const newHeight = newWidth / aspectRatio;

							const heightDiff = newHeight - lastCrop.height;

							setCrop({
								y: lastCrop.y - heightDiff,
								width: newWidth,
								height: newHeight
							});
						} else {
							setCrop({
								y: oy,
								width: ox - lastCrop.x,
								height: lastCrop.height - (oy - lastCrop.y)
							});
						}
						break;
					}
					case 'bottom-right': {
						if (aspectRatio) {
							const newSize = Math.max(ox - lastCrop.x, (oy - lastCrop.y) * aspectRatio);
							setCrop({ width: newSize, height: newSize / aspectRatio });
						} else {
							setCrop({ width: ox - lastCrop.x, height: oy - lastCrop.y });
						}
						break;
					}
					case 'bottom-left': {
						if (aspectRatio) {
							const yDiff = Math.round((lastCrop.height - (oy - lastCrop.y)) * aspectRatio);
							const xDiff = lastCrop.x + yDiff;

							const newX = Math.min(ox, xDiff);
							const newSize = lastCrop.x + lastCrop.width - newX;

							setCrop({
								x: newX,
								width: newSize,
								height: newSize / aspectRatio
							});
						} else {
							setCrop({
								x: ox,
								width: lastCrop.width - (ox - lastCrop.x),
								height: oy - lastCrop.y
							});
						}
						break;
					}
					default: {
						setCrop({ x: ox, y: oy });
						break;
					}
				}
			},
			onDragStart: () => {
				setLastCrop({ x: x.get(), y: y.get(), width: width.get(), height: height.get() });
			},
			onDragEnd: () => {
				setLastCrop({ x: x.get(), y: y.get(), width: width.get(), height: height.get() });
			}
		},
		{
			drag: {
				filterTaps: true,
				bounds: (event) => {
					if (!boundsRef.current || !cropRef.current) {
						return {};
					}

					const boundsRect = {
						width: boundsRef.current.clientWidth * scale,
						height: boundsRef.current.clientHeight * scale
					};
					const cropRect = {
						width: cropRef.current.clientWidth * scale,
						height: cropRef.current.clientHeight * scale,
						top: y.get() * scale,
						left: x.get() * scale,
						right: (x.get() + cropRef.current.clientWidth) * scale,
						bottom: (y.get() + cropRef.current.clientHeight) * scale
					};

					const {
						dataset: { id }
					} = event?.target as HTMLDivElement;

					switch (id) {
						case 'top-left': {
							const left = aspectRatio
								? Math.max(0, cropRect.right - cropRect.bottom * aspectRatio)
								: 0;
							const top = aspectRatio ? Math.max(0, cropRect.top - cropRect.left / aspectRatio) : 0;

							return {
								top,
								left,
								right: cropRect.right - MIN_SIZE * scale,
								bottom: cropRect.bottom - MIN_SIZE * scale
							};
						}
						case 'top-right': {
							const right = aspectRatio
								? Math.min(boundsRect.width, cropRect.left + cropRect.bottom * aspectRatio)
								: boundsRect.width;
							const top = aspectRatio
								? Math.max(0, cropRect.bottom + (cropRect.left - right) / aspectRatio)
								: 0;

							return {
								top,
								left: cropRect.left - MIN_SIZE * scale,
								right,
								bottom: cropRect.bottom - MIN_SIZE * scale
							};
						}
						case 'bottom-right': {
							const right = aspectRatio
								? Math.min(
										boundsRect.width,
										cropRect.left + (boundsRect.height - cropRect.top) * aspectRatio
								  )
								: boundsRect.width;
							const bottom = aspectRatio
								? Math.min(boundsRect.height, cropRect.top - (cropRect.left - right) / aspectRatio)
								: boundsRect.height;

							return {
								top: cropRect.top + MIN_SIZE * scale,
								left: cropRect.left + MIN_SIZE * scale,
								right,
								bottom
							};
						}
						case 'bottom-left': {
							const left = aspectRatio
								? Math.max(0, cropRect.right - (boundsRect.height - cropRect.top) * aspectRatio)
								: 0;
							const bottom = aspectRatio
								? Math.min(boundsRect.height, cropRect.top + (cropRect.right - left) / aspectRatio)
								: boundsRect.height;

							return { top: 0, left, right: cropRect.right - MIN_SIZE * scale, bottom };
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
							return [(x.get() + width.get()) * scale, y.get() * scale];
						}
						case 'bottom-right': {
							return [(x.get() + width.get()) * scale, (y.get() + height.get()) * scale];
						}
						case 'bottom-left': {
							return [x.get() * scale, (y.get() + height.get()) * scale];
						}
						default: {
							return [x.get() * scale, y.get() * scale];
						}
					}
				}
			}
		}
	);

	// useEffect(() => {
	// 	function handleResize() {
	// 		const crop = keepCropInBounds({
	// 			x: x.get(),
	// 			y: y.get(),
	// 			width: width.get(),
	// 			height: height.get()
	// 		});

	// 		api.set(crop);
	// 		setLastCrop(crop);

	// 		// onChange?.({
	// 		// 	x: x.get() * boundsScaleFactor,
	// 		// 	y: y.get() * boundsScaleFactor,
	// 		// 	width: width.get() * boundsScaleFactor,
	// 		// 	height: height.get() * boundsScaleFactor
	// 		// });
	// 	}

	// 	window.addEventListener('resize', handleResize);

	// 	return () => {
	// 		window.removeEventListener('resize', handleResize);
	// 	};
	// }, [api, x, y, width, height, boundsScaleFactor, keepCropInBounds, onChange]);

	return (
		<>
			<span>
				{/* Crop Area */}
				<animated.div
					{...bind()}
					ref={cropRef}
					style={{ x, y, width, height }}
					className="absolute z-10 cursor-move touch-none"
				>
					<svg className="absolute h-full w-full overflow-visible">
						<g className="stroke-neutral-300" strokeWidth={2 / scale}>
							<rect x="0" y="0" width="100%" height="100%" fill="none" />
						</g>
						{/* Corners */}
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
							<animated.rect style={{ x, y, width, height }} fill="black" />
						</mask>
					</defs>
					<rect className="fill-black/50" width="100%" height="100%" mask="url(#crop)" />
				</svg>
			</span>

			<RefHolder ref={boundsRef} children={children} />
		</>
	);
}
