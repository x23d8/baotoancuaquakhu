(() => {
  "use strict";

  const QUESTIONS = [
    {
      id: "wto", year: "2006", answer: "WTO", answerPlain: "WTO", keyIndex: 1, keyLetter: "T",
      question: "Tháng 11/2006, Đại hội đồng của tổ chức nào đã thông qua việc Việt Nam gia nhập, mở đường để nước ta trở thành thành viên thứ 150?",
      hint: "Tên viết tắt bằng 3 chữ cái tiếng Anh của Tổ chức Thương mại Thế giới.",
      fact: "Việt Nam được thông qua gia nhập WTO ngày 07/11/2006 và chính thức trở thành thành viên thứ 150 ngày 11/01/2007."
    },
    {
      id: "tu-nhan", year: "2006", answer: "TƯ NHÂN", answerPlain: "TU NHAN", keyIndex: 1, keyLetter: "Ự",
      question: "Đại hội X cho phép đảng viên làm kinh tế gì, với điều kiện chấp hành Điều lệ Đảng, pháp luật và quy định của Trung ương?",
      hint: "Thành phần kinh tế dựa trên sở hữu của cá nhân hoặc tổ chức ngoài khu vực nhà nước.",
      fact: "Quyết định này góp phần tháo gỡ rào cản nhận thức và khơi thông thêm nguồn lực phát triển trong nước."
    },
    {
      id: "tri-thuc", year: "2001", answer: "TRÍ THỨC", answerPlain: "TRI THUC", keyIndex: 6, keyLetter: "C",
      question: "Đại hội IX xác định công nghiệp hóa, hiện đại hóa rút ngắn phải gắn với phát triển nền kinh tế nào?",
      hint: "Nền kinh tế lấy chất xám, công nghệ và thông tin làm nguồn lực trực tiếp. Kinh tế…",
      fact: "Kinh tế tri thức thể hiện yêu cầu tận dụng thành tựu khoa học – công nghệ để rút ngắn quá trình công nghiệp hóa, hiện đại hóa."
    },
    {
      id: "day-manh", year: "1996", answer: "ĐẨY MẠNH", answerPlain: "DAY MANH", keyIndex: 6, keyLetter: "H",
      question: "Đại hội VIII tuyên bố kết thúc chặng đường chuẩn bị tiền đề và chuyển đất nước sang thời kỳ mới: … công nghiệp hóa, hiện đại hóa.",
      hint: "Cụm từ thể hiện sự tăng tốc, trái với trì hoãn hoặc chỉ dừng ở chuẩn bị.",
      fact: "“Đẩy mạnh” đánh dấu sự thay đổi trọng tâm: từ tạo lập tiền đề sang tăng tốc công nghiệp hóa, hiện đại hóa đất nước."
    },
    {
      id: "chu-dong", year: "2001", answer: "CHỦ ĐỘNG", answerPlain: "CHU DONG", keyIndex: 2, keyLetter: "Ủ",
      question: "Đại hội IX nâng tầm tư thế đối ngoại bằng phương châm “… và tích cực hội nhập kinh tế quốc tế”. Từ còn thiếu là gì?",
      hint: "Tư thế tự mình chuẩn bị, tự quyết và không thụ động chờ tác động từ bên ngoài.",
      fact: "Từ “mở rộng quan hệ”, Việt Nam chuyển sang tư thế chủ động, tích cực tham gia sâu hơn vào đời sống kinh tế quốc tế."
    }
  ];

  const KEYWORD = "TU CHU";
  const KEYWORD_DISPLAY = ["T", "Ự", "C", "H", "Ủ"];
  const PIVOT_COLUMN = 7;
  const root = document.querySelector("#root");
  const state = {
    activeId: null,
    completed: new Set(),
    selectedIds: [],
    showHint: false,
    feedback: null,
    showKeywordForm: false,
    keywordGuess: "",
    keywordResult: null
  };

  const compact = (value = "") => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/đ/g, "d").replace(/\s/g, "").toUpperCase();
  const icon = (value, label = "") => `<span class="ui-icon"${label ? ` role="img" aria-label="${label}"` : " aria-hidden=\"true\""}>${value}</span>`;

  function makeTiles(question) {
    const letters = compact(question.answerPlain).split("");
    let seed = question.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    for (let index = letters.length - 1; index > 0; index -= 1) {
      seed = (seed * 9301 + 49297) % 233280;
      const target = Math.floor((seed / 233280) * (index + 1));
      [letters[index], letters[target]] = [letters[target], letters[index]];
    }
    return letters.map((letter, index) => ({id: `${question.id}-${index}`, letter}));
  }

  function activeQuestion() {
    return QUESTIONS.find((question) => question.id === state.activeId) || null;
  }

  function currentTiles() {
    const question = activeQuestion();
    return question ? makeTiles(question) : [];
  }

  function renderBoardRow(question, rowIndex) {
    const letters = compact(question.answerPlain).split("");
    const offset = PIVOT_COLUMN - question.keyIndex;
    const solved = state.completed.has(question.id);
    const cells = letters.map((letter, letterIndex) => {
      const pivot = letterIndex === question.keyIndex;
      const visible = solved ? letter : (pivot && state.keywordResult === "correct" ? question.keyLetter : "");
      return `<span class="board-cell${pivot ? " pivot-cell" : ""}" style="grid-column:${offset + letterIndex + 1}">${visible}</span>`;
    }).join("");
    return `<button type="button" class="crossword-row${state.activeId === question.id ? " active" : ""}${solved ? " solved" : ""}" data-question="${question.id}" aria-label="Dòng ${rowIndex + 1}, ${solved ? `đã giải: ${question.answer}` : "chưa giải"}">
      <span class="row-number">${String(rowIndex + 1).padStart(2, "0")}</span>
      <span class="row-cells">${cells}</span>
      <span class="row-status" aria-hidden="true">${solved ? "✓" : "›"}</span>
    </button>`;
  }

  function renderPlayPanel() {
    if (state.keywordResult === "correct") {
      return `<div class="victory-card">
        <div class="victory-icon">${icon("✦")}</div><p>Chướng ngại vật</p><h2>TỰ CHỦ</h2><div class="victory-rule"></div>
        <blockquote>Hội nhập sâu rộng nhưng luôn giữ vững độc lập, tự chủ — đó là sợi chỉ đỏ trong đường lối phát triển của Việt Nam giai đoạn 1996–2006.</blockquote>
        <p class="victory-summary">Từ <b>đẩy mạnh</b> CNH, HĐH, phát triển kinh tế <b>tri thức</b>, chuyển sang tư thế <b>chủ động</b> hội nhập, khơi thông kinh tế <b>tư nhân</b> và tiến tới <b>WTO</b> — Việt Nam đã tạo dựng một thế và lực mới.</p>
        <button class="secondary-action" type="button" data-action="reset">${icon("↻")} Chơi lại</button>
      </div>`;
    }

    const question = activeQuestion();
    if (!question) {
      return `<div class="empty-state"><div class="empty-compass"><span>?</span></div><p>PLAYER 01 • READY</p><h2>Chọn dòng<br>để nhận câu hỏi</h2><span>Nhấn vào một hàng ngang từ 01 đến 05.</span></div>`;
    }

    const tiles = currentTiles();
    const selectedTiles = state.selectedIds.map((id) => tiles.find((tile) => tile.id === id)).filter(Boolean);
    const answerLetters = compact(question.answerPlain).split("");
    const slots = answerLetters.map((letter, index) => `<button type="button" data-remove="${index}" aria-label="Bỏ chữ ở vị trí ${index + 1}">${state.feedback === "correct" ? letter : (selectedTiles[index]?.letter || "")}</button>`).join("");
    const bank = tiles.map((tile) => `<button type="button" data-tile="${tile.id}"${state.selectedIds.includes(tile.id) ? " disabled" : ""}>${tile.letter}</button>`).join("");
    const result = state.feedback === "wrong"
      ? `<p class="feedback wrong">Chưa chính xác. Hãy đổi thứ tự các chữ và thử lại.</p>`
      : state.feedback === "correct"
        ? `<div class="correct-answer">${icon("✓")}<div><strong>Chính xác — ${question.answer}</strong><span>${question.fact}</span></div></div>`
        : "";

    return `<div class="question-card">
      <div class="question-meta"><span>Câu hỏi · ${question.year}</span><span>${answerLetters.length} chữ cái</span></div>
      <h2>${question.question}</h2>
      <div class="answer-area"><span class="area-label">Đáp án của bạn</span><div class="answer-slots${state.feedback === "wrong" ? " has-error" : ""}">${slots}</div>${result}</div>
      ${state.feedback === "correct" ? `<button class="next-line-button" type="button" data-action="clear-question">Chọn dòng tiếp theo ${icon("›")}</button>` : `
        <div class="letter-bank" aria-label="Các chữ cái để ghép">${bank}</div>
        <div class="question-actions">
          <button class="hint-button" type="button" data-action="hint">${icon("◉")} ${state.showHint ? "Ẩn gợi ý" : "Mở gợi ý"}</button>
          <button class="check-button" type="button" data-action="check"${state.selectedIds.length !== answerLetters.length ? " disabled" : ""}>Kiểm tra ${icon("✓")}</button>
        </div>
        ${state.showHint ? `<div class="hint-box">${icon("?")}<p><b>Gợi ý</b>${question.hint}</p></div>` : ""}`}
    </div>`;
  }

  function renderKeywordModal() {
    if (!state.showKeywordForm) return "";
    return `<div class="modal-backdrop" data-action="close-keyword" role="presentation">
      <form class="keyword-modal" data-form="keyword">
        <button class="modal-close" type="button" data-action="close-keyword" aria-label="Đóng">×</button>
        <div class="modal-symbol">⚑</div><p>Chướng ngại vật</p><h2>Nguyên tắc cốt lõi là gì?</h2><span>Nhập từ khóa không dấu hoặc có dấu.</span>
        <div class="keyword-input${state.keywordResult === "wrong" ? " error" : ""}"><input autofocus value="${state.keywordGuess}" placeholder="Nhập đáp án…" aria-label="Từ khóa hàng dọc"><button type="button" data-action="clear-keyword" aria-label="Xóa">×</button></div>
        ${state.keywordResult === "wrong" ? `<p class="modal-error">Chưa đúng. Bạn có thể mở thêm hàng ngang để lấy gợi ý.</p>` : ""}
        <button class="primary-action modal-submit" type="submit"${state.keywordGuess.trim() ? "" : " disabled"}>Trả lời ${icon("›")}</button>
      </form>
    </div>`;
  }

  function renderGame() {
    const solvedCount = state.completed.size;
    const keywordCells = KEYWORD_DISPLAY.map((letter, index) => {
      const open = state.completed.has(QUESTIONS[index].id) || state.keywordResult === "correct";
      return `<span class="${open ? "open" : ""}">${open ? letter : "?"}</span>`;
    }).join("");

    root.innerHTML = `<main class="game-screen">
      <header class="game-header">
        <button class="icon-button" type="button" data-action="exit" aria-label="Trở về desktop">←</button>
        <div class="game-title"><span>1996—2006</span><strong>Giải mã chuyển mình</strong></div>
        <div class="progress-pill"><b>${solvedCount}</b>/5<span> hàng ngang</span></div>
      </header>
      <div class="game-layout">
        <section class="board-panel" aria-labelledby="board-heading">
          <div class="section-heading"><div><p>ROUND 01 • CHƯỚNG NGẠI VẬT</p><h1 id="board-heading">Chọn hàng ngang</h1></div><span>▶ SELECT ROW</span></div>
          <div class="crossword-board">${QUESTIONS.map(renderBoardRow).join("")}</div>
          <div class="keyword-strip">
            <div class="keyword-label">${icon("▣")}<span>Từ khóa hàng dọc</span></div>
            <div class="keyword-cells" aria-label="${solvedCount} trên 5 chữ đã mở">${keywordCells}</div>
            <button class="keyword-button" type="button" data-action="keyword"${state.keywordResult === "correct" ? " disabled" : ""}>⚑ Đoán từ khóa</button>
          </div>
        </section>
        <section class="play-panel${activeQuestion() ? "" : " empty"}" aria-live="polite">${renderPlayPanel()}</section>
      </div>
      ${renderKeywordModal()}
    </main>`;
    root.querySelector(".keyword-input input")?.focus();
  }

  function openQuestion(id) {
    if (state.keywordResult === "correct") return;
    state.activeId = id;
    state.selectedIds = [];
    state.showHint = false;
    state.feedback = state.completed.has(id) ? "correct" : null;
    renderGame();
  }

  function resetGame() {
    state.activeId = null;
    state.completed.clear();
    state.selectedIds = [];
    state.showHint = false;
    state.feedback = null;
    state.showKeywordForm = false;
    state.keywordGuess = "";
    state.keywordResult = null;
    renderGame();
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.question) return openQuestion(button.dataset.question);
    if (button.dataset.tile) {
      const question = activeQuestion();
      if (!question || state.feedback === "correct" || state.selectedIds.includes(button.dataset.tile)) return;
      if (state.selectedIds.length < compact(question.answerPlain).length) state.selectedIds.push(button.dataset.tile);
      state.feedback = null;
      return renderGame();
    }
    if (button.dataset.remove !== undefined) {
      if (state.feedback !== "correct") state.selectedIds.splice(Number(button.dataset.remove), 1);
      state.feedback = null;
      return renderGame();
    }

    switch (button.dataset.action) {
      case "start": renderGame(); break;
      case "exit": parent.postMessage({type: "museum-game-exit"}, "*"); break;
      case "reset": resetGame(); break;
      case "clear-question": state.activeId = null; state.selectedIds = []; state.feedback = null; renderGame(); break;
      case "hint": state.showHint = !state.showHint; renderGame(); break;
      case "check": {
        const question = activeQuestion();
        const tiles = currentTiles();
        const guess = state.selectedIds.map((id) => tiles.find((tile) => tile.id === id)?.letter || "").join("");
        if (question && guess === compact(question.answerPlain)) {
          state.completed.add(question.id);
          state.feedback = "correct";
        } else state.feedback = "wrong";
        renderGame();
        break;
      }
      case "keyword": state.showKeywordForm = true; state.keywordResult = null; renderGame(); break;
      case "close-keyword": state.showKeywordForm = false; renderGame(); break;
      case "clear-keyword": state.keywordGuess = ""; state.keywordResult = null; renderGame(); break;
    }
  });

  root.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal-backdrop")) {
      state.showKeywordForm = false;
      renderGame();
    }
  });

  root.addEventListener("input", (event) => {
    if (!event.target.matches(".keyword-input input")) return;
    state.keywordGuess = event.target.value;
    state.keywordResult = null;
    const submit = root.querySelector(".modal-submit");
    if (submit) submit.disabled = !state.keywordGuess.trim();
  });

  root.addEventListener("submit", (event) => {
    if (!event.target.matches('[data-form="keyword"]')) return;
    event.preventDefault();
    if (compact(state.keywordGuess) === compact(KEYWORD)) {
      state.keywordResult = "correct";
      state.showKeywordForm = false;
      state.activeId = null;
    } else state.keywordResult = "wrong";
    renderGame();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (state.showKeywordForm) {
      state.showKeywordForm = false;
      renderGame();
    } else parent.postMessage({type: "museum-game-exit"}, "*");
  });
})();
