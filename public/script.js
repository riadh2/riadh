const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;
let start = document.getElementById('start'),
    stop  = document.getElementById('stop'),
    mediaRecorder;
let videoTrack,audioTrack ;    
    backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});


const user = prompt("Enter your name");


async function recordScreen() {
  return await navigator.mediaDevices.getDisplayMedia({
      audio: true, 
      video: { mediaSource: "screen"}
  });
}

function createRecorder (stream, mimeType) {
// the stream data is stored in this array
let recordedChunks = []; 

const mediaRecorder = new MediaRecorder(stream);

mediaRecorder.ondataavailable = function (e) {
  if (e.data.size > 0) {
    recordedChunks.push(e.data);
  }  
};
mediaRecorder.onstop = function () {
   saveFile(recordedChunks);
   recordedChunks = [];
};
mediaRecorder.start(200); // For every 200ms the stream data will be stored in a separate chunk.
return mediaRecorder;
}

start.addEventListener('click', async function(){
  let stream = await recordScreen();
  let mimeType = 'video/mp4';
  mediaRecorder = createRecorder(stream, mimeType);
let node = document.createElement("p");
  node.textContent = "Started recording";
  document.body.appendChild(node);
})

stop.addEventListener('click', function(){
  mediaRecorder.stop();
  let node = document.createElement("p");
  node.textContent = "Stopped recording";
  document.body.appendChild(node);
})

async function recordScreen() {
    return await navigator.mediaDevices.getDisplayMedia({
        audio: true, 
        video: { mediaSource: "screen"}
    }).then(async displayStream => {
      [videoTrack] = displayStream.getVideoTracks();
      const audioStream = await navigator.mediaDevices.getUserMedia({audio: true}).catch(e => {throw e});
      [audioTrack] = audioStream.getAudioTracks();
      displayStream.addTrack(audioTrack); // do stuff
      // or 
      // stream = new MediaStream([videoTrack, audioTrack]); // do stuff
      return displayStream
  })
  .catch(console.error);
}

function saveFile(recordedChunks){

 const blob = new Blob(recordedChunks, {
    type: 'video/mp4'
  });
  let filename = window.prompt('Enter file name'),
      downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${filename}.mp4`;

  document.body.appendChild(downloadLink);
  downloadLink.click();
  URL.revokeObjectURL(blob); // clear from memory
  document.body.removeChild(downloadLink);
}
var peer = new Peer(undefined, {
  path: "/myapp",
  host: "/",
});
let myVideoStream;
let peers={}
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    
    
    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  });

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close',()=>{
    video.remove()
  })
  peers[userId]=call
};

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, user);
});
socket.on("user-disconnected",userId =>{
  if(peers[userId])peers[userId].close()
})

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});
