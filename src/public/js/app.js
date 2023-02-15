const socket = io(); // socket.io-client를 import한 후 io()를 호출하면 socket.io 서버와 연결됨

/* bind HTML elements */
const welcomeDiv = document.getElementById("welcomeDiv");
const roomForm = welcomeDiv.querySelector("form");
const roomDiv = document.getElementById("roomDiv");

roomDiv.hidden = true;

let roomName = "";

/* bind HTML elements */
/*           handle messages function        */

function addMessage(message) {
	const ul = roomDiv.querySelector("ul");
	const li = document.createElement("li");
	li.innerText = message;
	ul.appendChild(li);
}

function handleMessageSubmit(event) {
	event.preventDefault();
	const input = roomDiv.querySelector("#msgForm input");
	const value = input.value;
	socket.emit("new_message", input.value, roomName, () => {
		addMessage(`You: ${value}`);
	});
	input.value = "";
}

socket.on("new_message", addMessage); // (msg) => addMessage(msg)와 같음

/*           handle messages function        */
/*           Leave and Join Room function        */

function handleRoomSubmit(event) {
	event.preventDefault();
	const roomInput = roomForm.querySelector("#roomInput");
	const nicknameInput = roomForm.querySelector("#nicknameInput");
	if (nicknameInput.value === "") {
		socket.emit("nickname", "Anonymous");
	} else {
		socket.emit("nickname", nicknameInput.value);
	}

	socket.emit("enter_room", roomInput.value, showRoom); // socket.io-client에서 이벤트를 보낼 수 있음
	// emit으로 unlimited argumnets를 보낼 수 있음
	// 끝날 때 실행되는 함수를 보내려면 마지막 인자로 보내야 한다
	roomName = roomInput.value;
	roomInput.value = "";
}

roomForm.addEventListener("submit", handleRoomSubmit);

function setRoomTitle(roomName, userCount) {
	const h3 = roomDiv.querySelector("h3");
	h3.innerText = `Room ${roomName} (${userCount})`;
}

function showRoom(userCount) {
	welcomeDiv.hidden = true;
	roomDiv.hidden = false;
	setRoomTitle(roomName, userCount);
	const msgForm = roomDiv.querySelector("#msgForm");
	msgForm.addEventListener("submit", handleMessageSubmit);
}

socket.on("welcome", (nickname, userCount) => {
	setRoomTitle(roomName, userCount);
	addMessage(`${nickname} Joined!`);
});

socket.on("bye", (nickname, userCount) => {
	setRoomTitle(roomName, userCount);
	addMessage(`${nickname} Left!`);
});

socket.on("room_change", (publicRooms) => {
	const roomList = welcomeDiv.querySelector("ul");
	roomList.innerHTML = "";
	if (publicRooms.length === 0) {
		return;
	}
	publicRooms.forEach((publicRoom) => {
		const li = document.createElement("li");
		li.innerText = publicRoom;
		roomList.append(li);
	});
});
