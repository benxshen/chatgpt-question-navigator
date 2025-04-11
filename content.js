function getAllQuestions() {
  return Array.from(document.querySelectorAll('div[data-message-author-role="user"]')).map((el, idx) => ({
    element: el,
    text: el.innerText.trim(),
    id: `gpt-question-${idx}`
  }));
}

function addQuestionOption(question, dropdown) {
  const option = document.createElement('option');
  option.value = question.id;
  option.innerText = `${dropdown.options.length}. `;
  option.innerText += question.text.length > 80 ? question.text.slice(0, 80) + '...' : question.text;
  dropdown.appendChild(option);
  
  question.element.setAttribute('id', question.id);
}

function createDropdown(questions) {
  const dropdown = document.createElement('select');
  dropdown.style.position  = 'fixed';
  dropdown.style.top       = '80px';
  dropdown.style.right     = '20px';
  dropdown.style.zIndex    = 9999;
  dropdown.style.padding   = '8px';
  dropdown.style.width     = '250px';
  dropdown.style.maxHeight = '80vh';
  dropdown.style.overflowY = 'auto';

  const defaultOption = document.createElement('option');
  defaultOption.innerText = '⚡ 選擇一個提問來跳轉 ⚡';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  dropdown.appendChild(defaultOption);

  questions.forEach(q => addQuestionOption(q, dropdown));

  dropdown.addEventListener('change', () => {
    const target = document.getElementById(dropdown.value);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => dropdown.selectedIndex = 0, 1000);
    }
  });

  dropdown.addEventListener('mousedown', (event) => {
    
    // 重新獲取問題列表
    const questions = getAllQuestions();

    if (questions.length > dropdown.options.length - 1) {
      for (let i = dropdown.options.length-1; i < questions.length; i++) {
        addQuestionOption(questions[i], dropdown);
      }
    }

  });

  document.body.appendChild(dropdown);
  return dropdown;
}

// 監聽 URL 變化以重新載入下拉選單
let currentUrl = window.location.href;
let currentDropdown = null;

function initializeOrUpdateDropdown() {
  if (currentDropdown) {
    currentDropdown.remove();
  }
  
  setTimeout(() => {
    const questions = getAllQuestions();
    if (questions.length > 0) {
      currentDropdown = createDropdown(questions);
    }
  }, 2000);
}

// 初始化
setTimeout(initializeOrUpdateDropdown, 1000);

// 使用 MutationObserver 監聽 URL 變化
const observer = new MutationObserver(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    initializeOrUpdateDropdown();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
