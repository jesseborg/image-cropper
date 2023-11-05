export function getRelativeBounds(element1: Element, element2: Element) {
	const rect1 = element1.getBoundingClientRect();
	const rect2 = element2.getBoundingClientRect();

	return {
		x: rect2.left,
		y: rect2.top,
		width: rect2.width,
		height: rect2.height,
		top: rect2.top - rect1.top,
		left: rect2.left - rect1.left,
		right: rect2.right - rect1.left,
		bottom: rect2.bottom - rect1.top
	};
}
