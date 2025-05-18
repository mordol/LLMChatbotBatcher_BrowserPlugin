// 전역 변수로 파일 목록 저장
let selectedFiles = [];
// 작업 취소 플래그
let isCancelled = false;

// 파일과 문자열을 받아 처리하는 함수
async function processFileAndDownload(file, content) {
    try {
        // 파일명에서 확장자 분리
        const lastDotIndex = file.name.lastIndexOf('.');
        const fileName = file.name.substring(0, lastDotIndex);
        const fileExt = file.name.substring(lastDotIndex);
        
        // 새로운 파일명 생성
        const newFileName = `${fileName}_result${fileExt}`;
        
        // Blob 생성
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // background script에 다운로드 요청
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "downloadFile",
                url: url,
                filename: newFileName,
                saveAs: false
            }, (response) => {
                // Blob URL 해제
                URL.revokeObjectURL(url);
                
                if (response && response.success) {
                    resolve(newFileName);
                } else {
                    reject(new Error(response?.error || '파일 저장 실패'));
                }
            });
        });
    } catch (error) {
        throw new Error(`파일 ${file.name} 처리 중 오류 발생: ${error.message}`);
    }
}

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
        
        //console.log('텍스트가 성공적으로 입력되었습니다:', text);
    } else {
        console.log('textarea를 찾을 수 없습니다.');
    }
}

// textarea를 초기화하는 함수
function clearTextarea() {
    const textarea = document.querySelector('textarea[aria-invalid="false"][placeholder="Send a message"]');
    
    if (textarea) {
        // textarea 초기화
        textarea.value = '';
        
        // input 이벤트 발생시키기
        const inputEvent = new Event('input', { bubbles: true });
        textarea.dispatchEvent(inputEvent);
    }
}

// 버튼을 찾는 함수
function findSubmitButton() {
    return document.querySelector('button.MuiButtonBase-root.MuiIconButton-root.MuiIconButton-sizeExtraLarge');
}

// 저장된 버튼의 type이 submit인지 확인하는 함수
function checkSubmitAvailable() {

    const submitButton = findSubmitButton();

    if (!submitButton) {
        return false;
    }
    
    const buttonType = submitButton.getAttribute('type');
    return buttonType === 'submit';
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

// 파일 목록에 파일 추가
function addFileToList(fileName) {
    const fileList = document.getElementById('file-list');
    if (fileList) {
        const fileItem = document.createElement('div');
        fileItem.textContent = fileName;
        fileItem.style.cssText = `
            padding: 5px;
            border-bottom: 1px solid #eee;
            word-break: break-all;
            font-size: 14px;
            color: #333;
        `;
        fileList.appendChild(fileItem);
    }
}

// Last chatbot message 찾는 함수
function findLastChatbotMessage() {
    const messages = document.querySelectorAll('div.css-3h66yh');
    if (messages.length > 0) {
        return messages[messages.length - 1].textContent;
    }
}

// background script로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "togglePanel") {
        togglePanel();
    }
});

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
    fileSelectButton.textContent = '파일 선택';
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
        if (files.length > 0) {
            // 파일 목록을 전역 변수에 저장
            selectedFiles = Array.from(files);
            console.log('선택된 파일 목록:', selectedFiles);
            
            // 파일 목록 초기화
            const fileList = document.getElementById('file-list');
            fileList.innerHTML = '';
            
            // 파일 목록에 파일 추가
            for (let file of selectedFiles) {
                addFileToList(file.name);
            }
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
        background-color: #f9f9f9;
    `;
    
    // 파일 목록 생성
    const fileList = document.createElement('div');
    fileList.id = 'file-list';
    fileList.style.cssText = `
        padding: 10px;
    `;
    
    // 작업 시작 버튼 생성
    const startButton = document.createElement('button');
    startButton.textContent = '작업 시작';
    startButton.style.cssText = `
        padding: 10px;
        background-color: #9C27B0;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        margin-bottom: 10px;
    `;
    
    // 버튼 활성화/비활성화 함수
    function setButtonsEnabled(enabled) {
        fileSelectButton.disabled = !enabled;
        closeButton.disabled = !enabled;
        
        // 비활성화 시 시각적 피드백
        const buttons = [fileSelectButton, closeButton];
        buttons.forEach(button => {
            button.style.opacity = enabled ? '1' : '0.5';
            button.style.cursor = enabled ? 'pointer' : 'not-allowed';
        });
    }

    // 작업 처리 함수
    async function processFiles() {
        // 작업 취소 플래그 초기화
        isCancelled = false;
        
        // 시작 버튼을 취소 버튼으로 변경
        startButton.textContent = '취소';
        startButton.style.backgroundColor = '#ff4444';
        
        // 다른 버튼들 비활성화
        setButtonsEnabled(false);

        try {
            // 1. 파일 개수 확인
            if (selectedFiles.length === 0) {
                statusDisplay.textContent = '오류: 선택된 파일이 없습니다.';
                return;
            }
            statusDisplay.textContent = `처리 시작: 0/${selectedFiles.length}`;

            let processedCount = 0;
            const TIMEOUT_DURATION = 60000; // 1분

            // 2. 파일 개수만큼 반복
            for (let i = 0; i < selectedFiles.length; i++) {
                // 취소 확인
                if (isCancelled) {
                    statusDisplay.textContent = `작업 취소됨: ${processedCount}/${selectedFiles.length} 파일 처리됨`;
                    break;
                }

                try {
                    const file = selectedFiles[i];
                    
                    // 3. 파일 내용을 textarea에 입력
                    const text = await file.text();
                    inputTextToTextarea(text);

                    // 4. submit 버튼 클릭
                    const submitButton = findSubmitButton();
                    if (!submitButton) {
                        statusDisplay.textContent = '오류: 전송 버튼을 찾을 수 없습니다.';
                        break;
                    }
                    submitButton.click();

                    // 5. 1초 대기
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // 6. waiting 메시지 입력
                    inputTextToTextarea("waiting...");

                    // 7. submit 버튼 사용 가능할 때까지 대기
                    const startTime = Date.now();
                    let isSubmitAvailable = false;

                    while (Date.now() - startTime < TIMEOUT_DURATION) {
                        // 취소 확인
                        if (isCancelled) {
                            statusDisplay.textContent = `작업 취소됨: ${processedCount}/${selectedFiles.length} 파일 처리됨`;
                            break;
                        }

                        if (checkSubmitAvailable()) {
                            isSubmitAvailable = true;
                            break;
                        }
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                    if (isCancelled) {
                        break;
                    }

                    if (!isSubmitAvailable) {
                        statusDisplay.textContent = `오류: 응답 대기 시간 초과 (${processedCount}/${selectedFiles.length})`;
                        break;
                    }

                    // 8. 응답 메시지 가져와서 파일 저장
                    const response = findLastChatbotMessage();
                    await processFileAndDownload(file, response);

                    // 9. 진행 상황 업데이트
                    processedCount++;
                    statusDisplay.textContent = `작업중... ${processedCount}/${selectedFiles.length}`;

                } catch (error) {
                    statusDisplay.textContent = `오류 발생: ${error.message} (${processedCount}/${selectedFiles.length})`;
                    break;
                }
            }

            // 10. 작업 완료 메시지
            if (!isCancelled) {
                statusDisplay.textContent = `작업 완료: 총 ${processedCount}개 파일 처리됨`;
            }

            clearTextarea();
        } finally {
            // 버튼 상태 초기화
            startButton.textContent = '작업 시작';
            startButton.style.backgroundColor = '#9C27B0';
            setButtonsEnabled(true);
        }
    }

    // 작업 시작 버튼 클릭 이벤트
    startButton.onclick = () => {
        if (startButton.textContent === '취소') {
            isCancelled = true;
        } else {
            processFiles();
        }
    };
    
    // 진행 상황 표시 생성
    const statusDisplay = document.createElement('div');
    statusDisplay.id = 'status-display';
    statusDisplay.style.cssText = `
        padding: 10px;
        text-align: left;
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #f9f9f9;
        min-height: 40px;
        line-height: 1.4;
    `;
    statusDisplay.textContent = '대기 중...';
    
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
    panel.appendChild(startButton);
    panel.appendChild(statusDisplay);
    panel.appendChild(closeButton);
    
    document.body.appendChild(panel);
}

// 페이지 로드 시 패널 생성
window.addEventListener('load', createPanel); 