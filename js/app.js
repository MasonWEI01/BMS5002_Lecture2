(function () {
  const contentRoot = document.querySelector("main.content");
  const navLinks = [...document.querySelectorAll(".nav-list a")];
  const sections = [...document.querySelectorAll("section.block, .hero")].filter((el) => el.id);
  const langBtns = document.querySelectorAll("[data-lang]");
  const quizBtn = document.getElementById("quiz-btn");
  const quizPanel = document.getElementById("quiz-panel");
  const overlay = document.getElementById("overlay");
  const quizClose = document.getElementById("quiz-close");
  const quizBody = document.getElementById("quiz-body");
  const quizSubmit = document.getElementById("quiz-submit");
  const quizReset = document.getElementById("quiz-reset");
  const scoreBox = document.getElementById("score-box");
  const progressBar = document.getElementById("progress-bar");

  const textNodes = [];
  function collectText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest(".no-convert, script, style, .en, .lang-switch, .brand-mark")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while (walker.nextNode()) {
      textNodes.push({ node: walker.currentNode, original: walker.currentNode.nodeValue });
    }
  }
  collectText(document.body);

  let tw2cn = (s) => s;
  if (window.OpenCC && OpenCC.Converter) {
    try {
      tw2cn = OpenCC.Converter({ from: "tw", to: "cn" });
    } catch (e) {
      console.warn("OpenCC init failed", e);
    }
  }

  function setLang(lang) {
    document.documentElement.lang = lang === "hans" ? "zh-Hans" : "zh-Hant";
    langBtns.forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
    textNodes.forEach(({ node, original }) => {
      node.nodeValue = lang === "hans" ? tw2cn(original) : original;
    });
    localStorage.setItem("bms5002-lang", lang);
  }

  langBtns.forEach((btn) => btn.addEventListener("click", () => setLang(btn.dataset.lang)));
  const saved = localStorage.getItem("bms5002-lang");
  if (saved === "hans") setLang("hans");

  function setActive() {
    const y = window.scrollY + 90;
    let current = sections[0];
    for (const s of sections) {
      if (s.offsetTop <= y) current = s;
    }
    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current.id));
    const idx = Math.max(0, sections.indexOf(current));
    if (progressBar) progressBar.style.width = ((idx + 1) / sections.length) * 100 + "%";
  }
  window.addEventListener("scroll", setActive, { passive: true });
  setActive();

  function openQuiz() {
    overlay.classList.add("show");
    quizPanel.classList.add("open");
  }
  function closeQuiz() {
    overlay.classList.remove("show");
    quizPanel.classList.remove("open");
  }
  quizBtn.addEventListener("click", openQuiz);
  quizClose.addEventListener("click", closeQuiz);
  overlay.addEventListener("click", closeQuiz);

  function renderQuiz() {
    quizBody.innerHTML = QUIZ.map((item, i) => `
      <article class="q-card" data-i="${i}">
        <h4>${i + 1}. ${item.q}</h4>
        ${item.options.map((opt, j) => `
          <label class="q-opt"><input type="radio" name="q${i}" value="${j}"> ${opt}</label>
        `).join("")}
        <p class="explain" style="display:none;margin:8px 0 0;font-size:13px;color:#3d5254;"></p>
      </article>
    `).join("");
    scoreBox.classList.remove("show");
    if (document.documentElement.lang === "zh-Hans") {
      const extra = [];
      const w = document.createTreeWalker(quizBody, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) extra.push({ node: w.currentNode, original: w.currentNode.nodeValue });
      extra.forEach(({ node, original }) => { node.nodeValue = tw2cn(original); });
    }
  }
  renderQuiz();

  quizSubmit.addEventListener("click", () => {
    let correct = 0;
    QUIZ.forEach((item, i) => {
      const card = quizBody.querySelector(`.q-card[data-i="${i}"]`);
      const chosen = card.querySelector("input:checked");
      const opts = [...card.querySelectorAll(".q-opt")];
      opts.forEach((lab, j) => {
        lab.classList.remove("correct", "wrong");
        if (j === item.ans) lab.classList.add("correct");
      });
      if (chosen) {
        const val = Number(chosen.value);
        if (val === item.ans) correct += 1;
        else opts[val].classList.add("wrong");
      }
      const exp = card.querySelector(".explain");
      const langHans = document.documentElement.lang === "zh-Hans";
      exp.style.display = "block";
      exp.textContent = (langHans ? tw2cn("解析：") : "解析：") + (langHans ? tw2cn(item.explain) : item.explain);
    });
    const pct = Math.round((correct / QUIZ.length) * 100);
    scoreBox.classList.add("show");
    const msg = `你答對 ${correct} / ${QUIZ.length} 題（${pct}%）。建議把錯題對應章節再讀一次。`;
    scoreBox.textContent = document.documentElement.lang === "zh-Hans" ? tw2cn(msg) : msg;
    localStorage.setItem("bms5002-quiz", JSON.stringify({ correct, total: QUIZ.length, at: Date.now() }));
  });

  quizReset.addEventListener("click", renderQuiz);
})();
