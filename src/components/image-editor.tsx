import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { Button } from './button';

type ImageEditorProps = {
	src: string;
	onCancel?: () => void;
	onConfirm?: () => void;
};

export function ImageEditor({ src, onCancel, onConfirm }: ImageEditorProps) {
	return (
		<div className="flex flex-col gap-4 overflow-hidden">
			<div className="relative flex min-h-[250px] min-w-[250px] flex-1 overflow-hidden rounded-2xl bg-neutral-800 p-2">
				{/* Checkerboard */}
				<svg className="absolute inset-0 z-0" width="100%" height="100%">
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

				<div className="z-10 flex h-full w-full flex-col gap-2">
					{/* Pan & Zoom Canvas */}
					<TransformWrapper disablePadding doubleClick={{ disabled: true }}>
						<TransformComponent
							wrapperClass="h-full w-full rounded-lg shadow-lg border border-neutral-200"
							contentClass="h-full"
						>
							<img className="h-full object-contain [image-rendering:pixelated]" src={src} />
						</TransformComponent>
					</TransformWrapper>

					{/* Image Controls */}
					<div className="rounded-lg border border-neutral-400 bg-white p-2">
						<div className="flex gap-2 text-xs">
							<p className="font-medium text-neutral-600">
								<b className="pr-1 text-neutral-950">W:</b>250
							</p>
							<p className="font-medium text-neutral-600">
								<b className="pr-1 text-neutral-950">H:</b>250
							</p>
						</div>
					</div>
				</div>
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
