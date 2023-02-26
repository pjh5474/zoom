const socket = io();

const searchParams = new URLSearchParams(location.search);
const roomName = window.location.pathname.split("/")[2];
let myNickname;

const chatroomDiv = document.getElementById("chatroom");
const roomTitleDiv = document.getElementById("room-title");
const roomTitleH3 = roomTitleDiv.querySelector("h3");
const roomLeaveBtn = roomTitleDiv.querySelector("button");

const chatDiv = document.getElementById("chat-form");
const messageList = document.getElementById("message-list");
const changeNickForm = chatDiv.querySelector("#changeNickForm");
const msgForm = chatDiv.querySelector("#msgForm");
const msgBtn = msgForm.querySelector("button");

function setupRoom() {
	myNickname = window.location.pathname.split("/")[3];
	roomTitleH3.innerText = roomName;
	const input = chatDiv.querySelector("#changeNickForm input");
	input.value = myNickname;
	socket.emit("nickname", myNickname);
	socket.emit("start", roomName);
}

function addMessage(message, type) {
	const li = document.createElement("li");
	const span = document.createElement("span");
	span.innerText = message;
	li.appendChild(span);
	li.className = "message";
	li.className += ` ${type}`;
	messageList.appendChild(li);
	li.scrollIntoView(true);
	if (messageList.childElementCount > 100) {
		messageList.firstChild.remove();
	}
}

function handleMessageSubmit(event) {
	event.preventDefault();
	const input = chatDiv.querySelector("#msgForm input");
	const value = input.value;
	socket.emit("new_message", input.value, roomName, () => {
		addMessage(`${value}`, "my-message");
	});
	input.value = "";
}

function handleChangeNickSubmit(event) {
	event.preventDefault();
	const input = chatDiv.querySelector("#changeNickForm input");
	const value = input.value;
	if (myNickname === value) {
		addMessage(
			`Please enter an input different from your current nickname(${myNickname})`,
			"system-message"
		);
	} else {
		socket.emit("change_nick", myNickname, input.value, roomName);
	}
}

socket.on("failNickChange", (changedNick) => {
	addMessage(
		`A user with the same nickname( ${changedNick} ) already exists in the room.`,
		"system-message"
	);
});

socket.on("acceptNickChange", (changedNick) => {
	addMessage(
		`Your nickname has been changed (${myNickname} => ${changedNick})`,
		"system-message"
	);
	myNickname = changedNick;
	chatDiv.querySelector("#changeNickForm input").value = myNickname;
});

socket.on("new_message", (message, type) => {
	addMessage(message, type);
});

function handleLeaveRoom(event) {
	event.preventDefault();
	messageList.innerHTML = "";
	socket.emit("leaveRoom", roomName);
	location.href = "/";
}

changeNickForm.addEventListener("submit", handleChangeNickSubmit);
roomLeaveBtn.addEventListener("click", handleLeaveRoom);
msgBtn.addEventListener("click", handleMessageSubmit);

function setRoomTitle(roomName, userCount) {
	roomTitleH3.innerText = `Room ${roomName} - ( ${userCount} users )`;
}

function showRoom(userCount) {
	setRoomTitle(roomName, userCount);
	const msgForm = chatDiv.querySelector("#msgForm");
	const msgBtn = msgForm.querySelector("button");
	msgBtn.addEventListener("click", handleMessageSubmit);
}

socket.on("welcome", (nickname, userCount) => {
	setRoomTitle(roomName, userCount);
	addMessage(`${nickname} Joined!`, "system-message");
});

socket.on("bye", (nickname, userCount) => {
	setRoomTitle(roomName, userCount);
	addMessage(`${nickname} Left!`, "system-message");
});

function joinRoom(publicRoom) {
	roomName = publicRoom;
	const nicknameInput = roomForm.querySelector("#nicknameInput");
	if (nicknameInput.value === "") {
		socket.emit("nickname", "Anonymous");
		myNickname = "Anonymous";
	} else {
		socket.emit("nickname", nicknameInput.value);
		myNickname = nicknameInput.value;
	}
	socket.emit("enter_room", roomName, showRoom);
	roomDiv.querySelector("#changeNickForm input").value = myNickname;
}

setupRoom();
