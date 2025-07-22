# Video Chat App

A real-time video chat application built with WebRTC, Socket.IO, and Node.js. Users can join video rooms and communicate with multiple participants simultaneously.

## Features

- **Real-time Video Chat**: High-quality peer-to-peer video communication
- **Audio Communication**: Crystal clear audio transmission
- **Multiple Participants**: Support for multiple users in the same room
- **Microphone & Camera Controls**: Toggle audio and video on/off
- **Random Room Generation**: Automatic room creation with unique IDs

## Technology Stack

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **WebRTC**: Peer-to-peer video/audio communication
- **Real-time Communication**: Socket.IO for signaling

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Wineshuga/video-chat-app.git
   cd video-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

## Usage

1. **Join a Room**: 
   - Visit `http://localhost:3000` to get redirected to a random room
   - Or visit `http://localhost:3000/your-room-name` to join a specific room

2. **Share the Room**: 
   - Copy the URL and share it with others to join the same video chat

3. **Control Your Media**:
   - Use the microphone button to mute/unmute your audio
   - Use the camera button to turn your video on/off

## Project Structure

```
video-chat/
├── server.js              # Express server and Socket.IO setup
├── package.json           # Dependencies and scripts
├── public/
│   ├── room.html         # Main video chat interface
│   ├── landing.html      # Landing page
│   ├── script.js         # WebRTC and Socket.IO client logic
│   ├── controls.js       # Media controls (mic/camera toggle)
│   └── style.css         # Styling
└── README.md
```

## How It Works

### WebRTC Signaling Flow

1. **User Joins**: New user joins a room via Socket.IO
2. **Peer Discovery**: Server sends list of existing users to new user
3. **Connection Initiation**: Existing users create peer connections and send offers
4. **Answer Exchange**: New user receives offers and sends back answers
5. **ICE Candidates**: Both peers exchange ICE candidates for connection establishment
6. **Media Streaming**: Direct peer-to-peer video/audio streaming begins

### Key Components

- **Server (`server.js`)**: Handles room management and WebRTC signaling
- **Client (`script.js`)**: Manages peer connections and media streams
- **Controls (`controls.js`)**: Handles microphone and camera toggle functionality

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

*Requires HTTPS for production deployment due to WebRTC security requirements*

## Development

### Running in Development Mode

```bash
# Install dependencies
npm install

# Start the server
node server.js

# Or use nodemon for auto-restart during development
npm install -g nodemon
nodemon server.js
```

### Testing

1. Open multiple browser tabs/windows
2. Navigate to the same room URL
3. Allow camera and microphone permissions
4. Test video/audio communication between tabs

## Deployment

### Hosting Options for Side Projects

#### Recommended Platforms

1. **Render** (Free tier available)
   - Automatic HTTPS (required for WebRTC)
   - GitHub integration for auto-deployment
   - Zero configuration needed

2. **Railway** ($5/month)
   - Simple deployment from GitHub
   - Built-in HTTPS and custom domains
   - Excellent for Node.js apps

3. **Vercel** (Free tier)
   - Serverless deployment
   - Automatic HTTPS and global CDN
   - May require slight modifications for WebSocket support

### Safety & Security Considerations

1. **Environment Variables**
   ```bash
   # Create .env file (never commit this)
   PORT=3000
   NODE_ENV=production
   ```

2. **Rate Limiting**
   ```javascript
   // Add to server.js
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use(limiter);
   ```

3. **Input Validation**
   ```javascript
   // Validate room IDs
   socket.on("join", (roomId) => {
     if (!roomId || roomId.length > 50 || !/^[a-zA-Z0-9-_]+$/.test(roomId)) {
       return socket.emit("error", "Invalid room ID");
     }
     socket.join(roomId);
     // ... rest of join logic
   });
   ```

### Production Considerations

1. **HTTPS Required**: WebRTC requires HTTPS in production
2. **STUN/TURN Servers**: Configure proper ICE servers for NAT traversal
3. **Environment Variables**: Set up proper environment configuration
4. **Domain Configuration**: Update CORS settings if needed

### Example STUN/TURN Configuration

```javascript
const peer = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: "your-username",
      credential: "your-password"
    }
  ]
});
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Known Issues

- Large groups (10+ users) may experience performance issues
- Some mobile browsers may have WebRTC compatibility issues
- Network firewalls may block peer-to-peer connections

## Future Enhancements

- [ ] Screen sharing functionality
- [ ] Chat messaging
- [ ] Recording capabilities
- [ ] User authentication
- [ ] Room passwords
- [ ] Mobile app version
- [ ] Real-time Notifications
- [ ] Better error handling and reconnection logic

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
