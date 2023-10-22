import { InputHTMLAttributes } from 'react';

type InputProps = object & InputHTMLAttributes<HTMLInputElement>;

export function Input({ ...props }: InputProps) {
	return (
		<input
			type="text"
			className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-xs text-neutral-800 outline-none ring-blue-500 ring-offset-2 placeholder:text-neutral-400/80 focus-visible:ring-2"
			{...props}
		/>
	);
}
