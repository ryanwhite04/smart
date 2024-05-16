import { css, html, LitElement } from "https://esm.sh/lit@3.1.2";

class SmartQuiz extends LitElement {
  static get properties() {
    return {
      name: { type: String },
      questions: { type: Array },
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
    this.name = "";
    this.questions = [];
  }

  addQuestion() {
    const questionText = prompt("Enter the question:");
    if (questionText) {
      const question = document.createElement("smart-question");
      const questionSlot = document.createElement("p");
      questionSlot.slot = "question";
      questionSlot.textContent = questionText;
      question.appendChild(questionSlot);
      question.addEventListener(
        "remove-question",
        (e) => this.removeQuestion(e.detail),
      );
      this.questions = [...this.questions, question];
      this.requestUpdate();
    }
  }

  removeQuestion(question) {
    this.questions = this.questions.filter((q) => q !== question);
    this.requestUpdate();
  }

  render() {
    return html`
        <details class="quiz-details">
            <summary>${this.name}</summary>
            <button @click="${this.addQuestion}">Add Question</button>
            <div class="questions">
            ${this.questions.map((question) => html`${question}`)}
            </div>
        </details>
        `;
  }
}

customElements.define("smart-quiz", SmartQuiz);
