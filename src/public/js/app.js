const socket = new WebSocket(`ws://${window.location.host}`); // 서버에 접속

socket.addEventListener("open", () => {
	console.log("Connected to Server ✅"); // 서버에 접속되면 실행될 함수
});

socket.addEventListener("message", (message) => {
	console.log("New Message: ", message.data, "from the server"); // 서버로부터 메시지를 받으면 실행될 함수
});

socket.addEventListener("close", () => {
	console.log("Disconnected from Server ❌"); // 서버와의 연결이 끊어지면 실행될 함수
});

setTimeout(() => {
	socket.send("hello from the browser!");
}, 10000); // 10초 후 서버로 메시지 전달
