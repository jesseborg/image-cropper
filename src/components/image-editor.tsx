import clsx from 'clsx';
import { ComponentProps, SyntheticEvent, useCallback, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
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
					panning={{ velocityDisabled: true, allowRightClickPan: false }}
				>
					<TransformComponent
						wrapperClass={clsx('relative rounded-lg border border-neutral-200 shadow-lg', {
							'min-h-[350px] min-w-[350px]': size.width < 350 || size.height < 350
						})}
						contentClass="flex h-full flex-1 overflow-hidden w-full"
					>
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
