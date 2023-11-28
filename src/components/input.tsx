import { cva } from 'class-variance-authority';
import clsx from 'clsx';
import { InputHTMLAttributes } from 'react';

const input = cva(
	[
		'rounded-lg flex-grow border border-neutral-300 px-3 py-1 text-xs font-medium text-black outline-none placeholder:text-neutral-400/80',
		'focus-visible:ring-2 ring-offset-2 ring-blue-500'
	],
	{
		variants: {
			error: {
				true: 'border-red-500 border-2'
			}
		}
	}
);

type InputProps = {
	error?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ error, className, ...props }: InputProps) {
	const hasError = !!(error && error?.trim().length > 0);

	return (
		<span className="relative flex flex-grow">
			<input type="text" className={clsx(className, input({ error: hasError }))} {...props} />
			{hasError && (
				<p className="absolute top-full pl-1 text-[11px] font-medium text-red-500">{error}</p>
			)}
		</span>
	);
}
