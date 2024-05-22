import './smart-quiz.js';
import './smart-device.js';

const tests = document.getElementById("tests");
const device = document.getElementById("device");

tests.addEventListener("change-room", handleRoomChange);
device.addEventListener("message", e => handleMessage(e.detail));

function handleRoomChange(event) {
  console.log("room change", event.detail);
}

tests.addEventListener("open", event => {
  console.log("open", event.detail);
  device.write(`o:${event.detail}`);
  device.write(`l:0:255:255`);
})

function handleMessage(message) {
    console.log("message", message);
    if (!message.startsWith("a")) return;
    const device = message.split(":")[1];
    const activeQuiz = tests.shadowRoot.querySelector("smart-quiz[active]");
    if (!activeQuiz) {
        return;
    }
    const option = parseInt(message.split(":")[2], 10);
    activeQuiz.recordResponse(device, option);
}