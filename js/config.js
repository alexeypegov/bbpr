const SERVER_KEY = 'bbpr-server';
const serverElement = document.getElementById('server');
const LAST_CHECKED = 'bbpr-last';

chrome.storage.local.get(SERVER_KEY, function(values) {
  if (values[SERVER_KEY]) {
    serverElement.value = values[SERVER_KEY];
    serverElement.setAttribute('class', 'good');
  }
});

chrome.storage.local.get(LAST_CHECKED, function(values) {
  if (values[LAST_CHECKED]) {
    const formatTime = Math.ceil((Date.now() - values[LAST_CHECKED]) / 60000);
    document.getElementById('lastCheck').innerHTML = `Last run: ${formatTime} minute(s) ago`;
  }
});

const save = document.getElementById('save');
save.addEventListener('click', function() {
  const url = serverElement.value;
  if (url.trim().length === 0) {
    serverElement.setAttribute('class', 'wrong');
    serverElement.focus();
  } else {
    if (/^https?:\/\/.+/i.test(url)) {
      const data = {};
      data[SERVER_KEY] = url;
        chrome.storage.local.set(data, function() {
        serverElement.setAttribute('class', 'good');
      });
    } else {
      serverElement.setAttribute('class', 'wrong');
      serverElement.focus();
    }
  }
});