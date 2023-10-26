import { ButtonHTMLAttributes, forwardRef, PropsWithChildren } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';

const button = cva(
	[
		'rounded-lg px-4 py-2 text-xs font-light tracking-[0.0256em] transition-colors duration-200 select-none',
		'focus-visible:ring-2 ring-offset-2 ring-blue-500 outline-none'
	],
	{
		variants: {
			intent: {
				primary: ['bg-neutral-950 text-white', 'hover:bg-neutral-800'],
				secondary: ['text-black bg-white border border-neutral-200', 'hover:bg-neutral-50'],
				blank: ['bg-transparent']
			}
		},
		defaultVariants: {
			intent: 'primary'
		}
	}
);

type ButtonProps = VariantProps<typeof button>;

export const Button = forwardRef<
	HTMLButtonElement,
	PropsWithChildren<ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>>
>(({ intent, className, children, ...props }, ref) => {
	return (
		<button ref={ref} type="button" className={clsx(className, button({ intent }))} {...props}>
			{children}
		</button>
	);
});
