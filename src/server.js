import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app); // http 서버 생성 후 접근 가능한 express app을 전달
const wsServer = SocketIO(httpServer); // http 서버를 SocketIO에 전달

wsServer.on("connection", (socket) => {
	console.log(socket);
});

const handleListen = () => console.log("Listening on http://localhost:3000"); // 서버가 실행되면 실행될 함수
httpServer.listen(3000, handleListen); // 서버 실행

// http://localhost:3000/socket.io/socket.io.js -> frontend script로 import
