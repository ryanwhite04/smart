import "./smart-room.js";
import "./smart-quiz.js";
import "./smart-question.js";
import "./smart-user.js";
import "./smart-device.js";

const device = document.getElementById("device");

function addQuestionCallbacks(question) {
  question.addEventListener("open", (e) => {
    const length = e.target.length;
    device.write("open " + length);
  });
  question.addEventListener("close", (e) => {
    console.log("question closed");
    submitQuestion(e.detail);
    device.write("close");
  });
}

[...document.getElementsByTagName("smart-question")].forEach(addQuestionCallbacks);

function add(component) {
  const element = document.createElement(component);
  if (component === "smart-question") {
    addQuestionCallbacks(element);
  }
  return (event) => {
    console.log(event);
    event.target.parentElement.appendChild(element);
  };
}

const addRoom = () => {
  const roomName = prompt("Enter room name:");
  if (roomName) {
    const room = document.createElement('smart-room');
    room.name = roomName;
    document.getElementById('room-list').appendChild(room);
  }
};

const addQuiz = () => {
  const quizName = prompt("Enter quiz name:");
  if (quizName) {
    const quiz = document.createElement('smart-quiz');
    quiz.name = quizName;
    document.getElementById('quiz-list').appendChild(quiz);
  }
};

document.getElementById('add-room').addEventListener('click', addRoom);
document.getElementById('add-quiz').addEventListener('click', addQuiz);

function handleIncomingMessage(message) {
  const [uuid, , optionNumber] = message.split(' ');
  const user = document.querySelector(`smart-user[uuid="${uuid}"]`);
  if (user) {
    const question = document.querySelector('smart-question[opened]');
    if (question) {
      question.handleResponse(uuid, parseInt(optionNumber, 10), user.teacher);
    }
  }
}

device.addEventListener('message', (e) => handleIncomingMessage(e.data));

function submitQuestion(question) {
  console.log("submit question");
  const body = question.json;
  console.log(body);
  fetch("http://localhost:5000/post", {
    method: "POST",
    body: JSON.stringify(body),
    mode: "no-cors"
  });
}