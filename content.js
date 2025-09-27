const main_sticky_selector = 'main div[role="presentation"] > .sticky';
const chat_topic_selector = 'nav a.__menu-item';

function scrollItemIntoView(item) {
  if (!item) return;
  if (typeof item.scrollIntoViewIfNeeded === 'function') {
    item.scrollIntoViewIfNeeded();
  } else {
    item.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

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
  const text = question.text.length > 50 ? question.text.slice(0, 50) + '...' : question.text;
  const index = container.querySelectorAll('.question-item').length + 1;

  const indexBadge = document.createElement('span');
  indexBadge.className = 'question-item__index';
  indexBadge.innerText = index.toString().padStart(2, '0');

  const textLabel = document.createElement('span');
  textLabel.className = 'question-item__text';
  textLabel.innerText = text;

  const chevron = document.createElement('span');
  chevron.className = 'question-item__chevron';
  chevron.innerText = '›';

  item.appendChild(indexBadge);
  item.appendChild(textLabel);
  item.appendChild(chevron);
  
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
  header.className = 'question-navigator__header';
  header.innerHTML = `
    <span class="question-navigator__badge">Jump</span>
    <div class="question-navigator__heading">
      <span class="question-navigator__title">Question Navigator</span>
      <span class="question-navigator__subtitle">快速跳轉對話</span>
    </div>
  `;
  navigator.appendChild(header);

  questions.forEach(q => addQuestionItem(q, navigator));

  // 點擊 minimap 顯示/隱藏導航器
  minimap.addEventListener('click', () => {
    navigator.classList.toggle('show');
    const activeItem = navigator.querySelector('.question-item.active');
    scrollItemIntoView(activeItem);
  });

  // 點擊其他地方隱藏導航器
  document.addEventListener('click', (e) => {
    if (!navigator.contains(e.target) && !minimap.contains(e.target)) {
      navigator.classList.remove('show');
    }
  });

  // 監聽頁面滾動以更新當前項目
  const scrollContainer = document.querySelector('main .overflow-y-auto');
  let scrollTimeout;
  
  scrollContainer.addEventListener('scroll', () => {
    // 使用 throttle 來限制執行頻率
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        
        requestAnimationFrame(() => {
          const items = navigator.querySelectorAll('.question-item');

          let closestItem = null;
          let minDistance = Infinity;
          let closestNegativeItem = null;
          let minNegativeDistance = Infinity;
          let hasVisibleItem = false;
          
          const containerRect = scrollContainer.getBoundingClientRect();
          const containerHeight = containerRect.height;

          items.forEach(item => {
            const questionId = item.dataset.questionId;
            if (!questionId) return;
            
            const question = document.getElementById(questionId);
            if (!question) return;

            /*
              元素可見性判斷更準確:
              完整檢查元素的可見狀態，包含：
              
                - 元素頂部在可視區域內
                - 元素底部在可視區域內
                - 元素完全覆蓋可視區域
              
              元素選擇邏輯更完善
                - 優先選擇可視區域內最靠近頂部的元素
                - 當沒有可見元素時，自動選擇 top 為負值且絕對值最小的元素
            */

            const rect = question.getBoundingClientRect();
            const isVisible = (rect.top >= 0 && rect.top <= containerHeight) || 
                            (rect.bottom >= 0 && rect.bottom <= containerHeight) ||
                            (rect.top <= 0 && rect.bottom >= containerHeight);

            if (isVisible) {
              hasVisibleItem = true;
              const distance = Math.abs(rect.top);
              if (distance < minDistance) {
                minDistance = distance;
                closestItem = item;
              }
            } else if (rect.top < 0) {
              // 記錄最接近可視區域頂部的負值元素
              const distance = Math.abs(rect.top);
              if (distance < minNegativeDistance) {
                minNegativeDistance = distance;
                closestNegativeItem = item;
              }
            }
          });

          // 決定要激活的元素
          const itemToActivate = hasVisibleItem ? closestItem : closestNegativeItem;

          if (itemToActivate && !scrollTimeout) {
            items.forEach(item => item.classList.remove('active'));
            itemToActivate.classList.add('active');
            scrollItemIntoView(itemToActivate);
            // 更新 minimap
            const minimapRows = document.querySelectorAll('.minimap-row');
            minimapRows.forEach(item => {
              if (item.dataset.questionId === itemToActivate.dataset.questionId) {
                item.classList.add('active');
              } else {
                item.classList.remove('active');
              }
            });
          }
        });
      }, 100); // throttle 時間
    }
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

//////////////////////////////////////////////////////////////////////////////

function throttle(func, limit) {
  let lastCall = 0;
  let timeout;
  return function(...args) {
    const now = Date.now();
    const remaining = limit - (now - lastCall);
    if(remaining <= 0) {
      clearTimeout(timeout);
      lastCall = now;
      func.apply(this, args);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
      }, remaining);
    }
  };
}



/* 🔁 監聽路由變化（支援 ChatGPT 是 SPA） */
function hookUrlChange(callback) {
  const pushState = history.pushState;
  const replaceState = history.replaceState;

  history.pushState = function() {
    pushState.apply(history, arguments);
    callback();
  };

  history.replaceState = function() {
    replaceState.apply(history, arguments);
    callback();
  };

  window.addEventListener('popstate', callback);
}

/* ---- ⭐️ 監控 sidebar 的變化（包含關閉後重建） ---- */
function observeSidebarChanges() {
  const sidebarRoot = document.querySelector('body');

  if(!sidebarRoot) return;

  const observer = new MutationObserver(() => {
    const nav = document.querySelector('nav');
    if(nav && !nav.__hasObserver) {
      nav.__hasObserver = true;

      /* 每次有 DOM 變更都重新標記 active chat */
      const innerObserver = new MutationObserver(() => {
        setTimeout(() => {
          setupScrollShadow();
        }, 300);
      });

      innerObserver.observe(nav, {
        childList: true,
        subtree: true,
      });

      /* 第一次初始化 */
      setTimeout(() => {
        setupScrollShadow();
      }, 300);
    }
  });

  observer.observe(sidebarRoot, {
    childList: true,
    subtree: true,
  });
}

/***************************************/
function setupScrollShadow() {
  if(document.querySelector('main .overflow-y-auto.__ben-cust')) {
    return;
  }
  const container = document.querySelector('main .overflow-y-auto');
  const sticky = document.querySelector('main .composer-parent .sticky');

  if(!container || !sticky) {
    setTimeout(setupScrollShadow, 1000);
    return;
  }

  container.classList.add('__ben-cust');
  sticky.classList.remove('@[84rem]/thread:!shadow-none');  /* patch 寬螢幕沒有 shadow 效果*/



  let clearScrollShadowTimer;
  const toggleShadow = () => {
    clearScrollShadowTimer && clearTimeout(clearScrollShadowTimer);
    if(clearScrollShadowTimer && container.scrollTop > 0) {
      sticky.classList.add('scroll-shadow');
    }

    clearScrollShadowTimer = setTimeout(() => {
      sticky.classList.remove('scroll-shadow');
    }, 500);
  };

  const t_toggleShadow = throttle(toggleShadow, 300);

  container.addEventListener('scroll', t_toggleShadow);
}

/***************************************/
/***************************************/
/***************************************/

observeSidebarChanges();
setupScrollShadow();

window.addEventListener('load', () => {
  /* ✅ 初始化一次 */
  setTimeout(() => {
  }, 500); /* 等待 DOM 變化完成後套用 */

  observeSidebarChanges();

})
