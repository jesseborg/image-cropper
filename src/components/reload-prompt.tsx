import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './common/button';

export function ReloadPrompt() {
	const {
		needRefresh: [needRefresh],
		updateServiceWorker
	} = useRegisterSW({
		onRegistered(r) {
			console.log('SW Registered: ' + r);
		},
		onRegisterError(error) {
			console.log('SW registration error', error);
		}
	});

	return (
		<>
			{needRefresh && (
				<div className="fixed bottom-0 right-0 z-10 m-4 rounded-md border border-neutral-200 bg-white p-3 text-center">
					<p className="mb-2 text-sm">Update available!</p>
					<div className="flex gap-2">
						{needRefresh && (
							<Button className="w-full" onClick={() => updateServiceWorker(true)}>
								Reload
							</Button>
						)}
					</div>
				</div>
			)}
		</>
	);
}
