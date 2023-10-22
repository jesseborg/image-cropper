import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

const button = cva(
	[
		'rounded-lg px-4 py-2 text-xs font-normal tracking-[0.0125em] transition-colors',
		'focus-visible:ring-2 ring-offset-2 ring-blue-500 outline-none'
	],
	{
		variants: {
			intent: {
				primary: ['bg-black text-white', 'hover:bg-neutral-800'],
				secondary: ['text-black bg-white border border-neutral-200', 'hover:bg-neutral-50']
			}
		},
		defaultVariants: {
			intent: 'primary'
		}
	}
);

type ButtonProps = object & VariantProps<typeof button>;

export function Button({
	intent,
	children,
	...props
}: PropsWithChildren<ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>>) {
	return (
		<button type="button" className={button({ intent })} {...props}>
			{children}
		</button>
	);
}
