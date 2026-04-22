import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		proxy: {
			'/graphql': {
				target: 'http://localhost:8080',
				ws: true,
			},
			'/api': {
				target: 'http://localhost:8080',
			},
			'/avatars': {
				target: 'http://localhost:8080',
			},
		},
	},
});
