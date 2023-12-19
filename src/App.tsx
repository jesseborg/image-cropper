import {} from 'react-zoom-pan-pinch';
import { Container } from './components/container';
import { ImageDownload } from './components/image/image-download';
import { ImageEditor } from './components/image/image-editor';
import { ImageUpload } from './components/image/image-upload';
import { Stepper } from './components/stepper';
import { useCroppedImage, useOriginalImage } from './stores/editor';

function App() {
	return (
		<main>
			<Background />
			<div className="flex h-viewport items-center justify-center p-8">
				<Container className="max-h-[calc(100vh-32px*2)] max-w-[calc(100vw-32px)] overflow-hidden">
					<Stepper>
						<ImageUpload />
						<ImageEditor />
						<ImageDownload />
					</Stepper>
				</Container>
			</div>
		</main>
	);
}

function Background() {
	const originalImage = useOriginalImage();
	const croppedImage = useCroppedImage();
	const backgroundImage = croppedImage?.src || originalImage?.src;

	return (
		<div className="pointer-events-none absolute inset-0 overflow-hidden">
			{/* Noise Filter */}
			{!backgroundImage && (
				<>
					<svg
						className="opacity-80 mix-blend-overlay"
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
									baseFrequency="1"
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
						className="absolute inset-0 left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 opacity-80 blur-[60px]"
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

			{backgroundImage && (
				<img
					className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 scale-90 p-8 blur-3xl saturate-200"
					src={backgroundImage}
				/>
			)}
		</div>
	);
}

export default App;
