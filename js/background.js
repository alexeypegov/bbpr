const FONT = 'Lucida Sans Unicode, sans-serif';
const PATH = '/rest/api/1.0/dashboard/pull-requests?state=open&role=reviewer';
const EXCLUDE_NEEDS_WORK_POSTFIX = '&participantStatus=unapproved';
const SERVER_KEY = 'bbpr-server';
const LAST_CHECKED = 'bbpr-last';
const EXCLUDE_NEEDS_WORK = 'exclude-needs-work';
const LAST_VALUE = 'bbpr-value';

const OPEN = {
  bg: 'rgba(255, 70, 70, 255)'
};

const EMPTY = {
  bg: 'rgba(100, 100, 100, 255)'
};

const OFFLINE = {
  bg: 'rgba(150, 150, 150, 255)'
};

function write(key, value, callback) {
  const obj = {};
  obj[key] = value;
  chrome.storage.local.set(obj, callback);
}

function read(keys, callback) {
  chrome.storage.local.get(keys, callback);
}

function drawIcon(text, size, colors) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', size);
  canvas.setAttribute('height', size);

  const ctx = canvas.getContext('2d');
  const bspr = ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1;

  const dpr = window.devicePixelRatio || 1;

  const ratio = dpr / bspr;

  canvas.width = size * ratio;
  canvas.height = size * ratio;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  ctx.rect(0, 0, size, size);
  ctx.fillStyle = colors.bg;
  ctx.fill();

  ctx.font = `30px ${FONT}`;
  let metrics = ctx.measureText(text);
  if ((metrics.width + 4) > size) {
    ctx.font = `22px ${FONT}`;
    metrics = ctx.measureText(text);
  }

  ctx.fillStyle = colors.text || '#fff';
  ctx.textBaseline = 'middle';

  const x = Math.floor(size / 2 - metrics.width / 2) + 0.5;
  const y = Math.floor(size / 2);
  ctx.fillText(text, x, y);

  return ctx.getImageData(0, 0, size - 1, size - 1);
}

function updateIcon(text, styles) {
  const imageData = drawIcon(text, 32, styles);
  chrome.browserAction.setIcon({
    imageData: imageData
  });
}

function doRequest(url) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (this.readyState === 4) {
      if (this.status === 200) {
        const json = JSON.parse(this.responseText);
        if (json.hasOwnProperty('size')) {
          write(LAST_VALUE, json['size']);
        }

        reportState('Online');
      } else {
        reportState(`Online, but broken: status = ${this.status}`, OFFLINE);
      }

      write(LAST_CHECKED, Date.now());
    }
  };

  xhr.onerror = function() {
    reportState('Offline: error executing request', OFFLINE);
  };

  xhr.withCredentials = true;
  xhr.open('GET', url, true);

  try {
    xhr.send();
  } catch(e) {
    reportState(`Offline: ${e.message}`, OFFLINE);
  }
}

function reportState(msg, style) {
  read(null, function(values) {
    const count = values.hasOwnProperty(LAST_VALUE) && values[LAST_VALUE] || 0;
    const lastChecked = values.hasOwnProperty(LAST_CHECKED) && values[LAST_CHECKED] || 0;
    const mins = Math.ceil((Date.now() - lastChecked) / 60000);

    chrome.browserAction.setTitle({
      title: `${msg}, last checked: ${mins} min(s) ago`
    });

    updateIcon(count, style || count && OPEN || EMPTY);
  });
}

function onPoll() {
  read(null, function(values) {
    const serverUrl = values.hasOwnProperty(SERVER_KEY) && values[SERVER_KEY].trim();
    const excludeNeedsWork = values.hasOwnProperty(EXCLUDE_NEEDS_WORK) && values[EXCLUDE_NEEDS_WORK];

    if (serverUrl && serverUrl.length > 0) {
      doRequest(`${serverUrl}${PATH}${excludeNeedsWork ? EXCLUDE_NEEDS_WORK_POSTFIX : ''}`);
      return;
    }

    reportState('Offline: server url is bad or not defined', OFFLINE);
  });
}

chrome.alarms.onAlarm.addListener(onPoll);
chrome.runtime.onStartup.addListener(onPoll);

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (SERVER_KEY in changes) {
    onPoll();
  }

  if (EXCLUDE_NEEDS_WORK in changes) {
    onPoll();
  }
});

chrome.browserAction.onClicked.addListener(function(tab) {
  read(SERVER_KEY, function(values) {
    const url = values[SERVER_KEY];
    if (url && url.trim().length > 0) {
      chrome.tabs.query({pinned: false, active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 1 && !tabs[0].hasOwnProperty('url')) {
          chrome.tabs.update(tabs[0].id, {url: url});
        } else {
          chrome.tabs.create({url: url});
        }
      });
    }
  });
});

chrome.runtime.onInstalled.addListener(function() {
  chrome.alarms.create('poll', {
    periodInMinutes: 10
  });
});
