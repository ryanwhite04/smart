import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartQuiz extends LitElement {
  static get properties() {
    return {
      uuid: { type: String },
      name: { type: String },
      questions: { type: Array },
      active: { type: Boolean },
    };
  }

  static get styles() {
    return css`
        :host {
            display: block;
            margin: 1em 0;
        }
        .quiz-details {
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
    this.name = '';
    this.questions = [];
    this.active = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.uuid) {
      this.loadQuizData();
      this.addToLocalStorage();
    }
  }

  addToLocalStorage() {
    const quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
    if (!quizzes.includes(this.uuid)) {
      quizzes.push(this.uuid);
      localStorage.setItem('quizzes', JSON.stringify(quizzes));
    }
    this.saveQuizData();
  }

  loadQuizData() {
    const quizData = JSON.parse(localStorage.getItem(this.uuid));
    if (quizData) {
      this.name = quizData.name;
      this.questions = quizData.questions;
      this.active = quizData.active;
    }
  }

  saveQuizData() {
    const quizData = {
      uuid: this.uuid,
      name: this.name,
      questions: this.questions,
      active: this.active
    };
    localStorage.setItem(this.uuid, JSON.stringify(quizData));
  }

  addQuestion() {
    const questionText = prompt("Enter the question:");
    if (questionText) {
      const question = document.createElement('smart-question');
      question.text = questionText;
      this.appendChild(question);
      this.questions.push(question.uuid);
      this.saveQuizData();
      this.requestUpdate();
    }
  }

  removeQuestion(questionUUID) {
    this.questions = this.questions.filter(uuid => uuid !== questionUUID);
    localStorage.removeItem(questionUUID);
    this.saveQuizData();
    this.requestUpdate();
  }

  render() {
    return html`
        <details class="quiz-details">
            <summary>${this.name}</summary>
            <button @click="${this.addQuestion}">Add Question</button>
            <div class="questions">
            ${this.questions.map(uuid => html`<smart-question uuid="${uuid}" @remove-question="${() => this.removeQuestion(uuid)}"></smart-question>`)}
            </div>
        </details>
        `;
  }

  firstUpdated() {
    if (this.uuid) {
      this.loadQuizData();
    }
  }
}

customElements.define("smart-quiz", SmartQuiz);
