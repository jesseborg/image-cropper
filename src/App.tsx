import { useState } from 'react';
import {} from 'react-zoom-pan-pinch';
import { Container } from './components/container';
import { ImageEditor } from './components/image-editor';
import { ImageUpload } from './components/image-upload';

function App() {
	const [blobURL, setBlobURL] = useState('');
	const [stepIndex, setStepIndex] = useState(0);

	return (
		<main>
			<Background src={blobURL} />
			<div className="flex h-screen items-center justify-center p-8 md:p-16 lg:p-32">
				<Container className="max-h-[calc(100vh-32px)] max-w-[calc(100vw-32px)] overflow-hidden">
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
					{stepIndex === 1 && (
						<ImageEditor
							src={blobURL}
							onCancel={() => {
								setBlobURL((url) => {
									URL.revokeObjectURL(url);
									return '';
								});
								setStepIndex(0);
							}}
						/>
					)}
				</Container>
			</div>
		</main>
	);
}

function Background({ src }: { src: string }) {
	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{/* Noise Filter */}
			{!src && (
				<>
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
				</>
			)}

			{!!src && (
				<img
					className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 scale-90 p-8 blur-3xl saturate-200 md:p-16 lg:p-32"
					src={src}
				/>
			)}
		</div>
	);
}

export default App;
