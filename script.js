const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const year = document.getElementById("year");
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const authForm = document.getElementById("authForm");
const authStatus = document.getElementById("authStatus");
const examForm = document.getElementById("examForm");
const examStatus = document.getElementById("examStatus");
const teacherForm = document.getElementById("teacherForm");
const teacherStatus = document.getElementById("teacherStatus");

const QUESTION_BANK_STORAGE_KEY = "schoolSmartQuestionBank";
const TOTAL_QUESTIONS_PER_SUBJECT = 10000;
const QUESTIONS_PER_EXAM = 10;
const OPTION_VALUES = ["a", "b", "c", "d"];
const DEFAULT_OPTION_LABELS = [
  "Define the requirement clearly",
  "Ignore planning and start coding",
  "Skip testing completely",
  "Deploy without validation",
];

const buildQuestionBankKey = (level, subject, assessmentType = "exam") =>
  `${assessmentType}|${level}|${subject}`;

const loadQuestionBank = () => {
  try {
    const raw = localStorage.getItem(QUESTION_BANK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

const saveQuestionBank = (bank) => {
  localStorage.setItem(QUESTION_BANK_STORAGE_KEY, JSON.stringify(bank));
};

const getRandomUniqueIndices = (max, count) => {
  const picked = new Set();
  while (picked.size < count) {
    const value = Math.floor(Math.random() * max) + 1;
    picked.add(value);
  }
  return [...picked];
};

const pickRandomQuestions = (pool, count) => {
  if (!Array.isArray(pool) || pool.length === 0) return [];

  if (pool.length >= count) {
    const indices = getRandomUniqueIndices(pool.length, count);
    // getRandomUniqueIndices uses 1..max, so subtract 1
    return indices.map((i) => pool[i - 1]);
  }

  // Not enough questions: allow repeats to still show an exam
  const selected = [];
  for (let i = 0; i < count; i++) {
    selected.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return selected;
};

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formStatus.textContent = "Thanks! Your message has been received.";
    contactForm.reset();
  });
}

if (authForm && authStatus) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const mode = authForm.dataset.mode || "login";
    authStatus.textContent =
      mode === "register"
        ? "Registration successful. You can now open the dashboard."
        : "Login successful. Redirecting to dashboard...";
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 900);
  });
}

if (examForm && examStatus) {
  const subjectSelect = examForm.querySelector('select[name="subject"]');
  const levelSelect = examForm.querySelector('select[name="level"]');
  const assessmentTypeSelect = examForm.querySelector(
    'select[name="assessmentType"]'
  );
  const questionsContainer = document.getElementById("questionsContainer");

  const getCorrectOption = (questionIndex) =>
    OPTION_VALUES[questionIndex % OPTION_VALUES.length];

  const renderQuestions = () => {
    if (!questionsContainer) return;
    const subject = (subjectSelect && subjectSelect.value) || "";
    const level = (levelSelect && levelSelect.value) || "";
    const assessmentType =
      (assessmentTypeSelect && assessmentTypeSelect.value) || "exam";
    questionsContainer.innerHTML = "";
    if (!subject || !level) return;

    const bankKey = buildQuestionBankKey(level, subject, assessmentType);
    const bank = loadQuestionBank();
    let savedPool = bank[bankKey] || [];
    // Backward compatibility: older version stored keys as `${level}|${subject}`
    if (!savedPool.length && assessmentType === "exam") {
      savedPool = bank[`${level}|${subject}`] || [];
    }

    let questionsToRender = [];

    if (savedPool && savedPool.length > 0) {
      // Use teacher-uploaded question pool (random sample)
      questionsToRender = pickRandomQuestions(savedPool, QUESTIONS_PER_EXAM);
    } else {
      // Teacher uploaded nothing: generate fallback questions.
      const randomIndices = getRandomUniqueIndices(
        TOTAL_QUESTIONS_PER_SUBJECT,
        QUESTIONS_PER_EXAM
      );

      questionsToRender = randomIndices.map((questionIndex) => {
        const correctOption = getCorrectOption(questionIndex);
        return {
          text: `(${subject}) Software development scenario #${questionIndex}: What is the best first step in software development?`,
          options: {
            a: DEFAULT_OPTION_LABELS[0],
            b: DEFAULT_OPTION_LABELS[1],
            c: DEFAULT_OPTION_LABELS[2],
            d: DEFAULT_OPTION_LABELS[3],
          },
          correct: correctOption,
        };
      });
    }

    questionsToRender.forEach((q, index) => {
      const wrapper = document.createElement("label");
      const questionNo = index + 1;
      const correctOption = q.correct;
      wrapper.innerHTML = `
        ${questionNo}) ${q.text}
        <select name="q${questionNo}" data-question="true" data-correct="${correctOption}" required>
          <option value="">Choose</option>
          <option value="a">${q.options.a}</option>
          <option value="b">${q.options.b}</option>
          <option value="c">${q.options.c}</option>
          <option value="d">${q.options.d}</option>
        </select>
      `;
      questionsContainer.appendChild(wrapper);
    });
  };

  if (subjectSelect) {
    subjectSelect.addEventListener("change", renderQuestions);
  }
  if (levelSelect) {
    levelSelect.addEventListener("change", renderQuestions);
  }

  renderQuestions();

  examForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const answers = new FormData(examForm);
    const level = answers.get("level");
    const subject = answers.get("subject");
    const assessmentType = answers.get("assessmentType") || "exam";
    const assessmentTypeLabel =
      assessmentType === "small_test"
        ? "Small Test"
        : assessmentType === "homework"
          ? "Homework"
          : assessmentType === "test"
            ? "Test"
            : "Exam";
    const questionInputs = examForm.querySelectorAll('select[data-question="true"]');

    let score = 0;
    questionInputs.forEach((input) => {
      const selected = answers.get(input.name);
      const correct = input.dataset.correct;
      if (selected === correct) score += 1;
    });

    const totalQuestions = questionInputs.length;
    const examName = `${level} ${assessmentTypeLabel} ${subject}`;
    const date = new Date().toISOString().slice(0, 10);
    localStorage.setItem("schoolSmartExamName", examName);
    localStorage.setItem("schoolSmartExamDate", date);
    localStorage.setItem("schoolSmartScore", String(score));
    localStorage.setItem("schoolSmartTotalQuestions", String(totalQuestions));
    examStatus.textContent = `${examName} submitted successfully. Score: ${score}/${totalQuestions}.`;
    setTimeout(() => {
      window.location.href = "results.html";
    }, 900);
  });
}

// Teacher: upload question bank
if (teacherForm && teacherStatus) {
  const questionInput = document.getElementById("questionInput");
  const clearBtn = document.getElementById("clearQuestionBankBtn");
  const replaceExistingCheckbox = document.getElementById("replaceExisting");

  const updateTeacherStatus = (msg) => {
    teacherStatus.textContent = msg;
  };

  const parseUploadedQuestions = (rawText) => {
    if (!rawText) return [];

    // Format per line:
    // questionText|optionA|optionB|optionC|optionD|correct(a|b|c|d)
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));

    const parsed = [];
    for (const line of lines) {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 6) continue;

      const [text, a, b, c, d, correctRaw] = parts;
      const correct = (correctRaw || "").toLowerCase();
      if (!text) continue;
      if (!OPTION_VALUES.includes(correct)) continue;

      parsed.push({
        text,
        options: { a, b, c, d },
        correct,
      });
    }

    return parsed;
  };

  teacherForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const answers = new FormData(teacherForm);
    const level = answers.get("level");
    const subject = answers.get("subject");
    const assessmentType = answers.get("assessmentType") || "exam";

    if (!level || !subject) {
      updateTeacherStatus("Please select level and subject.");
      return;
    }

    const rawText = questionInput ? questionInput.value : "";
    const replaceExisting = replaceExistingCheckbox
      ? replaceExistingCheckbox.checked
      : true;

    const parsedQuestions = parseUploadedQuestions(rawText);
    if (parsedQuestions.length === 0) {
      updateTeacherStatus(
        "No valid questions found. Use: question|a|b|c|d|correct"
      );
      return;
    }

    const bank = loadQuestionBank();
    const bankKey = buildQuestionBankKey(
      level,
      subject,
      assessmentType || "exam"
    );
    const existing = bank[bankKey] || [];

    const nextPool = replaceExisting
      ? parsedQuestions
      : existing.concat(parsedQuestions);

    bank[bankKey] = nextPool.slice(0, TOTAL_QUESTIONS_PER_SUBJECT);
    saveQuestionBank(bank);

    updateTeacherStatus(
      `Saved ${bank[bankKey].length} questions for ${level} ${subject}.`
    );
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      const answers = new FormData(teacherForm);
      const level = answers.get("level");
      const subject = answers.get("subject");
      const assessmentType = answers.get("assessmentType") || "exam";

      if (!level || !subject) {
        updateTeacherStatus("Select level and subject first.");
        return;
      }

      const bank = loadQuestionBank();
      const bankKey = buildQuestionBankKey(level, subject, assessmentType);
      bank[bankKey] = [];
      saveQuestionBank(bank);
      updateTeacherStatus(`Cleared questions for ${level} ${subject}.`);
    });
  }
}

const resultScore = document.getElementById("resultScore");
const resultScoreTable = document.getElementById("resultScoreTable");
const resultExamName = document.getElementById("resultExamName");
const resultExamNameTable = document.getElementById("resultExamNameTable");
const resultDateTable = document.getElementById("resultDateTable");
if (resultScore) {
  const score = localStorage.getItem("schoolSmartScore") || "0";
  const totalQuestions =
    localStorage.getItem("schoolSmartTotalQuestions") || "10";
  const examName = localStorage.getItem("schoolSmartExamName") || "No exam yet";
  const examDate = localStorage.getItem("schoolSmartExamDate") || "-";
  resultScore.textContent = `${score}/${totalQuestions}`;
  if (resultExamName) {
    resultExamName.textContent = examName;
  }
  if (resultScoreTable) {
    resultScoreTable.textContent = `${score}/${totalQuestions}`;
  }
  if (resultExamNameTable) {
    resultExamNameTable.textContent = examName;
  }
  if (resultDateTable) {
    resultDateTable.textContent = examDate;
  }
}
