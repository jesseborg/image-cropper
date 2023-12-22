import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			base: '/',
			// registerType: 'autoUpdate',
			// Cache all static assets
			includeAssets: ['**/*'],
			manifest: {
				name: 'Image Cropper',
				short_name: 'ImageCropper',
				description: 'A simple image cropping tool',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'logo-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: 'logo-512x512.png',
						sizes: '512x512',
						type: 'image/png'
					}
				]
			},
			devOptions: {
				enabled: process.env.NODE_ENV === 'development',
				type: 'module',
				navigateFallback: 'index.html'
			}
		})
	]
});
