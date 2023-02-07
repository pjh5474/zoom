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

wss.on("connection", (socket) => {
	console.log("Connected to Browser ✅"); // 브라우저에 접속되면 실행될 함수
	socket.on("close", () => {
		console.log("Disconnected from the Browser ❌"); // 브라우저와의 연결이 끊어지면 실행될 함수
	});
	socket.on("message", (message) => console.log(message.toString("utf-8"))); // socket으로부터 메시지를 받으면 실행될 함수
	socket.send("Hello!!!"); // socket에 메시지 전달
});

server.listen(3000, handleListen); // 서버 실행
