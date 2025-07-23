require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${Math.random().toString(36).substring(2, 8)}`);
});

app.get("/ice", async (req, res) => {
  try {
    const response = await axios.put(
      `https://global.xirsys.net/_turn/${process.env.XIRSYS_CHANNEL}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.XIRSYS_USERNAME}:${process.env.XIRSYS_CREDENTIAL}`
            ).toString("base64"),
        },
      }
    );

    // Check if XIRSYS returned an error
    if (response.data.s === "error") {
      if (process.env.NODE_ENV === "development") {
        console.error("XIRSYS Error:", response.data.v);
        console.log("Using fallback STUN server due to XIRSYS error");
      }
      return res.json({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
    }

    const iceServers = response.data.v.iceServers;
    res.json({ iceServers });
  } catch (error) {
    console.error(
      "Error fetching ICE servers:",
      error.response?.data || error.message
    );
    res.json({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  }
});

app.get("/:room", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

io.on("connection", (socket) => {
  if (process.env.NODE_ENV === "development") {
    console.log("User connected:", socket.id);
  }

  socket.on("join", (roomId) => {
    socket.join(roomId);
    socket.currentRoom = roomId; // Store the room ID
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

  socket.on("disconnecting", () => {
    if (socket.currentRoom) {
      socket.to(socket.currentRoom).emit("user-left", socket.id);
    }
  });
});

server.listen(3000, () => {
  if (process.env.NODE_ENV === "development") {
    console.log("Server running at http://localhost:3000");
  }
});
