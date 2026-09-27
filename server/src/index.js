require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const setupSocket = require("./socket");
const AppError = require("./lib/app.error");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setupSocket(io);

app.get("/test", (req, res) => {
  res.json({
    message: "Server OK",
  });
});

app.use("/license", require("./router/license.route"));
app.use("/user", require("./router/user.route"));
app.use("/room", require("./router/room.route"));
app.use("/product", require("./router/product.route"));
app.use("/transaction", require("./router/transaction.route"));

// error middleware
app.use(async (err, req, res, next) => {
  if (!err) {
    next();
  }
  console.log(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  return res.status(500).json({
    message: "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
