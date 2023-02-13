import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000"); // 서버가 실행되면 실행될 함수

const server = http.createServer(app); // http 서버 생성 후 접근 가능한 express app을 전달

const wss = new WebSocket.Server({ server }); // http 서버를 전달하여 websocket 서버 생성 -> http & ws 둘 다 사용 가능

const sockets = []; // 브라우저와 연결된 소켓을 저장할 배열

wss.on("connection", (socket) => {
	sockets.push(socket); // 브라우저와 연결된 소켓을 배열에 저장
	socket["nickname"] = "Anon"; // 브라우저에 닉네임 저장 [nickname: "Anon"]

	console.log("Connected to Browser ✅"); // 브라우저에 접속되면 실행될 함수

	socket.on("close", () => {
		console.log("Disconnected from the Browser ❌"); // 브라우저와의 연결이 끊어지면 실행될 함수
	});

	socket.on("message", (msg) => {
		const message = JSON.parse(msg.toString("utf-8")); // JSON.parse()를 사용하여 문자열을 객체로 변환
		switch (message.type) {
			case "new_message":
				sockets.forEach((aSocket) =>
					aSocket.send(`${socket.nickname}: ${message.payload}`)
				); // 모든 브라우저로 메시지 전달
				break;
			case "nickname":
				socket["nickname"] = message.payload; // socket에 닉네임 저장
				break;
		}
	}); // 브라우저로부터 메시지를 받으면 실행될 함수
});

server.listen(3000, handleListen); // 서버 실행
