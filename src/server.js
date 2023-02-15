import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

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

function publicRooms() {
	const {
		sockets: {
			adapter: { sids, rooms },
		},
	} = wsServer;
	const publicRooms = [];
	rooms.forEach((_, key) => {
		if (sids.get(key) === undefined) {
			publicRooms.push({ roomName: key, userCount: countRoomUsers(key) });
		}
	});
	return publicRooms;
}

function countRoomUsers(roomName) {
	return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
	wsServer.sockets.emit("room_change", publicRooms());
	socket["nickname"] = "Anonymous";
	socket.onAny((event) => {
		console.log(wsServer.sockets.adapter);
		console.log(`Socket Event: ${event}`);
	});
	socket.on("enter_room", (roomName, showRoom) => {
		socket.join(roomName);
		showRoom(countRoomUsers(roomName));
		socket
			.to(roomName)
			.emit("welcome", socket.nickname, countRoomUsers(roomName));
		// socket.to(roomName)으로 특정 room에 있는 socket에게만 이벤트를 보낼 수 있음
		// 특정 room의 자신을 제외한 모든 socket에게 welcome 이벤트 전달
		wsServer.sockets.emit("room_change", publicRooms());
	}); // socket.io 서버에서 이벤트를 받고, 이벤트는 프론트엔드에서 실행됨
	// frontend emit 에서 전달한 function을 backend에서 제어할 수 있음

	socket.on("disconnecting", () => {
		socket.rooms.forEach((room) =>
			socket.to(room).emit("bye", socket.nickname, countRoomUsers(room) - 1)
		);
		// socket.rooms는 socket이 접속한 모든 room의 이름을 담고 있음
		// socket.rooms.forEach(room => socket.to(room).emit("bye"));로 모든 room에 bye 이벤트를 보낼 수 있음
	});

	socket.on("disconnect", () => {
		wsServer.sockets.emit("room_change", publicRooms());
	});

	socket.on("new_message", (msg, roomName, done) => {
		socket.to(roomName).emit("new_message", `${socket.nickname}: ${msg}`);
		done();
	});

	socket.on("nickname", (nickname) => (socket["nickname"] = nickname));

	socket.on("leaveRoom", (roomName) => {
		socket.leave(roomName);
		socket.to(roomName).emit("bye", socket.nickname, countRoomUsers(roomName));
		wsServer.sockets.emit("room_change", publicRooms());
	});
});

const handleListen = () => console.log("Listening on http://localhost:3000"); // 서버가 실행되면 실행될 함수
httpServer.listen(3000, handleListen); // 서버 실행

// http://localhost:3000/socket.io/socket.io.js -> frontend script로 import
