const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nick");

const socket = new WebSocket(`ws://${window.location.host}`); // 서버에 접속

function handleOpen() {
	console.log("Connected to Server ✅");
}
socket.addEventListener("open", handleOpen); // 서버와 연결되면 실행될 함수

socket.addEventListener("message", (message) => {
	const li = document.createElement("li");
	li.innerText = message.data;
	messageList.append(li);
}); // 서버로부터 메시지를 받으면 실행될 함수

socket.addEventListener("close", () => {
	console.log("Disconnected from Server ❌");
}); // 서버와의 연결이 끊어지면 실행될 함수

function makeMessage(type, payload) {
	const msg = { type, payload }; // 객체 생성
	return JSON.stringify(msg); // JSON.stringify()를 사용하여 객체를 문자열로 변환
}

function handleSubmit(event) {
	event.preventDefault();
	const input = messageForm.querySelector("input");
	socket.send(makeMessage("new_message", input.value));
	const li = document.createElement("li");
	li.innerText = `You: ${input.value}`;
	messageList.append(li);
	input.value = ""; // input 초기화
} // 서버로 메시지 전달

function handleNickSubmit(event) {
	event.preventDefault();
	const input = nickForm.querySelector("input");
	socket.send(makeMessage("nickname", input.value));
	input.value = ""; // input 초기화
} // 서버로 메시지 전달

messageForm.addEventListener("submit", handleSubmit);

nickForm.addEventListener("submit", handleNickSubmit);
