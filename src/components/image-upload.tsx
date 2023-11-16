import clsx from 'clsx';
import { BanIcon, ImagePlus } from 'lucide-react';
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';
import { useStepper } from '../hooks/use-stepper';
import { useCropActions } from '../stores/editor';
import { Button } from './button';
import { Input } from './input';

const ACCEPTED_FILE_TYPES = ['png', 'jpeg', 'jpg', 'bmp'];

const imageURLSchema = z
	.string()
	.min(1, ' ')
	.url("Please check that your link start with 'http://' or 'https://'");

export function ImageUpload() {
	const { nextStep } = useStepper();

	const { setOriginalImage } = useCropActions();

	const [imageURL, setImageURL] = useState('');

	const validationResult = imageURLSchema.safeParse(imageURL);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const validationErrors = validationResult.error?.issues;

	const handleImageLoad = (url: string) => {
		setOriginalImage(url);
		nextStep();
	};

	const { isDragReject, getRootProps, getInputProps, isDragActive, open } = useDropzone({
		multiple: false,
		noClick: true,
		noKeyboard: true,
		accept: Object.fromEntries(ACCEPTED_FILE_TYPES.map((ext) => [`image/${ext}`, []])),
		onDrop: async (files) => {
			if (!files.length) {
				return;
			}

			const blob = URL.createObjectURL(files[0]);
			handleImageLoad(blob);
		}
	});

	async function handleGetImageByURL(url: string) {
		const response = await fetch(url);

		if (!response.ok) {
			return;
		}

		const contentType = response.headers.get('content-type');

		if (!contentType || !contentType.startsWith('image/')) {
			return;
		}

		// 'image/<type>'
		if (!ACCEPTED_FILE_TYPES.includes(contentType.split('/')[1])) {
			return;
		}

		const blob = URL.createObjectURL(await response.blob());
		handleImageLoad(blob);
	}

	return (
		<div
			className={clsx(
				'flex w-full flex-col gap-4 overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-100 p-4',
				{
					'!border-blue-500 !bg-blue-50': isDragActive,
					'!border-red-500 !bg-red-50': isDragReject
				}
			)}
			{...getRootProps()}
		>
			<Button
				variant="blank"
				className={clsx(
					'flex h-[250px] w-full max-w-[500px] flex-grow select-none flex-col items-center justify-center gap-2 rounded-lg stroke-black px-40 !tracking-normal transition-none hover:bg-neutral-200/60',
					{ 'stroke-blue-500 text-blue-500': isDragActive },
					{ 'stroke-red-500 text-red-500': isDragReject }
				)}
				onClick={open}
			>
				<input {...getInputProps()} />
				{!isDragReject && <ImagePlus className="h-12 w-12 stroke-inherit" />}
				{isDragReject && <BanIcon className="h-12 w-12 stroke-inherit" />}
				<div className="space-y-1 whitespace-nowrap text-center">
					<p className="text-sm font-medium">
						{isDragActive
							? isDragReject
								? 'Wrong file type!'
								: 'Drop image here'
							: 'Choose files or drag and drop'}
					</p>
					{!isDragActive && (
						<p className="text-xs font-medium tracking-wide text-neutral-400">
							accepts {ACCEPTED_FILE_TYPES.join(', ')}
						</p>
					)}
				</div>
			</Button>
			{!isDragActive && (
				<>
					<hr className="h-[2px] bg-neutral-200" />
					<div className="flex gap-2">
						<Input
							error={validationErrors?.[0].message}
							placeholder="Paste image link..."
							value={imageURL}
							onChange={(event) => setImageURL(event.currentTarget.value)}
						/>
						<Button
							disabled={!!validationErrors?.length}
							variant="primary"
							onClick={() => handleGetImageByURL(imageURL)}
						>
							Search
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
