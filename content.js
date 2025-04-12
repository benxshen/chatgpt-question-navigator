function getAllQuestions() {
  return Array.from(document.querySelectorAll('div[data-message-author-role="user"]')).map((el, idx) => ({
    element: el,
    text: el.innerText.trim(),
    id: `gpt-question-${idx}`
  }));
}

function addQuestionItem(question, container) {
  const item = document.createElement('div');
  item.className = 'question-item';
  
  // 主要文字
  const text = question.text.length > 80 ? question.text.slice(0, 80) + '...' : question.text;
  item.innerText = `${container.children.length}. ${text}`;
  
  // 浮動提示視窗
  const tooltip = document.createElement('div');
  tooltip.className = 'question-tooltip';
  tooltip.innerText = question.text;
  item.appendChild(tooltip);
  
  // 點擊事件
  item.addEventListener('click', () => {
    const target = document.getElementById(question.id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  container.appendChild(item);
  question.element.setAttribute('id', question.id);
}

function createNavigator(questions) {
  const navigator = document.createElement('div');
  navigator.className = 'question-navigator';

  // 標題項目
  const header = document.createElement('div');
  header.className = 'question-item';
  header.innerText = '⚡ 選擇一個提問來跳轉 ⚡';
  navigator.appendChild(header);

  questions.forEach(q => addQuestionItem(q, navigator));

  // 監聽滑鼠事件以更新問題列表
  navigator.addEventListener('mouseenter', () => {
    const questions = getAllQuestions();
    const currentItems = navigator.querySelectorAll('.question-item').length - 1; // 扣除標題

    if (questions.length > currentItems) {
      for (let i = currentItems; i < questions.length; i++) {
        addQuestionItem(questions[i], navigator);
      }
    }
  });

  document.body.appendChild(navigator);
  return navigator;
}

// 監聽 URL 變化以重新載入導航器
let currentUrl = window.location.href;
let currentNavigator = null;

function initializeOrUpdateNavigator() {
  if (currentNavigator) {
    currentNavigator.remove();
  }
  
  setTimeout(() => {
    const questions = getAllQuestions();
    if (questions.length > 0) {
      currentNavigator = createNavigator(questions);
    }
  }, 2000);
}

// 初始化
setTimeout(initializeOrUpdateNavigator, 1000);

// 使用 MutationObserver 監聽 URL 變化和新問項添加
const observer = new MutationObserver((mutations) => {
  // 檢查 URL 變化
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    initializeOrUpdateNavigator();
    return;
  }

  // 檢查新的使用者訊息
  const hasNewUserMessage = mutations.some(mutation => 
    Array.from(mutation.addedNodes).some(node => 
      node.nodeType === 1 && // 確保是元素節點
      node.querySelector && // 確保有 querySelector 方法
      node.querySelector('div[data-message-author-role="user"]')
    )
  );

  if (hasNewUserMessage && currentNavigator) {
    const questions = getAllQuestions();
    const currentItems = currentNavigator.querySelectorAll('.question-item').length - 1; // 扣除標題

    if (questions.length > currentItems) {
      for (let i = currentItems; i < questions.length; i++) {
        addQuestionItem(questions[i], currentNavigator);
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});
