import { PropsWithChildren } from "react";

type ContainerProps = object;

export function Container({ children }: PropsWithChildren<ContainerProps>) {
	return <div className="bg-white rounded-3xl shadow-md p-4">{children}</div>;
}
