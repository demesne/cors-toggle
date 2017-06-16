let accessHeaders = new Map();

let requestListener = function (details){
	const accessControlRequestHeader = details.requestHeaders.find(elem => elem.name.toLowerCase() === "access-control-request-headers");
    if (accessControlRequestHeader){
        accessHeaders.set(details.requestId, accessControlRequestHeader.value);
    }
};

let responseListener = function(details){
	let responseHeaders = details.responseHeaders.filter(elem => elem.name.toLowerCase() !== 'access-control-allow-origin' && elem.name.toLowerCase() !== 'access-control-allow-methods' )
	responseHeaders.push({'name': 'Access-Control-Allow-Origin','value': '*'});
	responseHeaders.push({'name': 'Access-Control-Allow-Methods', 'value': 'GET, PUT, POST, DELETE, HEAD, OPTIONS'});

	if(accessHeaders.has(details.requestId)){
        responseHeaders.push({'name':'Access-Control-Allow-Headers', 'value': accessHeaders.get(details.requestId)});
        accessHeaders.delete(details.requestId);
    }
	return {responseHeaders: responseHeaders};
};

chrome.runtime.onInstalled.addListener(function(){
    chrome.storage.local.set({'active': false});
    reload();
});

chrome.runtime.onStartup.addListener(function (){
    reload();
});

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.storage.local.get('active', function(result) {
		chrome.storage.local.set({'active': !result.active});
		reload();
	});
});

function reload() {
    chrome.webRequest.onBeforeRequest.hasListener(responseListener) && chrome.webRequest.onHeadersReceived.removeListener(responseListener);
    chrome.webRequest.onBeforeRequest.hasListener(requestListener) && chrome.webRequest.onBeforeSendHeaders.removeListener(requestListener);

	chrome.storage.local.get('active', function(result) {
        if(result && result.active) {
            chrome.browserAction.setIcon({path: "on.png"});
            chrome.webRequest.onBeforeSendHeaders.addListener(requestListener, {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);
            chrome.webRequest.onHeadersReceived.addListener(responseListener, {urls: ["<all_urls>"]}, ["blocking", "responseHeaders"]);
        }
        else {
			chrome.browserAction.setIcon({path: "off.png"});
		}
	});
}
