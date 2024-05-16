import "./smart-room.js";
import "./smart-quiz.js";
import "./smart-question.js";
import "./smart-user.js";
import "./smart-device.js";

// Add a new room
const addRoom = () => {
  const roomName = prompt("Enter room name:");
  if (roomName) {
    const room = document.createElement('smart-room');
    room.name = roomName;
    document.getElementById('room-list').appendChild(room);
  }
};

// Add a new quiz
const addQuiz = () => {
  const quizName = prompt("Enter quiz name:");
  if (quizName) {
    const quiz = document.createElement('smart-quiz');
    quiz.name = quizName;
    document.getElementById('quiz-list').appendChild(quiz);
  }
};

// Render rooms
function renderRooms() {
  const roomList = document.getElementById('room-list');
  roomList.innerHTML = '';
  const rooms = JSON.parse(localStorage.getItem('rooms')) || [];
  rooms.forEach(roomUUID => {
    const room = document.createElement('smart-room');
    room.uuid = roomUUID;
    document.getElementById('room-list').appendChild(room);
  });
}

// Render quizzes
function renderQuizzes() {
  const quizList = document.getElementById('quiz-list');
  quizList.innerHTML = '';
  const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
  quizzes.forEach(quizUUID => {
    const quiz = document.createElement('smart-quiz');
    quiz.uuid = quizUUID;
    document.getElementById('quiz-list').appendChild(quiz);
  });
}

document.getElementById('add-room').addEventListener('click', addRoom);
document.getElementById('add-quiz').addEventListener('click', addQuiz);

window.addEventListener('load', () => {
  renderRooms();
  renderQuizzes();
});

// Handle incoming messages
const device = document.getElementById("device");

device.addEventListener('message', (e) => {
  const [deviceId, , optionNumber] = e.data.split(' ');
  const user = Array.from(document.querySelectorAll('smart-user')).find(user => user.deviceId === deviceId);
  if (user) {
    const question = document.querySelector('smart-question[opened]');
    if (question) {
      question.handleResponse(user.uuid, parseInt(optionNumber, 10), user.teacher);
    }
  }
});

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