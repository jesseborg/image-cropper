import { useEffect } from 'react';

type Action = (event: KeyboardEvent) => void;
type HotKeyData = {
	ctrlKey?: boolean;
	action: Action;
};
type HotKeysProps = {
	keys: Record<string, HotKeyData | Action>;
};

export function useHotKeys({ keys }: HotKeysProps) {
	useEffect(() => {
		function handleKeydown(event: KeyboardEvent) {
			const hotkey = keys[event.key];

			if (!hotkey) {
				return;
			}

			if (event.key === 'Enter' && document.activeElement?.tagName === 'BUTTON') {
				return;
			}

			if (typeof hotkey === 'function') {
				event.preventDefault();
				hotkey(event);
				return;
			}

			if (hotkey.ctrlKey && !event.ctrlKey) {
				return;
			}

			event.preventDefault();
			hotkey.action(event);
		}

		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	}, [keys]);
}
