import { useEffect } from 'react';

type HotKeyData = {
	ctrlKey: boolean;
	action: () => void;
};
type HotKeysProps = {
	keys: Record<string, HotKeyData>;
};

export function useHotKeys({ keys }: HotKeysProps) {
	useEffect(() => {
		function handleKeydown(event: KeyboardEvent) {
			const hotkey = keys[event.key];

			if (!hotkey) {
				return;
			}

			if (hotkey.ctrlKey && !event.ctrlKey) {
				return;
			}

			event.preventDefault();
			hotkey.action();
		}

		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	}, [keys]);
}
