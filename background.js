// 확장 프로그램 아이콘 클릭 시 실행
chrome.action.onClicked.addListener((tab) => {
  // 현재 활성화된 탭에 메시지 전송
  chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
});

// content script로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "downloadFile") {
        chrome.downloads.download({
            url: request.url,
            filename: request.filename,
            saveAs: request.saveAs
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError });
            } else {
                sendResponse({ success: true, downloadId: downloadId });
            }
        });
        return true; // 비동기 응답을 위해 true 반환
    }
}); 