const socket = io(); // socket.io-client를 import한 후 io()를 호출하면 socket.io 서버와 연결됨

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function handleRoomSubmit(event) {
	event.preventDefault();
	const input = form.querySelector("input");
	socket.emit("enter_room", { payload: input.value }, () => {
		console.log("server is done!");
	}); // socket.io-client에서 이벤트를 보낼 수 있음
	input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
