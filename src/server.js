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
	socket.on("join_room", (room, id) => {
		socket.join(room);
		console.log(wsServer.adapter);
		socket.to(room).emit("welcome", id);
	});
	socket.on("offer", (offer, room, newbieID, offersId) => {
		socket.to(newbieID).emit("offer", offer, offersId);
	});
	socket.on("answer", (offer, offersId, newbieId) => {
		socket.to(offersId).emit("answer", offer, newbieId);
	});
	socket.on("ice", (ice, room, othersId, myId) => {
		socket.to(othersId).emit("ice", ice, myId);
	});
	socket.on("disconnecting", () => {
		socket.rooms.forEach((room) =>
			socket.to(room).emit("leaveRoom", socket.id)
		);
	});
});
const handleListen = () => console.log("Listening on http://localhost:3000"); // 서버가 실행되면 실행될 함수
httpServer.listen(3000, handleListen); // 서버 실행

// http://localhost:3000/socket.io/socket.io.js -> frontend script로 import
