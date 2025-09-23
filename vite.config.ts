import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: true, // 等同于命令行中的 --host
		hmr: {
			host: 'localhost',
			protocol: 'ws',
		},
		watch: {
			usePolling: true,
		},
		allowedHosts: [
			'vip.xg.frp.one' // <-- 把你的 FRP 公网域名加到这里
		]
	}
});