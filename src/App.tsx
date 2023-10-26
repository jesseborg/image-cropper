import clsx from 'clsx';
import { ImagePlus } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from './components/button';
import { Container } from './components/container';
import { Input } from './components/input';

function App() {
	return (
		<main className="flex h-screen items-center justify-center overflow-hidden bg-neutral-100">
			<Background />
			<ImageUpload />
		</main>
	);
}

function Background() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{/* Noise Filter */}
			{/* <svg
				className="opacity-50 mix-blend-overlay"
				width="100%"
				height="100%"
				viewBox="0 0 1024 1024"
				xmlns="http://www.w3.org/2000/svg"
				preserveAspectRatio="none"
			>
				<defs>
					<filter id="whiteNoise">
						<feTurbulence
							type="fractalNoise"
							baseFrequency="32"
							numOctaves="1"
							stitchTiles="stitch"
						/>
						<feColorMatrix type="saturate" values="0" />
						<feComponentTransfer>
							<feFuncR type="discrete" tableValues="0 1" />
							<feFuncG type="discrete" tableValues="0 1" />
							<feFuncB type="discrete" tableValues="0 1" />
						</feComponentTransfer>
					</filter>
				</defs>

				<rect width="100%" height="100%" filter="url(#whiteNoise)" />
			</svg> */}

			{/* Coloured Circles */}
			<svg
				className="absolute inset-0 left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 opacity-80 blur-[60px]"
				width="747"
				height="533"
				viewBox="0 0 747 533"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<circle cx="95" cy="438" r="95" fill="#E0F2FE" />
				<circle cx="258" cy="107" r="107" fill="#FFF7ED" />
				<circle cx="611" cy="251" r="136" fill="#EFF6FF" />
			</svg>
		</div>
	);
}

function ImageUpload() {
	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		multiple: false,
		noClick: true,
		accept: {
			'image/png': ['.png'],
			'image/jpeg': ['.jpeg', '.jpg']
			// 'image/gif': ['.gif']
		},
		onDrop: (files) => {
			console.log(files);
		}
	});

	return (
		<Container className="flex min-h-[384px] min-w-[568px]">
			{/* DropZone */}
			<div
				className={clsx(
					'flex flex-col gap-4 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-100 p-4',
					{
						'!border-blue-500 !bg-blue-50': isDragActive
					}
				)}
				{...getRootProps()}
			>
				<Button
					intent="blank"
					className={clsx(
						'flex w-[500px] flex-grow select-none flex-col items-center justify-center gap-2 rounded-lg stroke-black !tracking-normal transition-none hover:bg-neutral-200/60',
						{ 'stroke-blue-500 text-blue-500': isDragActive }
					)}
					onClick={open}
				>
					<input {...getInputProps()} />
					<ImagePlus className="h-12 w-12 stroke-inherit" />
					<div className="space-y-1 text-center">
						<p className="text-sm font-medium">
							{!isDragActive ? 'Choose files or drag and drop' : 'Drop image here'}
						</p>
						{!isDragActive && (
							<p className="text-xs font-medium tracking-wide text-neutral-400">
								accepts png and jpg
							</p>
						)}
					</div>
				</Button>
				{!isDragActive && (
					<>
						<hr className="h-[2px] bg-neutral-200" />
						<div className="flex gap-2">
							<Input placeholder="Paste image link..." />
							<Button intent="primary">Search</Button>
						</div>
					</>
				)}
			</div>
		</Container>
	);
}

export default App;
