import { ButtonHTMLAttributes, forwardRef, PropsWithChildren } from 'react';
import { twMerge } from 'tailwind-merge';

import { cva, type VariantProps } from 'class-variance-authority';
import { Loader } from './loader';

const button = cva(
	[
		'relative rounded-lg text-xs tracking-[0.0256em] transition-colors duration-200 select-none',
		'focus-visible:ring-2 ring-offset-2 ring-blue-500 outline-none'
	],
	{
		variants: {
			variant: {
				primary: [
					'font-light',
					'[&:not(:disabled)]:hover:bg-neutral-800 bg-neutral-950 text-white'
				],
				secondary: [
					'text-black bg-white border font-medium border-neutral-200',
					'hover:bg-neutral-50'
				],
				blank: ['bg-transparent']
			},
			disabled: {
				true: 'cursor-not-allowed bg-neutral-200 text-neutral-400'
			},
			padding: {
				normal: 'px-4 py-2',
				none: 'p-0'
			},
			loading: {
				true: ''
			}
		},
		defaultVariants: {
			variant: 'primary',
			padding: 'normal',
			disabled: false,
			loading: false
		}
	}
);

type ButtonProps = VariantProps<typeof button>;

export const Button = forwardRef<
	HTMLButtonElement,
	PropsWithChildren<ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>>
>(({ variant, disabled, padding, loading, className, children, ...props }, ref) => {
	return (
		<button
			ref={ref}
			type="button"
			disabled={disabled}
			className={twMerge(button({ variant, disabled, padding, loading }), className)}
			{...props}
		>
			{loading && (
				<span className="absolute left-0 top-0 flex h-full w-full items-center justify-center">
					<Loader className="h-5 w-5 !border-4 border-neutral-400/50" />
				</span>
			)}
			{children}
		</button>
	);
});
