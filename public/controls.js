export function setupControls({ localStream, peers, socket }) {
  const toggleMicBtn = document.getElementById("toggleMic");
  const toggleCamBtn = document.getElementById("toggleCam");
  const leaveBtn = document.getElementById("leaveRoom");

  let micEnabled = true;
  let camEnabled = true;

  toggleMicBtn.onclick = () => {
    micEnabled = !micEnabled;
    localStream
      .getAudioTracks()
      .forEach((track) => (track.enabled = micEnabled));
    toggleMicBtn.innerHTML = micEnabled
      ? '<i class="fa-solid fa-microphone" title="Mute"></i>'
      : "<i class='fa-solid fa-microphone-slash' title='Unmute'></i>";
  };

  toggleCamBtn.onclick = () => {
    camEnabled = !camEnabled;
    localStream
      .getVideoTracks()
      .forEach((track) => (track.enabled = camEnabled));
    toggleCamBtn.innerHTML = camEnabled
      ? '<i class="fa-solid fa-camera" title="Disable"></i>'
      : '<i class="fa-solid fa-camera"></i><i class="fa-solid fa-slash faSlash" title="Enable"></i>';
  };

  leaveBtn.onclick = () => {
    socket.disconnect();
    for (const id in peers) {
      peers[id].close();
      const video = document.getElementById(id);
      if (video) video.remove();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      // Remove local video element if present
      const localVideo = document.getElementById("localVideo");
      if (localVideo) localVideo.remove();
    }
    window.location.href = "/landing.html";
  };
}
