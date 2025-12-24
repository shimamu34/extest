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
        alert('URLを保存しました。配布用URLを生徒に伝えてください。');
    } else {
        alert('正しいURLを入力してください。');
    }
}

function displayStudentUrl(teacherUrl) {
    const encodedUrl = btoa(teacherUrl);
    const baseUrl = window.location.origin + window.location.pathname;
    const studentUrl = baseUrl + '?t=' + encodedUrl;
    document.getElementById('studentUrlArea').style.display = 'block';
    document.getElementById('studentDistUrl').innerText = studentUrl;
}

function copyStudentUrl() {
    const url = document.getElementById('studentDistUrl').innerText;
    navigator.clipboard.writeText(url).then(() => alert('生徒配布用URLをコピーしました！'));
}
