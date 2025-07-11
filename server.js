const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${Math.random().toString(36).substring(2, 8)}`);
});

app.get("/:room", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (roomId) => {
    socket.join(roomId);
    const room = io.sockets.adapter.rooms.get(roomId) || new Set();
    const otherUsers = [...room].filter((id) => id !== socket.id);

    // Send list of existing users to the new user
    socket.emit("existing-users", otherUsers);

    // Notify others a new user joined
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", (data) => {
    io.to(data.target).emit("offer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("answer", (data) => {
    io.to(data.target).emit("answer", { sdp: data.sdp, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    io.to(data.target).emit("ice-candidate", {
      candidate: data.candidate,
      from: socket.id,
    });
  });
});

server.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
