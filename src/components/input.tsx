import { InputHTMLAttributes } from 'react';

type InputProps = object & InputHTMLAttributes<HTMLInputElement>;

export function Input({ ...props }: InputProps) {
	return (
		<input
			type="text"
			className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-xs text-neutral-800 outline-none placeholder:text-neutral-400/80"
			{...props}
		/>
	);
}
