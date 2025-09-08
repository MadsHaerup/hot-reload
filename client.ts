// Hot Reload Client - Client-side script generator

export function getHotReloadScript(port = 8081): string {
	return `
<script>
(function() {
	let ws;
	let reconnectTimer;
	
	function connect() {
		try {
			ws = new WebSocket('ws://localhost:${port}');
			
			ws.onopen = function() {
				clearTimeout(reconnectTimer);
			};
			
			ws.onmessage = function(event) {
				try {
					const data = JSON.parse(event.data);
					
					if (data.type === 'ping') {
						return;
					}
					
					if (data.type === 'reload') {
						// Simple page reload - no complex content replacement
						console.log('🔄 Hot reload triggered for:', data.path);
						window.location.reload();
					}
				} catch (error) {
					console.error('Hot reload error:', error);
				}
			};
			
			ws.onclose = function() {
				// Reconnect on close
				reconnectTimer = setTimeout(connect, 1000);
			};
			
			ws.onerror = function(error) {
				console.error('WebSocket error:', error);
			};
		} catch (error) {
			console.error('Failed to connect to hot reload:', error);
		}
	}
	
	// Start connection
	connect();
})();
</script>`;
}
