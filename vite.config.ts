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
			'*'
		],
		fs: {
			allow: ['..'] // 允许访问上级目录，包括项目根目录的图标文件
		}
	}
});
