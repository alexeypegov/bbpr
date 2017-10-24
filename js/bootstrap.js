chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.storage.local.get(SERVER_KEY, function(values) {
    const url = values[SERVER_KEY];
    if (url && url.trim().length > 0) {
      chrome.tabs.update(tab.id, {url: url});
    }
  });
});
