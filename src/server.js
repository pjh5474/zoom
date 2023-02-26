import http from "http";
import { Server } from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/chatroom/:roomName/:nickname", (req, res) => res.render("chatroom"));
app.get("/vc-room/:roomName/:nickname", (req, res) => res.render("vc-room"));
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

async function getRoomUsersNickname(roomName, userNickname) {
	let socketsInRoom = await wsServer.in(roomName).fetchSockets();
	socketsInRoom.splice(socketsInRoom.indexOf(userNickname), 1);
	const nicknamesInRoom = [];
	socketsInRoom.forEach((aSocket) => {
		nicknamesInRoom.push(aSocket.nickname);
	});
	return nicknamesInRoom;
}

function generateUID() {
	let firPart = (Math.random() * 46656) | 0;
	let secPart = (Math.random() * 46656) | 0;
	firPart = ("000" + firPart.toString(36)).slice(-3);
	secPart = ("000" + secPart.toString(36)).slice(-3);
	return firPart + secPart;
}

wsServer.on("connection", (socket) => {
	wsServer.sockets.emit("room_change", publicRooms());
	socket["uid"] = generateUID();
	socket["nickname"] = "Anonymous_" + socket["uid"];

	socket.on("set_nickname", (new_nickname, showNickChange) => {
		showNickChange(new_nickname);
	});

	socket.on("nickname", (nickname) => {
		socket["nickname"] = nickname;
	});

	socket.on("start", async (roomName) => {
		socket.join(roomName);
		//socket.to(roomName).emit("welcome");
		const nicknamesInRoom = await getRoomUsersNickname(
			roomName,
			socket["nickname"]
		);
		if (nicknamesInRoom.includes(socket["nickname"])) {
			socket["nickname"] = `${socket["nickname"]}_${socket["uid"]}`;
			socket.emit("acceptNickChange", socket["nickname"]);
		}
		socket
			.to(roomName)
			.emit("welcome", socket.nickname, countRoomUsers(roomName));
		socket.emit("welcome", socket.nickname, countRoomUsers(roomName));
		wsServer.sockets.emit("room_change", publicRooms());
	});

	socket.on("vc-start", async (roomName) => {
		socket.join(roomName);
		//socket.to(roomName).emit("welcome");
		const nicknamesInRoom = await getRoomUsersNickname(
			roomName,
			socket["nickname"]
		);
		if (nicknamesInRoom.includes(socket["nickname"])) {
			socket["nickname"] = `${socket["nickname"]}_${socket["uid"]}`;
			socket.emit("acceptNickChange", socket["nickname"]);
		}
		socket
			.to(roomName)
			.emit("welcome", socket.nickname, countRoomUsers(roomName));
		wsServer.sockets.emit("room_change", publicRooms());
	});

	socket.on("leaveVCRoom", (roomName) => {
		socket.to(roomName).emit("leaveRoom", socket.nickname);
		socket.leave(roomName);
	});

	socket.on("join_chatroom", (roomName, joinChatRoom) => {
		joinChatRoom(roomName);
	});
	socket.on("join_vcroom", (roomName, joinVCRoom) => {
		const usersInRoom = countRoomUsers(roomName);
		if (usersInRoom === undefined || usersInRoom === 1) {
			console.log(usersInRoom);
			joinVCRoom(roomName);
		} else {
			console.log(usersInRoom);
			socket.emit("fullRoom", roomName);
		}
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
		socket.rooms.forEach((room) =>
			socket.to(room).emit("bye", socket.nickname, countRoomUsers(room) - 1)
		);
	});
	socket.on("disconnect", () => {
		wsServer.sockets.emit("room_change", publicRooms());
	});

	socket.on("new_message", (msg, roomName, done) => {
		console.log("new_message", msg, roomName);
		socket
			.to(roomName)
			.emit("new_message", `${socket.nickname}  :  ${msg}`, "others-message");
		done();
	});

	socket.on("nickname", (nickname) => (socket["nickname"] = nickname));

	socket.on("change_nick", async (nickname, changedNick, roomName) => {
		const nicknamesInRoom = await getRoomUsersNickname(
			roomName,
			socket["nickname"]
		);
		if (nicknamesInRoom.includes(changedNick)) {
			socket.emit("failNickChange", changedNick);
		} else {
			socket
				.to(roomName)
				.emit(
					"new_message",
					`User ${nickname} changed nicknams as ${changedNick}`,
					"system-message"
				);
			socket["nickname"] = changedNick;
			socket.emit("acceptNickChange", changedNick);
		}
	});

	socket.on("leaveRoom", (roomName) => {
		socket.leave(roomName);
		socket.to(roomName).emit("bye", socket.nickname, countRoomUsers(roomName));
		wsServer.sockets.emit("room_change", publicRooms());
	});
});
const handleListen = () => console.log("Listening on http://localhost:3000"); // 서버가 실행되면 실행될 함수
httpServer.listen(3000, handleListen); // 서버 실행

// http://localhost:3000/socket.io/socket.io.js -> frontend script로 import
