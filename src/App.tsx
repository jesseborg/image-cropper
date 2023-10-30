import clsx from 'clsx';
import { useState } from 'react';
import {} from 'react-zoom-pan-pinch';
import { Container } from './components/container';
import { ImageEditor } from './components/image-editor';
import { ImageUpload } from './components/image-upload';

function App() {
	const [blobURL, setBlobURL] = useState('');
	const [stepIndex, setStepIndex] = useState(0);

	return (
		<main className="flex h-screen items-center justify-center overflow-hidden bg-neutral-100 p-4">
			{stepIndex === 0 && <Background />}
			<Container className={clsx('m-32', { 'flex max-h-full': stepIndex === 1 })}>
				{stepIndex === 0 && (
					<ImageUpload
						onImageLoad={(blobURL) => {
							// Revoke old Blob URL before updating
							setBlobURL((url) => {
								URL.revokeObjectURL(url);
								return blobURL;
							});
							setStepIndex(1);
						}}
					/>
				)}
				{stepIndex === 1 && <ImageEditor src={blobURL} onCancel={() => setStepIndex(0)} />}
			</Container>
		</main>
	);
}

function Background() {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{/* Noise Filter */}
			<svg
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
			</svg>

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

export default App;
