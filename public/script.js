const localVideo = document.getElementById("localVideo");

navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localVideo.srcObject = stream;
  })
  .catch((error) => {
    console.error("Error accessing media devices.", error);
  });
