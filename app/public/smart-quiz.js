import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";
import "./smart-question.js";
import "./smart-room.js";
import SmartBase from "./smart-base.js";

export class SmartQuizzes extends SmartBase {

  select(event) {
    this.item = event.detail;
    this.save();
  }

  renderItem(uuid) {
    return html`
      <smart-quiz
        uuid="${uuid}"
        ?debug=${this.debug}
        ?active=${this.item === uuid}
        @active=${this.select.bind(this)}
        type="question"
        @open=${e => this.fire('open', e.detail)}
      ></smart-quiz>
    `;
  }
  
}

export class SmartQuiz extends SmartBase {

  static properties = {
    ...SmartBase.properties,
    room: { type: String },
  };

  constructor() {
    super();
    this.room = '';
  }

  get rooms() {
    const uuids = JSON.parse(localStorage.getItem("room")).items || [];
    return uuids.map(uuid => JSON.parse(localStorage.getItem(uuid)));
  }

  select(event) {
    this.item = event.detail;
    this.save();
  }

  selectRoom(event) {
    this.room = event.target.value;
    this.dispatchEvent(new CustomEvent("change-room", { detail: this.room }));
    this.save();
  }

  open(event) {
    this.dispatchEvent(new CustomEvent("open", { detail: event.detail }));
  }
  
  renderItem(uuid) {
    return html`
      <smart-question
        uuid="${uuid}"
        ?debug=${this.debug}
        ?active=${this.item === uuid}
        @active=${this.select.bind(this)}
        @open=${e => this.fire('open', e.detail)}
      ></smart-question>
    `;
  }

  recordResponse(device, option) {
    const user = this.class.students.find(student => student.device === device);
    const question = this.questions.find(question => question.active);
    question.submit({ option, user });
  }

  get questions() {
    return this.items.map(uuid => this.shadowRoot.querySelector(`smart-question[uuid="${uuid}"]`));
  }

  get class() {
    const room = this.rooms.find(room => room.uuid === this.room);
    room.students = room.items.map(uuid => JSON.parse(localStorage.getItem(uuid)))
    return room;
  }

  async submit() {
    const room = this.class;
    const body = {
      "test_id": this.uuid,
      "class_id": room.uuid,
      "name": this.text,
      "students": room.students.map(student => {
        return {
          "id": student.uuid,
          "name": student.text,
          "surname": "",
        };
      }),
      "questions": this.questions.map(question => {
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
    }).then(body => body.json());
  
    console.log(response);
  }

  renderContent() {
    return html`
      <select @change=${this.selectRoom.bind(this)}>
        <option value="">Select a room</option>
        ${this.rooms.map(room => html`
          <option value="${room.uuid}">${room.text}</option>
        `)}
      </select>
      <button @click=${this.submit.bind(this)}>Submit</button>
    `;
  
  }
}

customElements.define("smart-quiz", SmartQuiz);
customElements.define("smart-quizzes", SmartQuizzes);
