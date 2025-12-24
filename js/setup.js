function showSetupGuide() {
    document.getElementById('setupModal').style.display = 'block';
    const savedUrl = localStorage.getItem('teacherScriptUrl');
    if (savedUrl) displayStudentUrl(savedUrl);
}

function closeSetupGuide() {
    document.getElementById('setupModal').style.display = 'none';
}

function copyGsCode() {
    const code = document.getElementById('gsCodeSource').value;
    navigator.clipboard.writeText(code).then(() => alert('コードをコピーしました！'));
}

function saveGasUrl() {
    const url = document.getElementById('gasUrlInput').value.trim();
    if (url.startsWith('https://script.google.com')) {
        localStorage.setItem('teacherScriptUrl', url);
        displayStudentUrl(url);
        alert('設定を保存しました。下の「生徒配布用URL」をコピーしてください。');
    } else {
        alert('正しいURLを入力してください。');
    }
}

function displayStudentUrl(teacherUrl) {
    const encodedUrl = btoa(unescape(encodeURIComponent(teacherUrl)));
    let baseUrl = window.location.origin + window.location.pathname;
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    const studentUrl = baseUrl + '?t=' + encodedUrl;
    
    document.getElementById('studentUrlArea').style.display = 'block';
    document.getElementById('studentDistUrlInput').value = studentUrl;
}

function copyStudentUrl() {
    const input = document.getElementById('studentDistUrlInput');
    input.select();
    document.execCommand('copy');
    alert('配布用URLをコピーしました！');
}
