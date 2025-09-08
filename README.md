# @avalon/hot-reload

A drop-in hot reload system for Deno projects. Automatically refresh pages when files change with optimized WebSocket-based file watching.

## ✨ Features

- **File Watching** - Monitor multiple directories for file changes
- **WebSocket Communication** - Real-time notifications to connected clients
- **Smart Reloading** - CSS files reload instantly, other files use optimized content updates
- **Debounced Updates** - Prevents excessive reloads during rapid file changes
- **Fallback Polling** - File system watcher with polling fallback for reliability
- **Editor Integration** - Ignores temporary files from editors (Vim, Emacs, VSCode, etc.)
- **Performance Optimized** - Minimal delays and smooth transitions

## 🚀 Quick Start

### 1. Install the Package

```bash
# Clone or download the package
git clone <repository-url>
cd packages/hot-reload
```

### 2. Import and Use

```typescript
// In your server file
import { HotReloadServer } from './packages/hot-reload/mod.ts';

// Start the hot reload server
const hotReloadServer = new HotReloadServer({
	port: 8081,
	watchDirs: ['src', 'public'],
	rootDir: Deno.cwd(),
});

await hotReloadServer.start();
```

```typescript
// In your SSR/render file
import { getHotReloadScript } from "./packages/hot-reload/mod.ts";

// Inject the client script into your HTML
const hotReloadScript = getHotReloadScript(8081);

// Add to your HTML head
const html = \`
<!DOCTYPE html>
<html>
<head>
  \${hotReloadScript}
</head>
<body>
  <!-- Your content -->
</body>
</html>
\`;
```

### 3. Start Developing

1. Make changes to any watched file
2. Save the file
3. Page automatically updates with smooth transitions
4. CSS changes apply instantly without page reload

## 📦 Package Structure

```
packages/hot-reload/
├── mod.ts           # Main entry point
├── server.ts        # WebSocket server implementation
├── client.ts        # Client-side script generator
├── types.ts         # TypeScript type definitions
├── deno.json        # Package configuration
└── README.md        # This file
```

## 🔧 Configuration Options

### HotReloadServer Options

```typescript
interface HotReloadOptions {
	port?: number; // WebSocket server port (default: 8081)
	rootDir?: string; // Root directory for file operations
	watchDirs?: string[]; // Directories to watch (default: ['src', 'public'])
	watchExtensions?: string[]; // File extensions to watch
	debounceMs?: number; // Debounce delay in ms (default: 50)
	onFileChange?: (filePath: string, changeType: 'created' | 'modified' | 'removed') => void;
}
```

## 🎯 Usage Examples

### Basic Setup

```typescript
// Simple server setup
const hotReloadServer = new HotReloadServer();
await hotReloadServer.start();
```

### Custom Watch Directories

```typescript
// Watch specific directories
const hotReloadServer = new HotReloadServer({
	port: 8081,
	watchDirs: ['src', 'components', 'styles'],
	rootDir: Deno.cwd(),
});

await hotReloadServer.start();
```

### Custom File Extensions

```typescript
// Watch additional file types
const hotReloadServer = new HotReloadServer({
	watchExtensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.md', '.json'],
});

await hotReloadServer.start();
```

### Custom Debounce

```typescript
// Adjust debounce timing
const hotReloadServer = new HotReloadServer({
	debounceMs: 100, // 100ms debounce
});

await hotReloadServer.start();
```

### Custom File Change Handler

```typescript
// Custom processing for file changes
const hotReloadServer = new HotReloadServer({
  onFileChange: (filePath, changeType) => {
    console.log(\`File \${changeType}: \${filePath}\`);
    // Custom logic here
  }
});

await hotReloadServer.start();
```

## 🔌 Integration Example

### Deno

```typescript
// server.ts
import { HotReloadServer } from './packages/hot-reload/mod.ts';

const hotReloadServer = new HotReloadServer({
	port: 8081,
	watchDirs: ['src', 'public'],
});

await hotReloadServer.start();

// Your main server continues...
Deno.serve({ port: 8000 }, handler);
```

## 🎨 How It Works

### Server Side

1. **File Watching** - Uses Deno's `watchFs` API to monitor file system changes
2. **Debouncing** - Prevents excessive reloads during rapid file saves
3. **WebSocket Server** - Broadcasts file change notifications to connected clients
4. **Fallback Polling** - Polling-based file watching as backup

### Client Side

1. **WebSocket Connection** - Connects to hot reload server
2. **Smart Reloading** - CSS files reload instantly, others use optimized updates
3. **Content Updates** - Fetches new content and applies smooth transitions
4. **Reconnection** - Automatic reconnection with exponential backoff

### File Change Detection

- **Real-time Watching** - File system events trigger immediate notifications
- **Content Hashing** - SHA-256 hashes detect actual content changes
- **Editor Integration** - Ignores temporary files from popular editors
- **Rate Limiting** - Prevents excessive reloads

## 🚨 Troubleshooting

### WebSocket Connection Issues

- Ensure the hot reload server is running on the correct port
- Check firewall settings
- Verify the port isn't used by another service

### Files Not Being Watched

- Check if directories exist in the `watchDirs` array
- Verify file extensions are in `watchExtensions`
- Ensure files aren't in ignored directories

### Excessive Reloads

- Increase `debounceMs` value
- Check for editor plugins that save files frequently
- Verify file watching isn't duplicated

### Performance Issues

- Reduce number of watched directories
- Limit file extensions to essential types
- Increase polling interval if using fallback mode

## 📝 Development

### Building

```bash
# Check for TypeScript errors
deno check mod.ts

# Run tests
deno test --allow-net --allow-read --allow-write --allow-env
```

### Testing

```bash
# Start a test server
deno run --allow-net --allow-read --allow-write --allow-env test-server.ts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Check the troubleshooting section above
- Look for existing issues in the repository
- Create a new issue with detailed information about your problem
