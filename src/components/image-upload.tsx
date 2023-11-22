import { animated, useSpring } from '@react-spring/web';
import clsx from 'clsx';
import { BanIcon, ImagePlus } from 'lucide-react';
import React, { ChangeEvent, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { z } from 'zod';
import { useStepper } from '../hooks/use-stepper';
import { useCropActions } from '../stores/editor';
import { sleep } from '../utils/sleep';
import { Button } from './button';
import { Input } from './input';
import { Loader } from './loader';

const ACCEPTED_FILE_TYPES = ['png', 'jpeg', 'jpg', 'bmp'];

const imageURLSchema = z
	.string()
	.min(1, ' ')
	.trim()
	.regex(/^(https?:\/{2})\S+$/g, "Please check that your link starts with 'http://' or 'https://'")
	.regex(/^\S+$/g, "Please check that your link doesn't contain extra characters");

type ImageUploadState = {
	icon: JSX.Element;
	title: string;
	body?: string | null;
};

export function ImageUpload() {
	const { nextStep } = useStepper();

	const { setOriginalImage } = useCropActions();

	const [imageURL, setImageURL] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<{ message: string }[]>([]);

	const [{ rotate }, api] = useSpring(
		{
			from: { rotate: 0 },
			to: [{ rotate: -1 }, { rotate: 1 }, { rotate: 0 }],
			config: { duration: 25 },
			pause: true,
			loop: true
		},
		[]
	);

	const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
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

	const validationResult = imageURLSchema.safeParse(imageURL);
	const validationErrors = !validationResult.success ? validationResult.error.issues : error;

	const state = useMemo((): ImageUploadState => {
		if (isLoading) {
			return { icon: <Loader className="border-green-500" />, title: 'Loading...' };
		}

		if (isDragReject) {
			return {
				icon: <BanIcon />,
				title: 'Invalid file type',
				body: 'Some valid images will show rejected, but still work'
			};
		}

		if (!isDragReject && isDragActive) {
			return {
				icon: <ImagePlus />,
				title: 'Drop image here'
			};
		}

		return {
			icon: <ImagePlus />,
			title: 'Choose files or drag and drop!',
			body: `accepts ${ACCEPTED_FILE_TYPES.join(', ')}`
		};
	}, [isLoading, isDragReject, isDragActive]);

	const handleImageLoad = async (url: string) => {
		setIsLoading(true);

		const image = new Image();
		image.src = url;
		await image.decode();

		setOriginalImage(image);
		nextStep();
	};

	async function handleBadResponse() {
		setError([{ message: 'Invalid image link, please try again!' }]);
		setIsLoading(false);

		api.resume();
		await sleep(250);
		api.set({ rotate: 0 });
		api.pause();
	}

	async function handleGetImageByURL(url: string) {
		setError([]);
		setIsLoading(true);

		try {
			const response = await fetch(url);

			if (!response.ok) {
				handleBadResponse();
				return;
			}

			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.startsWith('image/')) {
				handleBadResponse();
				return;
			}

			// 'image/<type>'
			if (!ACCEPTED_FILE_TYPES.includes(contentType.split('/')[1])) {
				return;
			}

			const blob = URL.createObjectURL(await response.blob());
			handleImageLoad(blob);
		} catch (error) {
			handleBadResponse();
		}
	}

	function handleImageURLChange(event: ChangeEvent<HTMLInputElement>) {
		setError([]);
		setImageURL(event.currentTarget.value);
	}

	return (
		<div
			className={clsx(
				'flex h-[350px] w-[540px] flex-col gap-4 overflow-hidden rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-100 stroke-black p-4',
				{
					'!border-blue-500 !bg-blue-50': isDragActive,
					'!border-red-500 !bg-red-50': isDragReject,
					'!border-green-500 !bg-green-50': isLoading
				}
			)}
			{...getRootProps()}
		>
			<Button
				disabled={isLoading}
				variant="blank"
				className={clsx(
					'flex h-[250px] w-full max-w-[500px] flex-grow select-none flex-col items-center justify-center gap-2 rounded-lg px-40 !tracking-normal transition-none hover:bg-neutral-200/60',
					{
						'stroke-blue-500 text-blue-500': isDragActive,
						'stroke-red-500 !text-red-500': isDragReject,
						'!bg-green-50 !text-green-500': isLoading
					}
				)}
				onClick={open}
			>
				<input {...getInputProps()} />
				{React.cloneElement(state.icon, {
					className: clsx('h-12 w-12 stroke-inherit', state.icon.props.className)
				})}
				<div className="space-y-1 whitespace-nowrap text-center">
					<p className="text-sm font-medium">{state.title}</p>
					{Boolean(state.body) && (
						<p
							className={clsx('text-xs font-medium tracking-wide text-neutral-400', {
								'text-blue-400': isDragActive,
								'text-red-400': isDragReject,
								'text-green-400': isLoading
							})}
						>
							{state.body}
						</p>
					)}
				</div>
			</Button>
			{!isDragActive && (
				<>
					<hr className="h-[2px] bg-neutral-200" />
					<div className="flex gap-2">
						<AnimatedInput
							style={{ transform: rotate.to((r) => `rotate3d(0, 0, 1, ${r}deg)`) }}
							error={validationErrors[0]?.message}
							placeholder="Paste image link..."
							value={imageURL}
							onChange={handleImageURLChange}
						/>
						<Button
							loading={isLoading}
							disabled={Boolean(validationErrors?.length) || isLoading}
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

const AnimatedInput = animated(Input);
