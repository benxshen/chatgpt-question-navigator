const main_sticky_selector = 'main div[role="presentation"] > .sticky';
const chat_topic_selector = 'nav li a[data-history-item-link="true"]';

function getChatTopic() {
  const currChatTopic = [...document.querySelectorAll(chat_topic_selector)]
                      .find(el => window.location.href.endsWith(el.getAttribute('href')));
  if (currChatTopic) {
    const text = currChatTopic.innerText.trim();
    // 取前50個字元作為主題，如果超過則添加省略號
    return text.length > 50 ? text.slice(0, 50) + '...' : text;
  }
  return '';
}

function createTopicBar() {
  
  // 創建主題容器
  const chatTopicElm = document.createElement('div');
  chatTopicElm.className = 'chat-topic';
  
  // // 添加圖示
  // const icon = document.createElement('span');
  // icon.className = 'chat-topic-icon';
  // icon.innerText = '📝';
  // topicContainer.appendChild(icon);
  
  // 添加主題文字
  const topicText = document.createElement('span');
  topicText.innerText = getChatTopic();
  chatTopicElm.appendChild(topicText);
  
  // 插入到頁面中
  const target = document.querySelector(`${main_sticky_selector} > .items-center`);
  if (target) {
    target.after(chatTopicElm);
  }
  
  return chatTopicElm;
}

function updateTopicBar() {
  const topicText = document.querySelector(`${main_sticky_selector} .chat-topic span:last-child`);
  if (topicText) {
    topicText.innerText = getChatTopic();
  } else {
    createTopicBar();
  }
}

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
  item.dataset.questionId = question.id;

  const minimapRow = document.createElement('div');
  minimapRow.className = 'minimap-row';
  minimapRow.dataset.questionId = question.id;
  document.querySelector('.navigator-minimap').appendChild(minimapRow);
  
  // 主要文字
  const text = question.text.length > 80 ? question.text.slice(0, 80) + '...' : question.text;
  item.innerText = `${container.children.length}. ${text}`;
  
  // 點擊事件
  item.addEventListener('click', () => {
    const target = document.getElementById(question.id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // 移除其他項目的active狀態
      const items = container.querySelectorAll('.question-item');
      items.forEach(i => i.classList.remove('active'));
      
      // 設置當前項目為active
      item.classList.add('active');
    }
  });
  
  container.appendChild(item);
  question.element.setAttribute('id', question.id);
}

function createNavigator(questions) {
  // 創建固定minimap
  const minimap = document.createElement('div');
  minimap.className = 'navigator-minimap';
  document.body.appendChild(minimap);

  // 創建導航器
  const navigator = document.createElement('div');
  navigator.className = 'question-navigator';

  // 標題項目
  const header = document.createElement('div');
  header.className = 'question-item';
  header.innerText = '⚡ 選擇一個提問來跳轉 ⚡';
  navigator.appendChild(header);

  questions.forEach(q => addQuestionItem(q, navigator));

  // 點擊 minimap 顯示/隱藏導航器
  minimap.addEventListener('click', () => {
    navigator.classList.toggle('show');
  });

  // 點擊其他地方隱藏導航器
  document.addEventListener('click', (e) => {
    if (!navigator.contains(e.target) && !minimap.contains(e.target)) {
      navigator.classList.remove('show');
    }
  });

  // 監聽頁面滾動以更新當前項目
  document.querySelector('main .\\@container.overflow-y-auto').addEventListener('scroll', () => {
    requestAnimationFrame(() => {
      const items = navigator.querySelectorAll('.question-item:not(:first-child)');
      items.forEach(item => item.classList.remove('active'));

      // 找出當前視窗中最靠近頂部的問題
      let closestItem = null;
      let minDistance = Infinity;
      
      items.forEach(item => {
        const questionId = item.dataset.questionId;
        if (!questionId) return;
        
        const question = document.getElementById(questionId);
        if (!question) return;
        
        const rect = question.getBoundingClientRect();
        const distance = Math.abs(rect.top);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestItem = item;
        }
      });

      if (closestItem) {
        closestItem.classList.add('active');

        const minimapRows = document.querySelectorAll('.minimap-row');
        minimapRows.forEach(item => {
          if (item.dataset.questionId === closestItem.dataset.questionId) {
            item.classList.add('active');
          } else {
            item.classList.remove('active')
          }
        });

      }
    });
  }, { passive: true });

  document.body.appendChild(navigator);
  return navigator;
}

// 監聽 URL 變化以重新載入導航器
let currentUrl = window.location.href;
let currentNavigator = null;

function initializeOrUpdateNavigator() {
  if (currentNavigator) {
    currentNavigator.remove();
    document.querySelector('.navigator-minimap').remove();
    currentNavigator = null;
  }
  
  setTimeout(() => {
    const questions = getAllQuestions();
    if (questions.length > 0) {
      currentNavigator = createNavigator(questions);
      currentNavigator.querySelector('.question-item:last-child').click();
    }
  }, 2000);
}

// 初始化
setTimeout(initializeOrUpdateNavigator, 1000);

// 建立兩個獨立的 Observer
const urlObserver = new MutationObserver(() => {
  if (currentUrl !== window.location.href) {
    currentUrl = window.location.href;
    initializeOrUpdateNavigator();
    // 在 URL 變化時重新創建主題欄
    const existingTopicBar = document.querySelector(`${main_sticky_selector} > .chat-topic`);
    if (existingTopicBar) {
      existingTopicBar.remove();
    }
    createTopicBar();
  } 
});

const contentObserver = new MutationObserver((mutations) => {
  // 檢查新的使用者訊息
  const hasNewUserMessage = mutations.some(mutation => 
    Array.from(mutation.addedNodes).some(node => 
      node.nodeType === 1 && // 確保是元素節點
      node.querySelector && // 確保有 querySelector 方法
      node.querySelector('div[data-message-author-role="user"]')
    )
  );

  if (hasNewUserMessage) {
    // 更新導航器
    if (currentNavigator) {
      const questions = getAllQuestions();
      const currentItems = currentNavigator.querySelectorAll('.question-item').length - 1;

      if (questions.length > currentItems) {
        for (let i = currentItems; i < questions.length; i++) {
          addQuestionItem(questions[i], currentNavigator);
        }
      }
    }
    
    // 更新主題
    updateTopicBar();
  }
});

// 設置觀察者
urlObserver.observe(document.body, {
  childList: true,
  subtree: true
});

contentObserver.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});

// 初始化主題欄
setTimeout(() => createTopicBar(), 1000);
