function showSetupGuide() {
    // ガイドを開く時に、入力欄と配布エリアを強制的に真っさらにする
    document.getElementById('gasUrlInput').value = ""; 
    document.getElementById('studentDistUrlInput').value = "";
    document.getElementById('studentUrlArea').style.display = "none";

    document.getElementById('setupModal').style.display = "block";
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

<div id="setupContent">
    <h2 style="color:#2b6cb0; border-bottom:2px solid #2b6cb0; padding-bottom:10px;">🏫 システム設定ガイド</h2>
    <div style="background:#f0f7ff; padding:20px; border-radius:10px; margin-bottom:20px; line-height:1.6;">
        <p>1. <strong>Googleスプレッドシート</strong>を作成し、GAS（Google Apps Script）をデプロイします。</p>
        <p>2. 発行された「ウェブアプリURL」を下の欄に貼り付けてください。</p>
        <p>3. 「保存」を押すと、送信機能が有効になります。</p>
    </div>
    <input type="text" id="gasUrlInput" placeholder="https://script.google.com/macros/s/..." style="width:100%; padding:12px; border:2px solid #ddd; border-radius:8px; margin-bottom:15px; font-size:16px;">
    <button onclick="saveGasUrl()" class="btn btn-send" style="width:100%; padding:15px;">設定を保存して閉じる</button>
</div>
