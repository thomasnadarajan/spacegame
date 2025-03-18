// Game server configuration
// This will be replaced by the build script with the actual server URL
window.GAME_SERVER_URL = "https://d2u6z794p1rhlk.cloudfront.net";

// Enable Socket.IO debug logging in development
window.DEBUG = true;

// Socket.IO configuration
window.SOCKET_OPTIONS = {
  transports: ['polling'],
  upgrade: false,
  path: '/socket.io/',
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5
}; 