const socket = io();
const chatDiv = document.getElementById("chat-form");
const messageList = document.getElementById("message-list");
const msgForm = chatDiv.querySelector("#msgForm");
const msgBtn = msgForm.querySelector("button");
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const vcRoomDiv = document.getElementById("videochat-room");
const roomName = window.location.pathname.split("/")[2];
const roomTitleH3 = document.getElementById("room-title").querySelector("h3");
const roomLeaveBtn = document
	.getElementById("room-title")
	.querySelector("button");

let myNickname = window.location.pathname.split("/")[3];

let myStream;
let muted = false;
let cameraOff = false;
/** @type {RTCPeerConnection} */
let myPeerConnection;
let myDataChannel;

let removeToast;

function toast(string) {
	const toast = document.getElementById("toast");

	toast.classList.contains("reveal")
		? (clearTimeout(removeToast),
		  (removeToast = setTimeout(function () {
				document.getElementById("toast").classList.remove("reveal");
		  }, 5000)))
		: (removeToast = setTimeout(function () {
				document.getElementById("toast").classList.remove("reveal");
		  }, 4000));
	toast.classList.add("reveal"), (toast.innerText = string);
}
/* About getMedia() */

async function getCameras() {
	try {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const cameras = devices.filter((device) => device.kind === "videoinput");
		const currentCamera = myStream.getVideoTracks()[0];
		cameras.forEach((camera) => {
			const option = document.createElement("option");
			option.value = camera.deviceId;
			option.innerText = camera.label;
			if (currentCamera.label === camera.label) {
				option.selected = true;
			}
			camerasSelect.appendChild(option);
		});
	} catch (error) {
		console.log("error", error);
	}
}
async function getMedia(deviceId) {
	const initialConstraints = {
		audio: true,
		video: { facingMode: "user" },
	};
	const cameraConstraints = {
		audio: true,
		video: { deviceId: { exact: deviceId } },
	};
	try {
		myStream = await navigator.mediaDevices.getUserMedia(
			deviceId ? cameraConstraints : initialConstraints
		);
		myFace.srcObject = myStream;
		if (!deviceId) {
			await getCameras();
		}
	} catch (error) {
		console.log("error", error);
	}
}
async function handleMuteClick() {
	await myStream
		.getAudioTracks()
		.forEach((track) => (track.enabled = !track.enabled));
	if (!muted) {
		muteBtn.innerText = "Unmute";
		muted = true;
	} else {
		muteBtn.innerText = "Mute";
		muted = false;
	}
}
async function handleCameraClick() {
	await myStream
		.getVideoTracks()
		.forEach((track) => (track.enabled = !track.enabled));
	if (cameraOff) {
		cameraBtn.innerText = "Turn Camera Off";
		cameraOff = false;
	} else {
		cameraBtn.innerText = "Turn Camera ON";
		cameraOff = true;
	}
}
async function handleCameraChange() {
	await getMedia(camerasSelect.value);
	if (muted) {
		myStream.getAudioTracks().forEach((track) => (track.enabled = false));
	} else {
		myStream.getAudioTracks().forEach((track) => (track.enabled = true));
	}
	if (cameraOff) {
		myStream.getVideoTracks().forEach((track) => (track.enabled = false));
	} else {
		myStream.getVideoTracks().forEach((track) => (track.enabled = true));
	}
	if (myPeerConnection) {
		const videoTrack = myStream.getVideoTracks()[0];
		const videoSender = myPeerConnection
			.getSenders()
			.find((sernder) => sernder.track.kind === "video");
		videoSender.replaceTrack(videoTrack);
	}
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
/* About getMedia() */
/* webRTCDiv Form ( JOIN A ROOM ) */
const startVCBtn = document.getElementById("startVCBtn");
async function initCall() {
	await getMedia();
	makeConnection();
	console.log(roomName);
	socket.emit("nickname", myNickname);
	socket.emit("vc-start", roomName);
}

async function leaveVCRoom(event) {
	event.preventDefault();
	await socket.emit("leaveVCRoom", roomName);
	location.href = "/";
}

async function StartVC() {
	await initCall();
	roomTitleH3.innerText = roomName;
	roomLeaveBtn.addEventListener("click", leaveVCRoom);
}

StartVC();

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
	addMessage(`${value}`, "my-message");
	myDataChannel.send(`${myNickname} : ${value}`);
	input.value = "";
}

msgBtn.addEventListener("click", handleMessageSubmit);

/* WelcomeDiv Form ( JOIN A ROOM ) */
/* Socket Code */
socket.on("welcome", async () => {
	console.log("welcome");
	myDataChannel = myPeerConnection.createDataChannel("chat");
	myDataChannel.addEventListener("message", (event) => {
		console.log("received from datachaneel", event.data);
		addMessage(event.data, "others-message");
	});
	myDataChannel.addEventListener("open", () => {
		console.log("data channel opened");
	});
	myDataChannel.addEventListener("close", () => {
		console.log("data channel closed");
	});
	console.log("made data channel");
	const offer = await myPeerConnection.createOffer();
	myPeerConnection.setLocalDescription(offer);
	console.log("sent the offer");
	socket.emit("offer", offer, roomName);
}); // Peer A
socket.on("offer", async (offer) => {
	myPeerConnection.addEventListener("datachannel", (event) => {
		myDataChannel = event.channel;
		myDataChannel.addEventListener("message", (event) => {
			console.log("received from datachaneel", event.data);
			addMessage(event.data, "others-message");
		});
	});
	console.log("received the offer");
	myPeerConnection.setRemoteDescription(offer);
	const answer = await myPeerConnection.createAnswer();
	myPeerConnection.setLocalDescription(answer);
	socket.emit("answer", answer, roomName);
	console.log("sent the answer");
}); // Peer B
socket.on("answer", (answer) => {
	console.log("received the answer");
	myPeerConnection.setRemoteDescription(answer);
}); // Peer A
socket.on("ice", (ice) => {
	console.log("received candidate");
	myPeerConnection.addIceCandidate(ice);
});
socket.on("leaveRoom", (nickname) => {
	const video = document.getElementById("otherFace");
	video.remove();
	toast(`${nickname} left the room. Redirecting to home page..`);
	setTimeout(() => {
		location.href = "/";
	}, 3000);
});
// RTC Code

function makeConnection() {
	myPeerConnection = new RTCPeerConnection({
		iceServers: [
			{
				urls: [
					"stun:stun.l.google.com:19302",
					"stun:stun1.l.google.com:19302",
					"stun:stun2.l.google.com:19302",
					"stun:stun3.l.google.com:19302",
					"stun:stun4.l.google.com:19302",
				],
			},
		],
	});
	myPeerConnection.addEventListener("icecandidate", handleIce);
	myPeerConnection.addEventListener("addstream", handleAddStream);
	myStream
		.getTracks()
		.forEach((track) => myPeerConnection.addTrack(track, myStream));
}
function handleIce(data) {
	console.log("sent candidate");
	socket.emit("ice", data.candidate, roomName);
}
function handleAddStream(data) {
	console.log("got an stream from my peer");
	console.log("Peer's Stream", data.stream);
	console.log("My Stream", myStream);
	const video = document.getElementById("otherFace");
	video.srcObject = data.stream;
}
