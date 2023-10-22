import { ImagePlus } from 'lucide-react';
import { Button } from './components/button';
import { Container } from './components/container';
import { Input } from './components/input';

function App() {
	return (
		<main className="flex h-screen items-center justify-center">
			<ImageUpload />
		</main>
	);
}

function ImageUpload() {
	return (
		<Container>
			{/* DropZone */}
			<div className="flex flex-col gap-4 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-100 p-4">
				<div className="flex h-[250px] w-[500px] flex-col items-center justify-center gap-2">
					<ImagePlus className="h-12 w-12 stroke-black" />
					<div className="space-y-1 text-center">
						<p className="text-sm font-medium">Choose files or drag and drop</p>
						<p className="text-xs font-medium tracking-wide text-neutral-400">
							accepts png, jpg, gif
						</p>
					</div>
				</div>
				<hr className="h-[2px] bg-neutral-200" />
				<div className="flex gap-2">
					<Input placeholder="Paste image link..." />
					<Button>Search</Button>
				</div>
			</div>
		</Container>
	);
}

export default App;
