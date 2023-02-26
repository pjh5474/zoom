import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/settings", (req, res) => res.render("settings"));
//app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app); // http 서버 생성 후 접근 가능한 express app을 전달
const wsServer = new Server(httpServer, {
	cors: {
		origin: ["https://admin.socket.io"],
		credentials: true,
	},
}); // http 서버를 SocketIO에 전달

instrument(wsServer, {
	auth: false,
});

wsServer.on("connection", (socket) => {
	socket.on("join_room", (roomName) => {
		socket.join(roomName);
		socket.to(roomName).emit("welcome");
	});
	socket.on("offer", (offer, roomName) => {
		socket.to(roomName).emit("offer", offer);
	});
	socket.on("answer", (answer, roomName) => {
		socket.to(roomName).emit("answer", answer);
	});
	socket.on("ice", (ice, roomName) => {
		socket.to(roomName).emit("ice", ice);
	});
	socket.on("disconnecting", () => {
		socket.rooms.forEach((room) => socket.to(room).emit("leaveRoom"));
	});
});
const handleListen = () => console.log("Listening on http://localhost:3000"); // 서버가 실행되면 실행될 함수
httpServer.listen(3000, handleListen); // 서버 실행

// http://localhost:3000/socket.io/socket.io.js -> frontend script로 import
