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

function getActiveRoom() {
  return document.querySelector('smart-room[active]');
}

document.addEventListener('message', event => {
  const message = e.detail;
  const device = message.split(":")[1];
  const room = getActiveRoom();
  const quiz = getActiveQuiz();
  const option = parseInt(message.split(":")[2], 10);
  if (!room || !quiz) {
    return;
  }
  const user = room.getUserByDevice(device);
  const question = quiz.question
  if (!user || !question) {
    return;
  }
  question.submit({ option, user });

  submit(response) {
    const {
      option,
      user,
    } = response;
    if (user.teacher) {
      this.close(option);
    } else {
      this.responses[user.uuid] = option;
    }
    this.save();
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