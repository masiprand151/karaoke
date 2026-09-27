function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Client masuk ke room tertentu
    socket.on("room:join", ({ roomId }) => {
      socket.join(`room:${roomId}`);

      console.log(`Socket ${socket.id} joined room:${roomId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, reason);
    });
  });
}

module.exports = setupSocket;
