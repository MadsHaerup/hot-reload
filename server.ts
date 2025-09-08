// Hot Reload Server - WebSocket server for file change notifications
import type { HotReloadOptions } from './types.ts';

// Simple path utilities to avoid external dependencies
function join(...paths: string[]): string {
	return paths.join('/').replace(/\/+/g, '/');
}

export class HotReloadServer {
	private clients = new Set<WebSocket>();
	private watchers = new Map<string, AbortController>();
	private debounceTimer?: number;
	private port: number;
	private watchDirs: string[];
	private watchExtensions: string[];
	private debounceMs: number;
	private server?: Deno.HttpServer;
	private rootDir: string;

	constructor(options: HotReloadOptions = {}) {
		this.port = options.port ?? 8081;
		this.rootDir = options.rootDir ?? Deno.cwd();
		this.watchDirs = options.watchDirs ?? ['src'];
		this.watchExtensions = options.watchExtensions ?? ['.ts', '.tsx', '.js', '.jsx'];
		this.debounceMs = options.debounceMs ?? 100;
	}

	async start(): Promise<void> {
		try {
			// Start WebSocket server
			this.startWebSocketServer();

			// Start file watchers
			await this.startFileWatchers();
		} catch (error) {
			console.error('Failed to start hot reload server:', error);
		}
	}

	private startWebSocketServer(): void {
		try {
			this.server = Deno.serve(
				{
					port: this.port,
				},
				request => {
					if (request.headers.get('upgrade') === 'websocket') {
						try {
							const { socket, response } = Deno.upgradeWebSocket(request);

							socket.onopen = () => {
								this.clients.add(socket);
								console.log(`🔌 Hot reload client connected (${this.clients.size} total)`);
							};

							socket.onclose = () => {
								this.clients.delete(socket);
								console.log(`🔌 Hot reload client disconnected (${this.clients.size} total)`);
							};

							socket.onerror = () => {
								this.clients.delete(socket);
							};

							return response;
						} catch (error) {
							console.error('WebSocket upgrade failed:', error);
							return new Response('WebSocket upgrade failed', { status: 500 });
						}
					}

					return new Response('WebSocket connection required', { status: 400 });
				}
			);
		} catch (error) {
			console.error('Failed to start WebSocket server:', error);
		}
	}

	private async startFileWatchers(): Promise<void> {
		for (const dir of this.watchDirs) {
			const watchPath = join(this.rootDir, dir);

			try {
				await Deno.stat(watchPath);
				this.watchDirectory(watchPath);
			} catch (_error) {
				console.warn(`⚠️  Watch directory not found: ${dir}`);
			}
		}
	}

	private watchDirectory(dirPath: string): void {
		const controller = new AbortController();
		this.watchers.set(dirPath, controller);

		try {
			const watcher = Deno.watchFs(dirPath, { recursive: true });

			(async () => {
				try {
					for await (const event of watcher) {
						if (controller.signal.aborted) break;

						if (event.kind === 'modify' || event.kind === 'create') {
							for (const path of event.paths) {
								// Only process files within watched directories
								const isInWatchedDir = this.watchDirs.some(dir => path.includes(join(this.rootDir, dir)));

								if (!isInWatchedDir) {
									continue;
								}

								// Skip CMS log files but allow JSON database edits
								if (path.includes('live-edit-changes.log')) {
									continue;
								}

								// Check if this file should trigger a reload
								if (this.shouldReload(path)) {
									this.debouncedReload(path);
								}
							}
						}
					}
				} catch (error: unknown) {
					if (error instanceof Error && error.name !== 'AbortError') {
						console.error(`Error watching ${dirPath}:`, error);
					}
				}
			})();
		} catch (error: unknown) {
			console.error(`Failed to start watching ${dirPath}:`, error);
		}
	}

	private shouldReload(filePath: string): boolean {
		// Skip directories
		if (filePath.endsWith('/') || filePath.endsWith('\\')) {
			return false;
		}

		// Skip CMS folder
		if (filePath.includes('/cms/') || filePath.includes('\\cms\\')) {
			return false;
		}

		// Skip hidden files
		const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
		if (fileName.startsWith('.')) {
			return false;
		}

		// Skip common build/cache directories
		if (
			filePath.includes('/node_modules/') ||
			filePath.includes('/.git/') ||
			filePath.includes('/dist/') ||
			filePath.includes('/build/') ||
			filePath.includes('/.cache/')
		) {
			return false;
		}

		// Only reload files with watched extensions
		const ext = filePath.substring(filePath.lastIndexOf('.'));
		return this.watchExtensions.includes(ext);
	}

	private debouncedReload(filePath: string): void {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		this.debounceTimer = setTimeout(() => {
			this.notifyClients(filePath);
		}, this.debounceMs);
	}

	private notifyClients(filePath: string): void {
		const relativePath = filePath.replace(this.rootDir, '').replace(/^[\/\\]/, '');
		const message = JSON.stringify({
			type: 'reload',
			path: relativePath,
			timestamp: Date.now(),
		});

		console.log(`🔄 Notifying ${this.clients.size} clients to reload: ${relativePath}`);

		for (const client of this.clients) {
			try {
				if (client.readyState === WebSocket.OPEN) {
					client.send(message);
				} else {
					this.clients.delete(client);
				}
			} catch (_error) {
				this.clients.delete(client);
			}
		}
	}

	stop(): void {
		// Stop the WebSocket server
		if (this.server) {
			this.server.shutdown();
		}

		// Stop all watchers
		for (const controller of this.watchers.values()) {
			controller.abort();
		}
		this.watchers.clear();

		// Close all WebSocket connections
		for (const client of this.clients) {
			client.close();
		}
		this.clients.clear();

		console.log('🔥 Hot reload server stopped');
	}
}
