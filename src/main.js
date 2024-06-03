import { tests } from "./data";

let currentTestId = null;
let timerInterval;

const sidebar = document.getElementById("sidebar");
const menuItems = sidebar.querySelectorAll("li");
const startTestButtons = document.querySelectorAll(".btn[id^='startTest']");
const resetAnswersBtn = document.getElementById("resetAnswersBtn");
const restartTestBtn = document.getElementById("restartTestBtn");
const finishTestBtn = document.getElementById("finishTestBtn");
const exitTestBtn = document.getElementById("exitTestBtn");
const defaultContent = document.getElementById("defaultContent");
const toggleButton = document.getElementById("toggle-sidebar");
const testResult = document.getElementById("testResult");
const exitConfirmationModal = document.getElementById("exitConfirmationModal");
const closeExitModal = document.getElementById("closeExitModal");
const confirmExit = document.getElementById("confirmExit");
const cancelExit = document.getElementById("cancelExit");
const answeredCountResult = document.getElementById("answeredCountResult");
const totalQuestionsCountResult = document.getElementById(
  "totalQuestionsCountResult"
);
const sidebarMenu = document.getElementById("sidebarMenu");
const sidebarIcon = document.getElementById("sidebarIcon");
const sidebarTitle = document.getElementById("sidebarTitle");
const contentHeader = document.querySelector(".content__header");

finishTestBtn.addEventListener("click", finishTest);

toggleButton.addEventListener("click", toggleSidebar);

menuItems.forEach((item) => {
  item.addEventListener("click", handleMenuItemClick);
});

startTestButtons.forEach((button) => {
  button.addEventListener("click", handleStartTestClick);
});

confirmExit.addEventListener("click", () => {
  closeExitConfirmationModal();
  exitTest();
});

cancelExit.addEventListener("click", closeExitConfirmationModal);

window.addEventListener("click", (event) => {
  if (event.target === exitConfirmationModal) {
    closeExitConfirmationModal();
  }
});

restartTestBtn.addEventListener("click", () => {
  localStorage.removeItem(`testResult${currentTestId}`);
  resetResultsDisplay();
});

function toggleSidebar() {
  sidebarMenu.classList.toggle("menu--collapsed");
  sidebar.classList.toggle("sidebar--collapsed");
  sidebar.classList.toggle("sidebar--expanded");

  if (sidebar.classList.contains("sidebar--collapsed")) {
    sidebarIcon.src = "/src/img/burger-menu.png";
    sidebarTitle.style.display = "none";
  } else {
    sidebarIcon.src = "/src/img/arrow-left.png";
    sidebarTitle.style.display = "block";
  }
}

function handleMenuItemClick(event) {
  const contentId = event.currentTarget.getAttribute("data-content");
  currentTestId = parseInt(contentId.replace("contentTest", ""), 10);

  menuItems.forEach((li) => li.classList.remove("menu__item--selected"));
  event.currentTarget.classList.add("menu__item--selected");

  if (checkSavedResults(currentTestId)) {
    showContent(testResult);
    return;
  }

  showContent(document.getElementById(contentId));
  setCurrentTestId(currentTestId);
}

function handleStartTestClick(event) {
  const buttonId = event.target.id;
  const testId = parseInt(buttonId.replace("startTest", "").replace("Btn", ""));

  if (testId) {
    showContent(document.getElementById("testContent"));

    const questionContainer = document.getElementById("questionContainer");
    const test = tests.find((test) => test.id === currentTestId);
    if (test) {
      updateContentHeaderForTest(test.name);
      populateQuestions(questionContainer, test.questions);
      startTimer(test.duration);
    }
  }
}

function showContent(contentToShow) {
  document.querySelectorAll(".content").forEach((section) => {
    section.classList.remove("content--active");
  });
  defaultContent.classList.remove("content--default");
  contentToShow.classList.add("content--active");
}

function setCurrentTestId(testId) {
  currentTestId = testId;
}

function updateContentHeaderForTest(testName) {
  contentHeader.innerHTML = `
    <button id="exitTestBtn" class="btn">Выход</button>
    <span id="headerTestName">${testName}</span>
    <div class="header__right">
      <button id="resetAnswersBtn" class="btn">Сбросить ответы</button>
      <span id="headerCount"><span id="answeredCount">0</span>/<span id="totalQuestionsCount">5</span></span>
      <span id="headerTimer">Оставшееся время: <span id="timeLeft"></span></span>
    </div>
  `;
  document
    .getElementById("exitTestBtn")
    .addEventListener("click", showExitConfirmationModal);
  document
    .getElementById("resetAnswersBtn")
    .addEventListener("click", resetAnswers);
}

function resetContentHeader() {
  contentHeader.innerHTML = "Описание";
}

function populateQuestions(container, questions) {
  let questionsHtml = "";
  questions.forEach((question, index) => {
    questionsHtml += `<div class="question-container">
                        <h3>${question.question}</h3>
                        <div class="options-container">
                          ${question.options
                            .map(
                              (option, i) => `
                            <div class="test__question">
                              <input type="radio" id="question${index}option${i}" name="question${index}" value="${i}">
                              <label for="question${index}option${i}">${option}</label>
                            </div>
                          `
                            )
                            .join("")}
                        </div>
                      </div>`;
  });
  container.innerHTML = questionsHtml;

  container.querySelectorAll("input[type='radio']").forEach((input) => {
    input.addEventListener("change", () => {
      updateQuestionCounter(questions.length);
    });
  });

  document.getElementById("totalQuestionsCount").textContent = questions.length;
}

function resetAnswers() {
  document.querySelectorAll("input[type='radio']").forEach((input) => {
    input.checked = false;
  });
  updateQuestionCounter(
    document.querySelectorAll(".question-container").length
  );
}

function updateQuestionCounter(totalQuestionsCount) {
  const answeredCount = document.querySelectorAll(
    "input[type='radio']:checked"
  ).length;
  document.getElementById("answeredCount").textContent = answeredCount;
  document.getElementById("totalQuestionsCount").textContent =
    totalQuestionsCount;
}

function startTimer(duration) {
  const timerElement = document.getElementById("timeLeft");
  let timeLeft = duration;

  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    timerElement.textContent = `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      finishTest();
    } else {
      timeLeft--;
    }
  }, 1000);
}

function finishTest() {
  if (currentTestId !== null) {
    const test = tests.find((test) => test.id === currentTestId);
    if (test) {
      const answers = test.questions.map((question, index) => {
        const selectedOption = document.querySelector(
          `input[name="question${index}"]:checked`
        );
        return selectedOption ? parseInt(selectedOption.value) : null;
      });

      const results = {
        testId: currentTestId,
        answers: answers,
      };

      localStorage.setItem(
        `testResult${currentTestId}`,
        JSON.stringify(results)
      );
      showTestResult(results);

      clearInterval(timerInterval);
      resetContentHeader();
    }
  }
}

function exitTest() {
  showContent(defaultContent);
  resetContentHeader();
  clearInterval(timerInterval);
}

function showExitConfirmationModal() {
  exitConfirmationModal.style.display = "flex";
}

function closeExitConfirmationModal() {
  exitConfirmationModal.style.display = "none";
}

function checkSavedResults(testId) {
  const savedResult = localStorage.getItem(`testResult${testId}`);
  if (savedResult) {
    const resultData = JSON.parse(savedResult);
    showTestResult(resultData);
    return true;
  }
  return false;
}

function showTestResult(resultData) {
  const test = tests.find((test) => test.id === resultData.testId);
  if (test) {
    answeredCountResult.innerHTML = resultData.answers.filter(
      (item) => item !== null
    ).length;
    totalQuestionsCountResult.innerHTML = resultData.answers.length;
    const resultContainer = document.getElementById("resultContainer");
    resultContainer.innerHTML = test.questions
      .map((question, index) => {
        const correctAnswer = question.correct;
        const userAnswer = resultData.answers[index];
        return `<div class="result-container">
                <p><strong>${question.question}</strong></p>
                <p>Правильный ответ: ${question.options[correctAnswer]}.</p>
                <p>Вы ответили: ${
                  question.options[userAnswer] || "Не ответили"
                }.</p>
              </div>`;
      })
      .join("");
    showContent(testResult);
  }
}

function resetResultsDisplay() {
  answeredCountResult.innerHTML = "";
  totalQuestionsCountResult.innerHTML = "0";
  document.getElementById("resultContainer").innerHTML = "";

  resetContentHeader();
  currentTestId = null;

  showContent(defaultContent);
}
