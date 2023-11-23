import React from 'react';

export const RefHolder = React.forwardRef(
	({ children }: { children: JSX.Element }, ref: React.Ref<unknown>) => {
		return React.cloneElement(children, { ref });
	}
);
