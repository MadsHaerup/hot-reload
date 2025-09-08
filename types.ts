// Hot Reload Types

export interface HotReloadOptions {
	/** Port to run the hot reload server on */
	port?: number;
	/** Root directory to watch for file changes */
	rootDir?: string;
	/** Directories to watch for changes (default: ['src', 'public']) */
	watchDirs?: string[];
	/** File extensions to watch (default: ['.ts', '.tsx', '.js', '.jsx', '.css', '.html']) */
	watchExtensions?: string[];
	/** Debounce delay in ms (default: 50) */
	debounceMs?: number;
	/** Custom file change handler */
	onFileChange?: (filePath: string, changeType: 'created' | 'modified' | 'removed') => void;
}
