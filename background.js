// 확장 프로그램 아이콘 클릭 시 실행
chrome.action.onClicked.addListener((tab) => {
  // 현재 활성화된 탭에 메시지 전송
  chrome.tabs.sendMessage(tab.id, { action: "togglePanel" });
}); 