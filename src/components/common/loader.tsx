import clsx from 'clsx';
import { HTMLProps } from 'react';

export function Loader({ className }: HTMLProps<'svg'>) {
	return (
		<svg
			// color={color}
			className={clsx(
				'inline-block h-12 w-12 animate-spin rounded-full border-8 border-solid border-r-transparent',
				className
			)}
			role="status"
		/>
	);
}
