// textarea에 문자열을 입력하는 함수
function inputTextToTextarea(text) {
    // textarea 요소 찾기 (aria-invalid와 placeholder 속성 사용)
    const textarea = document.querySelector('textarea[aria-invalid="false"][placeholder="Send a message"]');
    
    if (textarea) {
        // textarea에 텍스트 입력
        textarea.value = text;
        
        // input 이벤트 발생시키기 (일부 웹사이트에서 필요)
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
        
        console.log('텍스트가 성공적으로 입력되었습니다:', text);
    } else {
        console.log('textarea를 찾을 수 없습니다.');
    }
}

// 버튼을 찾고 type을 출력하는 함수
function findSubmitButton() {
    const button = document.querySelector('button.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeExtraLarge');
    
    if (button) {
        const buttonType = button.getAttribute('type');
        console.log('찾은 버튼의 type:', buttonType);
        
        if (buttonType === 'submit') {
            // 버튼 클릭 이벤트 발생
            button.click();
            return true;
        }
    }
    
    console.log('버튼을 찾을 수 없거나 submit 타입이 아닙니다.');
    return false;
}

// 패널을 닫는 함수
function closePanel() {
    const panel = document.getElementById('llm-batcher-panel');
    if (panel) {
        panel.remove();
        // body의 margin 제거
        document.body.style.marginRight = '0';
    }
}

// 패널 토글 함수
function togglePanel() {
    const panel = document.getElementById('llm-batcher-panel');
    if (panel) {
        closePanel();
    } else {
        createPanel();
    }
}

// 파일 목록에 파일 경로 추가
function addFileToList(filePath) {
    const fileList = document.getElementById('file-list');
    if (fileList) {
        const fileItem = document.createElement('div');
        fileItem.textContent = filePath;
        fileItem.style.cssText = `
            padding: 5px;
            border-bottom: 1px solid #eee;
            word-break: break-all;
        `;
        fileList.appendChild(fileItem);
    }
}

// 패널 생성 함수
function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'llm-batcher-panel';
    panel.style.cssText = `
        position: fixed;
        right: 0;
        top: 0;
        width: 300px;
        height: 50vh;
        background-color: #ffffff;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        padding: 20px;
        box-sizing: border-box;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    `;
    
    // 파일 선택 버튼 생성
    const fileSelectButton = document.createElement('button');
    fileSelectButton.textContent = 'File select';
    fileSelectButton.style.cssText = `
        padding: 10px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-bottom: 10px;
    `;
    
    // 파일 선택 input 생성 (숨김)
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    
    // 파일 선택 이벤트 처리
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        for (let file of files) {
            addFileToList(file.path);
        }
    });
    
    // 파일 선택 버튼 클릭 이벤트
    fileSelectButton.onclick = () => {
        fileInput.click();
    };
    
    // 파일 목록 컨테이너 생성
    const fileListContainer = document.createElement('div');
    fileListContainer.style.cssText = `
        flex-grow: 1;
        overflow-y: auto;
        margin-bottom: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
    `;
    
    // 파일 목록 생성
    const fileList = document.createElement('div');
    fileList.id = 'file-list';
    fileList.style.cssText = `
        padding: 10px;
    `;
    
    // 닫기 버튼 생성
    const closeButton = document.createElement('button');
    closeButton.textContent = '패널 닫기';
    closeButton.className = 'close-button';
    closeButton.style.cssText = `
        padding: 10px;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.3s;
    `;
    closeButton.onclick = closePanel;
    
    // 요소들을 패널에 추가
    fileListContainer.appendChild(fileList);
    panel.appendChild(fileSelectButton);
    panel.appendChild(fileInput);
    panel.appendChild(fileListContainer);
    panel.appendChild(closeButton);
    
    document.body.appendChild(panel);
}

// background script로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "togglePanel") {
        togglePanel();
    }
});

// 페이지 로드 시 패널 생성
window.addEventListener('load', createPanel); 