const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

// Initialize socket.io
const socket = io();

let localStream;

// Store peer connections
// key = socketId, value = RTCPeerConnection
const peers = {};

// Get local media
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
    localVideo.muted = true; // Mute local audio to prevent hearing yourself
  })
  .catch((err) => {
    alert("Could not access media devices.");
    console.error(err);
  });

// join room
if (window.location.pathname !== "/") {
  const roomId = window.location.pathname.split("/").pop();
  socket.emit("join", roomId);
} else {
  const roomId = Math.random().toString(36).substring(2, 8);
  socket.emit("join", roomId);
}

// Receive list of existing users
socket.on("existing-users", (users) => {
  // Wait until localStream is available before proceeding
  const waitForStream = setInterval(() => {
    if (localStream) {
      clearInterval(waitForStream);
      users.forEach((userId) => {
        const peer = createPeer(userId, true);
        console.log("existing user joined:", userId);
        console.log("existing user peer object:", peer);
        peers[userId] = peer;
        console.log("existing user peers retrieved:", peers);
        localStream
          .getTracks()
          .forEach((track) => peer.addTrack(track, localStream));
      });
    }
  }, 100);
  return;
});

// New user joined
socket.on("user-joined", (socketId) => {
  const waitForStream = setInterval(() => {
    if (localStream) {
      clearInterval(waitForStream);
      // Create a new peer connection for the new user (existing users initiate)
      const peer = createPeer(socketId, false);
      console.log("new user joined:", socketId);
      console.log("new user peer object:", peer);
      peers[socketId] = peer;
      console.log("new user peers retrieved:", peers);
      localStream
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStream));
    }
  }, 100);
});

// Create and manage peer connections
function createPeer(socketId, initiator) {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });
  console.log("first peer object created:", peer);
  peer.onicecandidate = (event) => {
    console.log("ICE event and event candidate:", event, event.candidate);
    if (event.candidate) {
      socket.emit("ice-candidate", {
        target: socketId,
        candidate: event.candidate,
      });
    }
  };

  // Handle track event to display remote video
  peer.ontrack = (event) => {
    let remoteVideo = document.getElementById(socketId);
    if (!remoteVideo) {
      remoteVideo = document.createElement("video");
      remoteVideo.id = socketId;
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
      remoteVideos.appendChild(remoteVideo);
    }
    remoteVideo.srcObject = event.streams[0];
  };

  // If this peer(existing user) is the initiator, set up negotiation needed event(offer is sent to new user)
  if (initiator) {
    peer.onnegotiationneeded = async () => {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("offer", {
        target: socketId,
        sdp: peer.localDescription,
      });
    };
  }

  return peer;
}

// Handle offer from initiator(existing user) and sends an answer
socket.on("offer", async ({ sdp, from }) => {
  const peer = createPeer(from, false);
  peers[from] = peer;

  // Wait until localStream is available before proceeding with WebRTC operations
  const waitForStream = setInterval(async () => {
    if (localStream) {
      clearInterval(waitForStream);

      // Add local tracks to the peer connection FIRST
      localStream
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStream));

      // Then proceed with WebRTC signaling
      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit("answer", {
        target: from,
        sdp: peer.localDescription,
      });
    }
  }, 100);
});

// Handle answer
socket.on("answer", async ({ sdp, from }) => {
  await peers[from]?.setRemoteDescription(new RTCSessionDescription(sdp));
});

// Handle ICE
socket.on("ice-candidate", ({ candidate, from }) => {
  peers[from]?.addIceCandidate(new RTCIceCandidate(candidate));
});
