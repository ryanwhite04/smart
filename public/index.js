import "./smart-room.js";
import "./smart-quiz.js";
import "./smart-question.js";
import "./smart-user.js";
import "./smart-device.js";

// Add a new room
function addRoom() {
    const room = document.createElement('smart-room');
    document.getElementById('room-list').appendChild(room);
  const rooms = JSON.parse(localStorage.getItem('rooms')) || [];
  rooms.push(room.uuid);
  localStorage.setItem('rooms', JSON.stringify(rooms));
};

// Add a new quiz
function addQuiz() {
    const quiz = document.createElement('smart-quiz');
    document.getElementById('quiz-list').appendChild(quiz);
  const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
  quizzes.push(quiz.uuid);
  localStorage.setItem('quizzes', JSON.stringify(quizzes));
};

function renderList(list, key, elment) {
  const listElement = document.getElementById(list);
  listElement.innerHTML = '';
  const items = JSON.parse(localStorage.getItem(key)) || [];
  items.forEach(uuid => {
    const item = document.createElement(element);
    item.uuid = uuid;
    document.getElementById(list).appendChild(item);
  });


document.getElementById('add-room').addEventListener('click', addRoom);
document.getElementById('add-quiz').addEventListener('click', addQuiz);

window.addEventListener('load', () => {
  renderList('room-list', 'rooms', 'smart-room');
  renderList('quiz-list', 'quizzes', 'smart-quiz');
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