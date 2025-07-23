import { setupControls } from "./controls.js";

const localVideo = document.getElementById("localVideo");
const remoteVideos = document.getElementById("remoteVideos");

// Initialize socket.io
const socket = io();

// Fetch ICE servers from the server
const response = await fetch("/ice");
const { iceServers } = await response.json();

let localStream;

// Store peer connections
// key = socketId, value = RTCPeerConnection
const peers = {};

// Set up controls
const waitForStream = setInterval(() => {
  if (localStream) {
    clearInterval(waitForStream);
    setupControls({ localStream, peers, socket });
  }
}, 100);

// Get local media
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
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
        peers[userId] = peer;
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
      peers[socketId] = peer;
      localStream
        .getTracks()
        .forEach((track) => peer.addTrack(track, localStream));
    }
  }, 100);
});

// Create and manage peer connections
function createPeer(socketId, initiator) {
  const peer = new RTCPeerConnection({ iceServers });
  peer.onicecandidate = (event) => {
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
  const peer = peers[from];
  if (peer) {
    await peer.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    socket.emit("answer", {
      target: from,
      sdp: peer.localDescription,
    });
  }
});

// Handle answer
socket.on("answer", async ({ sdp, from }) => {
  await peers[from]?.setRemoteDescription(new RTCSessionDescription(sdp));
});

// Handle ICE
socket.on("ice-candidate", ({ candidate, from }) => {
  peers[from]?.addIceCandidate(new RTCIceCandidate(candidate));
});

// Handle user left
socket.on("user-left", (socketId) => {
  const video = document.getElementById(socketId);
  if (video) video.remove();
  if (peers[socketId]) {
    peers[socketId].close();
    delete peers[socketId];
  }
});
