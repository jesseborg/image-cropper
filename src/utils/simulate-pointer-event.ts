// Modified version of this:
// https://stackoverflow.com/a/74852313
type PickStartsWith<T extends object, S extends string> = keyof {
	[K in keyof T as K extends `${S}${string}` ? K : never]: T[K];
};

type PointerEvents = PickStartsWith<GlobalEventHandlersEventMap, 'pointer'>;

export const simulatePointerEvent = (
	target: HTMLElement | SVGElement,
	event: PointerEvents,
	args?: PointerEventInit
) => {
	const { x, y, width, height } = target.getBoundingClientRect();
	target.dispatchEvent(
		new PointerEvent(event, {
			view: window,
			bubbles: true,
			cancelable: true,
			button: 0,
			buttons: event === 'pointerdown' ? 1 : 0,
			clientX: x + width / 2,
			clientY: y + height / 2,
			pointerId: 1,
			...args
		})
	);
};
