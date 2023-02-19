const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const callDiv = document.getElementById("call");
callDiv.hidden = true;
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
/** @type {RTCPeerConnection} */
let myPeerConnection;
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
function handleMuteClick() {
	myStream
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
function handleCameraClick() {
	myStream
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
/* WelcomeDiv Form ( JOIN A ROOM ) */
const welcomeDiv = document.getElementById("welcome");
const welcomeForm = welcomeDiv.querySelector("form");
async function initCall() {
	welcomeDiv.hidden = true;
	callDiv.hidden = false;
	await getMedia();
	makeConnection();
}
async function handleWelcomeSubmit(event) {
	event.preventDefault();
	const roomInput = welcomeForm.querySelector("input");
	await initCall();
	socket.emit("join_room", roomInput.value);
	roomName = roomInput.value;
	roomInput.value = "";
}
welcomeForm.addEventListener("submit", handleWelcomeSubmit);
/* WelcomeDiv Form ( JOIN A ROOM ) */
/* Socket Code */
socket.on("welcome", async () => {
	const offer = await myPeerConnection.createOffer();
	myPeerConnection.setLocalDescription(offer);
	console.log("sent the offer");
	socket.emit("offer", offer, roomName);
}); // Peer A
socket.on("offer", async (offer) => {
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
	const video = document.createElement("video");
	document.getElementById("othersStream").appendChild(video);
	video.srcObject = data.stream;
	video.autoplay = true;
	video.playsInline = true;
	video.style.backgroundColor = "blue";
	video.width = 400;
	video.height = 400;
}
