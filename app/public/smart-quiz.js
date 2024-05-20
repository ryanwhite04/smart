import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";
import "./smart-question.js";

class SmartQuiz extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      text: { type: String },
      questions: { type: Array },
      active: { type: Boolean, reflect: true },
    };
  }

  static get styles() {
    return css`
        :host {
          display: block;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        details[open] summary {
          padding-bottom: 16px;
        }
        .details {
            padding: 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #FFAAAA;
        }
        .questions {
            display: flex;
            flex-direction: column;
        }
        `;
  }

  constructor() {
    super();
    this.uuid = this.uuid || crypto.randomUUID();
    this.text = '';
    this.questions = [];
    this.active = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.uuid) {
      this.load();
      this.save();
    }
  }

  load() {
    const data = JSON.parse(localStorage.getItem(this.uuid));
    if (data) {
      for (const key in data) {
        this[key] = data[key];
      }
    }
    this.requestUpdate();
  }

  save() {
    const data = {};
    for (const key in this.constructor.properties) {
      data[key] = this[key];
    }
    localStorage.setItem(this.uuid, JSON.stringify(data));
    this.requestUpdate();
  }

  addQuestion() {
    const text = prompt("Enter question");
    if (text) {
      const question = document.createElement('smart-question');
      question.setAttribute("text", text);
      this.appendChild(question);
      this.questions.push(question.uuid);
      this.save();
    }
  }

  removeQuestion(event) {
    const question = event.target;
    this.questions = this.questions.filter(uuid => uuid !== question.uuid);
    localStorage.removeItem(question.uuid);
    this.save();
  }

  firstUpdated() {
    if (this.uuid) {
      this.load();
    }
  }

  toggle(event) {
    this.active = event.target.open;
    this.save();
  }

  render() {
    return html`
        <details @toggle=${this.toggle.bind(this)} ?open=${this.active}>
            <summary>${this.text}</summary>
            <button @click="${this.addQuestion}">Add Question</button>
            <div class="questions">
            ${this.questions.map(uuid => html`<smart-question uuid="${uuid}" @remove-question="${this.removeQuestion.bind(this)}"></smart-question>`)}
            </div>
        </details>
        `;
  }
 
}

customElements.define("smart-quiz", SmartQuiz);
