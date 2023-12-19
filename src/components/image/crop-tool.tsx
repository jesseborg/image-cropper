import { SpringValue, animated, useSpring } from '@react-spring/web';
import { EventTypes, FullGestureState, useGesture } from '@use-gesture/react';
import { CSSProperties, ReactElement, useEffect, useRef, useState } from 'react';
import { useHotKeys } from '../../hooks/use-hotkeys';
import { AspectRatio, type Rectangle } from '../../stores/editor';
import { clamp } from '../../utils/clamp';
import { simulatePointerEvent } from '../../utils/simulate-pointer-event';
import { RefHolder } from '../utils/ref-holder';

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

export function CropTool({ children, ...props }: CropToolsPropsWithChildren) {
	const boundsRef = useRef<HTMLImageElement>(null);

	return (
		<>
			{boundsRef.current && <Resizable boundsRef={boundsRef.current} {...props} />}
			<RefHolder ref={boundsRef} children={children} />
		</>
	);
}

type ResizableProps = {
	boundsRef: HTMLImageElement;
};

function Resizable({
	boundsRef,
	initialCrop,
	aspectRatio,
	showGridLines,
	onChange,
	onChangeAspectRatio
}: ResizableProps & CropToolsProps) {
	const cropRef = useRef<HTMLDivElement>(null);

	// This is the scale factor from the original image to whats rendered on the screen
	const [boundsScaleFactor, setBoundsScaleFactor] = useState({
		x: boundsRef.naturalWidth / boundsRef.width,
		y: boundsRef.naturalHeight / boundsRef.height
	});

	// Get the zoomable canvas scale and round to two decimal places
	const scale =
		Math.round((boundsRef.getBoundingClientRect().width / boundsRef.clientWidth) * 10) / 10;

	const handleArrowKey = (
		{ key, ctrlKey, shiftKey }: KeyboardEvent,
		axis: SpringValue<number>,
		size: SpringValue<number>
	) => {
		if (!boundsRef) {
			return;
		}

		const axisKey = axis.key as 'x' | 'y';
		const sizeKey = size.key as 'width' | 'height';

		const scaleFactor =
			sizeKey === 'width' || axisKey === 'x' ? boundsScaleFactor.x : boundsScaleFactor.y;

		const direction = key === 'ArrowUp' || key === 'ArrowLeft' ? -1 : 1;
		const distance =
			((shiftKey ? MOVE_DISTANCE * SHIFT_MULTIPLIER : MOVE_DISTANCE) * direction) / scaleFactor;

		const newAxis = ctrlKey ? axis.get() : axis.get() + distance;
		const newSize = ctrlKey ? size.get() + distance : size.get();

		const maxAxis = boundsRef[sizeKey] - size.get();
		const maxSize = boundsRef[sizeKey] - axis.get();

		const clampedAxis = clamp(newAxis, 0, maxAxis);
		const clampedSize = clamp(newSize, MIN_SIZE / scaleFactor, maxSize);

		if (ctrlKey) {
			onChangeAspectRatio?.({ key: 'Free', value: 0 });
		}

		api.set({
			[axisKey]: clampedAxis,
			[sizeKey]: clampedSize
		});
	};

	useHotKeys({
		keys: {
			ArrowUp: (event) => handleArrowKey(event, y, height),
			ArrowDown: (event) => handleArrowKey(event, y, height),
			ArrowLeft: (event) => handleArrowKey(event, x, width),
			ArrowRight: (event) => handleArrowKey(event, x, width)
		}
	});

	const [{ x, y, width, height }, api] = useSpring(
		{
			// Convert from actual size to canvas size
			x: initialCrop.x / boundsScaleFactor.x,
			y: initialCrop.y / boundsScaleFactor.y,
			width: initialCrop.width / boundsScaleFactor.x,
			height: initialCrop.height / boundsScaleFactor.y,
			immediate: true,
			onChange: () => {
				// Convert from canvas size to actual size
				onChange?.({
					x: Math.round(x.get() * boundsScaleFactor.x),
					y: Math.round(y.get() * boundsScaleFactor.y),
					width: Math.round(width.get() * boundsScaleFactor.x),
					height: Math.round(height.get() * boundsScaleFactor.y)
				});
			}
		},
		[boundsScaleFactor]
	);

	// super hacky way of doing this, but it works ¯\_(ツ)_/¯
	useEffect(() => {
		if (aspectRatio === 0 || !cropRef.current) {
			return;
		}

		console.log(scale, boundsScaleFactor);

		const target = cropRef.current.querySelector('[data-id=bottom-right]') as SVGCircleElement;
		simulatePointerEvent(target, 'pointerdown');
		simulatePointerEvent(target, 'pointerup');

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [aspectRatio]);

	// Update the bounds scale factor, when the boundsRef size changes
	useEffect(() => {
		const observer = new ResizeObserver(({ 0: { contentRect, target } }) => {
			setBoundsScaleFactor({
				x: (target as HTMLImageElement).naturalWidth / contentRect.width,
				y: (target as HTMLImageElement).naturalHeight / contentRect.height
			});
		});
		observer.observe(boundsRef);

		return () => observer.disconnect();
	}, [boundsRef]);

	function setCrop(crop: Partial<Rectangle>) {
		const rect = Object.fromEntries(
			Object.entries(crop).map(([key, value]) => {
				if (key === 'width') {
					return [key, Math.max(MIN_SIZE, value) / boundsScaleFactor.x];
				}
				if (key === 'height') {
					return [key, Math.max(MIN_SIZE, value) / boundsScaleFactor.y];
				}
				if (key === 'x') {
					return [key, Math.max(0, value) / boundsScaleFactor.x];
				}
				if (key === 'y') {
					return [key, Math.max(0, value) / boundsScaleFactor.y];
				}

				return [key, value];
			})
		);
		api.set(rect);
	}

	function handleDrag({
		event,
		offset,
		memo: lastCrop = {
			x: x.get() * boundsScaleFactor.x,
			y: y.get() * boundsScaleFactor.y,
			width: width.get() * boundsScaleFactor.x,
			height: height.get() * boundsScaleFactor.y
		}
	}: Partial<Omit<FullGestureState<'drag'>, 'event'> & { event: Partial<EventTypes['drag']> }>) {
		const {
			dataset: { id }
		} = event!.target as HTMLDivElement;

		const ox = Math.round((offset![0] / scale) * boundsScaleFactor.x);
		const oy = Math.round((offset![1] / scale) * boundsScaleFactor.y);

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
						y: Math.round(lastCrop.y + lastCrop.height - newHeight),
						width: Math.round(newWidth),
						height: Math.round(newHeight)
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
						y: Math.round(lastCrop.y - heightDiff),
						width: Math.round(newWidth),
						height: Math.round(newHeight)
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
					setCrop({
						width: Math.round(newSize),
						height: Math.round(newSize / aspectRatio)
					});
				} else {
					setCrop({
						width: ox - lastCrop.x,
						height: oy - lastCrop.y
					});
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
						width: Math.round(newSize),
						height: Math.round(newSize / aspectRatio)
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

		return lastCrop;
	}

	const bind = useGesture(
		{
			onDrag: handleDrag
		},
		{
			drag: {
				filterTaps: false,
				bounds: (event) => {
					if (!boundsRef || !cropRef.current) {
						return {};
					}

					const boundsRect = {
						width: boundsRef.clientWidth * scale,
						height: boundsRef.clientHeight * scale
					};
					const cropRect = {
						width: width.get() * scale,
						height: height.get() * scale,
						top: y.get() * scale,
						left: x.get() * scale,
						right: (x.get() + width.get()) * scale,
						bottom: (y.get() + height.get()) * scale
					};

					const {
						dataset: { id }
					} = event?.target as HTMLDivElement;

					const minSizeX = (MIN_SIZE * scale) / boundsScaleFactor.x;
					const minSizeY = (MIN_SIZE * scale) / boundsScaleFactor.y;

					switch (id) {
						case 'top-left': {
							const left = aspectRatio
								? Math.max(0, cropRect.right - cropRect.bottom * aspectRatio)
								: 0;
							const top = aspectRatio ? Math.max(0, cropRect.top - cropRect.left / aspectRatio) : 0;

							return {
								top,
								left,
								right: cropRect.right - minSizeX,
								bottom: cropRect.bottom - minSizeY
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
								left: cropRect.left - minSizeX,
								right,
								bottom: cropRect.bottom - minSizeY
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
								top: cropRect.top + minSizeY,
								left: cropRect.left + minSizeX,
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

							return { top: 0, left, right: cropRect.right - minSizeX, bottom };
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

	return (
		<span>
			{/* Crop Area */}
			<animated.div
				{...bind()}
				id="croppable"
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
	);
}
