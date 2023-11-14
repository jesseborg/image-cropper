import { ButtonHTMLAttributes, forwardRef, PropsWithChildren } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const button = cva(
	[
		'rounded-lg px-4 py-2 text-xs tracking-[0.0256em] transition-colors duration-200 select-none',
		'focus-visible:ring-2 ring-offset-2 ring-blue-500 outline-none'
	],
	{
		variants: {
			variant: {
				primary: ['bg-neutral-950 text-white font-light', 'hover:bg-neutral-800'],
				secondary: [
					'text-black bg-white border font-medium border-neutral-200',
					'hover:bg-neutral-50'
				],
				blank: ['bg-transparent']
			},
			disabled: {
				true: 'cursor-not-allowed !bg-neutral-200 !text-neutral-400'
			}
		},
		defaultVariants: {
			variant: 'primary'
		}
	}
);

type ButtonProps = VariantProps<typeof button>;

export const Button = forwardRef<
	HTMLButtonElement,
	PropsWithChildren<ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>>
>(({ variant, disabled, className, children, ...props }, ref) => {
	return (
		<button
			ref={ref}
			type="button"
			disabled={disabled}
			className={clsx(className, button({ variant, disabled }))}
			{...props}
		>
			{children}
		</button>
	);
});
