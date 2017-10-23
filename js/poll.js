const NAME = 'bbpr';
const FONT = 'Lucida Sans Unicode, sans-serif';
const PATH = '/rest/api/1.0/dashboard/pull-requests?state=open&role=reviewer';
const SERVER_KEY = 'bbpr-server';

const OPEN = {
	bg: 'rgba(255, 70, 70, 255)',
	text: 'rgba(255, 255, 255, 255)'
};

const EMPTY = {
	bg: 'rgba(100, 100, 100, 255)',
	text: 'rgba(255, 255, 255, 255)'
};

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

	ctx.fillStyle = colors.text;
	ctx.textBaseline = 'middle';

	const x = size / 2 - metrics.width / 2;
	const y = size / 2;
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
					const num_of_prs = json['size'];
					reportState(`${num_of_prs} open PR(s)`);
					updateIcon(num_of_prs, num_of_prs === 0 ? EMPTY : OPEN);
				} else {
					reportState(0, 'No Open PRs');
				}
			} else {
				reportState(`something went wrong, status = ${this.status}`, ':P');
			}
		}
	};

	xhr.onerror = function() {
		reportState(`unable to execute the request`, 'X(');
	};

	xhr.withCredentials = true;
	xhr.open('GET', url, true);

	try {
		xhr.send();			
	} catch(e) {
		reportState(e.message, ':(');
	}
}

function reportState(text, icon) {
	chrome.browserAction.setTitle({
		title: text
	});

	icon && updateIcon(icon, EMPTY);
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
	if (SERVER_KEY in changes) {
		const change = changes[SERVER_KEY];
		chrome.alarms.create(NAME, { 
			when: Date.now() 
		});
	}
});

function getAndRequest() {
	chrome.storage.local.get(SERVER_KEY, function(values) {
		if (values.hasOwnProperty(SERVER_KEY)) {
			const serverUrl = values[SERVER_KEY];
			if (serverUrl && serverUrl.trim().length > 0) {
				doRequest(`${serverUrl.trim()}${PATH}`);
				return;
			} 
		} 

		reportState(`server url is bad or not defined`, ';(');
	});
}

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name === NAME) {
		getAndRequest();
	}
});

chrome.alarms.create(NAME, {
	periodInMinutes: 10
});

getAndRequest();