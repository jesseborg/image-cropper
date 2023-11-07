/* eslint-disable react-hooks/exhaustive-deps */
import { animated, useSpring } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import clsx from 'clsx';
import {
	CSSProperties,
	ComponentProps,
	SyntheticEvent,
	useCallback,
	useEffect,
	useRef,
	useState
} from 'react';
import {
	TransformComponent,
	TransformWrapper,
	useControls,
	useTransformEffect
} from 'react-zoom-pan-pinch';
import { clamp } from '../utils/clamp';
import { getRelativeBounds } from '../utils/get-relative-bounds';
import { Button } from './button';

type ImageEditorProps = {
	src: string;
	onCancel?: () => void;
	onConfirm?: () => void;
};

export function ImageEditor({ src, onCancel, onConfirm }: ImageEditorProps) {
	const [size, setSize] = useState({ width: 0, height: 0 });

	const handleImageLoad = useCallback(
		(event: SyntheticEvent<HTMLImageElement, Event>) => {
			const target = event.target as HTMLImageElement;
			setSize({ width: target.naturalWidth, height: target.naturalHeight });
		},
		[src]
	);

	return (
		<div className="flex flex-col gap-2">
			<div className="relative flex h-full flex-col gap-2 self-center overflow-hidden rounded-lg p-2">
				{/* Checkerboard */}
				<CheckerBoard className="pointer-events-none absolute inset-0 z-0 h-full" />

				{/* Pan & Zoom Canvas */}
				<TransformWrapper
					centerZoomedOut
					limitToBounds={false}
					doubleClick={{ disabled: true }}
					panning={{
						velocityDisabled: true,
						allowRightClickPan: false,
						excluded: ['panning-none', 'line', 'svg', 'circle', 'g']
					}}
				>
					<TransformComponent
						wrapperClass={clsx('relative rounded-lg border border-neutral-200 shadow-lg', {
							'min-h-[350px] min-w-[350px]': size.width < 350 || size.height < 350
						})}
						contentClass="flex z-0 h-full flex-1 w-full"
					>
						<CropTool />
						<div className="flex max-h-full w-full items-center justify-center">
							<img className="max-h-full" src={src} onLoad={handleImageLoad} />
						</div>
					</TransformComponent>
				</TransformWrapper>

				{/* Metadata & Controls */}
				<Controls width={size.width} height={size.height} />
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

function CropTool() {
	const { instance } = useControls();

	const [scale, setScale] = useState(1);
	useTransformEffect(({ state }) => setScale(state.scale));

	const cropRef = useRef<HTMLDivElement>(null);

	const [{ x, y, width, height }, api] = useSpring(() => ({ x: 0, y: 0, width: 128, height: 128 }));

	const [lastRect, setLastRect] = useState({
		x: x.get(),
		y: y.get(),
		width: width.get(),
		height: height.get()
	});

	const bind = useGesture(
		{
			onDrag: ({ event, offset: [ox, oy], lastOffset: [lastX, lastY] }) => {
				const target = event.target as HTMLDivElement;
				const { id } = target.dataset;

				switch (id) {
					case 'top-left': {
						api.set({
							x: ox / scale,
							y: oy / scale,
							width: lastRect.width + (lastX - ox) / scale,
							height: lastRect.height + (lastY - oy) / scale
						});
						return;
					}
					case 'top-right': {
						api.set({
							y: oy / scale,
							width: ox / scale,
							height: lastRect.height + (lastY - oy) / scale
						});
						return;
					}
					case 'bottom-right': {
						api.set({ width: ox / scale, height: oy / scale });
						return;
					}
					case 'bottom-left': {
						api.set({
							x: ox / scale,
							width: lastRect.width + (lastX - ox) / scale,
							height: oy / scale
						});
						return;
					}
					default: {
						api.set({ x: ox / scale, y: oy / scale });
					}
				}
			},
			onDragEnd: () => {
				setLastRect({ x: x.get(), y: y.get(), width: width.get(), height: height.get() });
			}
		},
		{
			drag: {
				// bounds: () => {
				// 	const containerElement = instance.contentComponent;
				// 	const imageElement = containerElement?.querySelector('img');
				// 	const containerRect = containerElement?.getBoundingClientRect();

				// 	const cropRect = cropRef.current?.getBoundingClientRect();

				// 	if (!imageElement || !containerElement || !containerRect || !cropRect) {
				// 		return {};
				// 	}

				// 	const relativeImageRect = getRelativeBounds(containerElement, imageElement);

				// 	return {
				// 		top: Math.max(0, relativeImageRect.top),
				// 		left: Math.max(0, relativeImageRect.left),
				// 		right: Math.min(containerRect.width, relativeImageRect.right) - cropRect.width,
				// 		bottom: Math.min(containerRect.height, relativeImageRect.bottom) - cropRect.height
				// 	};
				// },
				from: (event) => {
					const target = event.target as HTMLDivElement;
					const { id } = target.dataset;

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

	// https://www.youtube.com/watch?v=vDxZLN6FVqY&list=WL&index=36&t=1647s

	useEffect(() => {
		function keepCropToolInBounds() {
			const containerElement = instance.contentComponent;
			const imageElement = containerElement?.querySelector('img');

			const cropRect = cropRef.current?.getBoundingClientRect();

			if (!imageElement || !containerElement || !cropRect) {
				return;
			}

			const relativeImageRect = getRelativeBounds(containerElement, imageElement);

			const maxX = relativeImageRect.right - cropRect.width;
			const maxY = relativeImageRect.bottom - cropRect.height;

			const posX = clamp(x.get(), relativeImageRect.left, maxX);
			const posY = clamp(y.get(), relativeImageRect.top, maxY);

			api.start({ x: posX, y: posY, immediate: true });
		}

		window.addEventListener('resize', keepCropToolInBounds);
		return () => window.removeEventListener('resize', keepCropToolInBounds);
	}, []);

	// TODO: CropTool shadow needs to be clipped to the image
	return (
		<animated.div
			{...bind()}
			ref={cropRef}
			style={{
				x: x.to(Math.round),
				y: y.to(Math.round),
				width: width.to(Math.round),
				height: height.to(Math.round)
			}}
			className="fixed z-10 box-content cursor-move touch-none text-xs text-white shadow-[0px_0px_0px_20000px_rgba(0,_0,_0,_0.50)]"
		>
			<svg className="absolute h-full w-full overflow-visible">
				<g className="stroke-neutral-300" strokeWidth={2 / scale}>
					<line x1="0" y1="0" x2="100%" y2="0" />
					<line x1="100%" y1="0" x2="100%" y2="100%" />
					<line x1="100%" y1="100%" x2="0" y2="100%" />
					<line x1="0" y1="100%" x2="0" y2="0" />
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
	width: number;
	height: number;
};

function Controls({ width, height }: ControlsProps) {
	return (
		<div className="relative rounded-lg border border-neutral-400 bg-white p-2">
			<div className="flex gap-2 text-xs">
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">W:</b>
					{width}
				</p>
				<p className="font-medium text-neutral-600">
					<b className="pr-1 text-neutral-950">H:</b>
					{height}
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
