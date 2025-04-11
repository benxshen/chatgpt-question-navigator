function getAllQuestions() {
  return Array.from(document.querySelectorAll('div[data-message-author-role="user"]')).map((el, idx) => ({
    element: el,
    text: el.innerText.trim(),
    id: `gpt-question-${idx}`
  }));
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
  defaultOption.innerText = '選擇一個提問來跳轉 🎙️';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  dropdown.appendChild(defaultOption);

  questions.forEach((q, i) => {
    const option = document.createElement('option');
    option.value = q.id;
    option.innerText = `${i + 1}. `;
    option.innerText += q.text.length > 80 ? q.text.slice(0, 80) + '...' : q.text;
    dropdown.appendChild(option);

    q.element.setAttribute('id', q.id);
  });

  dropdown.addEventListener('change', () => {
    const target = document.getElementById(dropdown.value);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
initializeOrUpdateDropdown();

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
