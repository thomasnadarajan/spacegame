// Game server configuration
// This will be replaced by the build script with the actual server URL
window.GAME_SERVER_URL = "http://spacegame-prod-apse2.eba-f2rssycw.ap-southeast-2.elasticbeanstalk.com";

// Enable Socket.IO debug logging in development
window.DEBUG = true;

// Socket.IO paths to try
window.SOCKET_PATHS = [
  "/socket.io/",
  "/",
  ""
];

// Ensure we're using compatible transport methods
window.SOCKET_OPTIONS = {
  transports: ['polling', 'websocket'],
  upgrade: true,
  forceNew: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000,
  autoConnect: true,
  withCredentials: true,
  path: "/socket.io/"
}; 