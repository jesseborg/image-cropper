import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = object;

export function Button({
	children,
	...props
}: PropsWithChildren<ButtonProps & ButtonHTMLAttributes<HTMLButtonElement>>) {
	return (
		<button
			type="button"
			{...props}
			className="rounded-lg bg-black px-4 py-2 text-xs font-normal tracking-[0.0125em] text-white"
		>
			{children}
		</button>
	);
}
