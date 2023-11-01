import clsx from 'clsx';
import { HTMLAttributes, PropsWithChildren } from 'react';

type ContainerProps = object;

export function Container({
	children,
	className,
	...props
}: PropsWithChildren<ContainerProps & HTMLAttributes<HTMLDivElement>>) {
	return (
		<div className={clsx('z-10 flex rounded-3xl bg-white p-4 shadow-md', className)} {...props}>
			{children}
		</div>
	);
}
