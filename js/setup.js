function showSetupGuide() {
    document.getElementById('setupModal').style.display = 'block';
}

function closeSetupGuide() {
    document.getElementById('setupModal').style.display = 'none';
}

function copyGsCode() {
    const code = document.getElementById('gsCodeSource').value;
    navigator.clipboard.writeText(code).then(() => {
        alert('スクリプトをコピーしました！Apps Scriptに貼り付けてください。');
    }).catch(err => {
        alert('コピーに失敗しました。手動でコピーしてください。');
    });
}

function saveGasUrl() {
    const url = document.getElementById('gasUrlInput').value.trim();
    if (url.startsWith('https://script.google.com')) {
        localStorage.setItem('teacherScriptUrl', url);
        alert('URLを保存しました！');
        location.reload();
    } else {
        alert('正しいURLを入力してください。');
    }
}
