import "./smart-room.js";
import "./smart-quiz.js";

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

function renderList(list, key, element) {
  const listElement = document.getElementById(list);
  listElement.innerHTML = '';
  const items = JSON.parse(localStorage.getItem(key)) || [];
  items.forEach(uuid => {
    const item = document.createElement(element);
    item.uuid = uuid;
    document.getElementById(list).appendChild(item);
  });
}

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
  const message = event.detail;
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
});

async function submit() {
  const quiz = getActiveQuiz();
  const room = getActiveRoom();
  const body = {
    "test_id": quiz.uuid,
    "class_id": room.uuid,
    "name": room.text,
    "students": room.users.map(uuid => {
      const user = JSON.parse(localStorage.getItem(uuid));
      return {
        "id": user.uuid,
        "name": user.text,
        "surname": "",
      };
    }),
    "questions": quiz.questions.map(uuid => {
      const question = JSON.parse(localStorage.getItem(uuid));
      return {
        "id": question.uuid,
        "text": question.text,
        "answers": [],
      };
    }),
  }
  const response = await fetch("/test/record", {
    method: "POST",
    body: JSON.stringify(body),
    mode: "no-cors"
  }).then(body => body.json());

  console.log(response);
}

document.getElementById("submit").addEventListener("click", submit);