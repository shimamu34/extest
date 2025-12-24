function showSetupGuide() {
    document.getElementById('setupModal').style.display = 'block';
}

function closeSetupGuide() {
    document.getElementById('setupModal').style.display = 'none';
}

// 提示されたコードをコピーする機能
function copyGsCode() {
    const code = document.getElementById('gsCodeSource').value;
    navigator.clipboard.writeText(code).then(() => {
        alert('Apps Script用のコードをコピーしました！\nスプレッドシートの「Apps Script」に貼り付けてください。');
    }).catch(err => {
        // バックアップ用のコピー処理
        const textArea = document.getElementById('gsCodeSource');
        textArea.style.display = 'block';
        textArea.select();
        document.execCommand('copy');
        textArea.style.display = 'none';
        alert('コードをコピーしました。');
    });
}

// URLをブラウザに保存する機能
function saveGasUrl() {
    const url = document.getElementById('gasUrlInput').value.trim();
    if (url.startsWith('https://script.google.com')) {
        // app.js側で読み込んでいる変数名 'teacherScriptUrl' に合わせて保存
        localStorage.setItem('teacherScriptUrl', url);
        alert('URLを登録しました。これで「先生に送信」ボタンが使えるようになります。');
        closeSetupGuide();
        location.reload(); // 設定を反映させるためにリロード
    } else {
        alert('正しいウェブアプリURLを入力してください。');
    }
}
