// 初回設定モーダルを表示する
function showSetupGuide() {
    const modal = document.getElementById('setupModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// モーダルを閉じる
function closeSetupGuide() {
    const modal = document.getElementById('setupModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 入力されたURLをブラウザに保存する
function saveGasUrl() {
    const urlInput = document.getElementById('gasUrlInput');
    const url = urlInput.value.trim();

    if (url.startsWith('https://script.google.com')) {
        // localStorageに保存（app.jsで利用する名前 'teacherScriptUrl' に合わせる）
        localStorage.setItem('teacherScriptUrl', url);
        alert('設定が完了しました！これで先生への送信が可能になります。');
        closeSetupGuide();
        // ページを再読み込みして反映させる
        location.reload();
    } else {
        alert('URLが正しくありません。https://script.google.com で始まるURLを入力してください。');
    }
}
