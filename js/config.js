const SERVER_KEY = 'bbpr-server';
const serverElement = document.getElementById('server');

chrome.storage.local.get(SERVER_KEY, function(values) {
	if (values[SERVER_KEY]) {
		serverElement.value = values[SERVER_KEY];
		serverElement.setAttribute('class', 'good');
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