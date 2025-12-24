// セットアップガイド用JavaScript
let currentStep = 0;

function showSetupGuide() {
    console.log('showSetupGuide関数が呼ばれました');
    N('初回設定ガイドを開きます', 'info');
    
    currentStep = 0;
    const modal = document.getElementById('setupModal');
    
    if (modal) {
        modal.style.display = 'block';
        renderCurrentStep();
        console.log('モーダルを表示しました');
    } else {
        console.error('setupModal要素が見つかりません');
        N('モーダル要素が見つかりません', 'error');
    }
}

function closeSetupGuide() {
    console.log('closeSetupGuide関数が呼ばれました');
    const modal = document.getElementById('setupModal');
    if (modal) {
        modal.style.display = 'none';
        console.log('モーダルを閉じました');
    }
}

function nextStep() {
    currentStep++;
    console.log('次のステップへ:', currentStep);
    renderCurrentStep();
}

function prevStep() {
    currentStep--;
    console.log('前のステップへ:', currentStep);
    renderCurrentStep();
}

function renderCurrentStep() {
    const content = document.getElementById('setupContent');
    if (!content) return;
    
    console.log('ステップを描画:', currentStep);
    
    const steps = [
        // ステップ0: 開始画面
        `<div style="text-align:center">
            <h2 style="color:#FF5722;font-size:32px;margin-bottom:20px">🎯 初回設定ガイド</h2>
            <p style="font-size:18px;line-height:1.8;color:#666;margin-bottom:30px">
                生徒から送られてくる記録を<br>
                あなたのGoogleスプレッドシートで<br>
                自動管理できるようにします！
            </p>
            <div style="background:#f5f5f5;padding:20px;border-radius:12px;margin-bottom:30px">
                <p style="margin:10px 0">⏱️ <strong>所要時間:</strong> 約15～20分</p>
                <p style="margin:10px 0">🔧 <strong>必要なもの:</strong> Googleアカウント</p>
            </div>
            <div style="margin-top:40px">
                <button class="btn" style="background:linear-gradient(135deg,#FF5722,#FF7043);font-size:18px;padding:15px 50px" onclick="nextStep()">はじめる ▶</button>
            </div>
            <div style="margin-top:20px">
                <button class="btn" style="background:#999;padding:10px 30px" onclick="closeSetupGuide()">キャンセル</button>
            </div>
        </div>`,
        
        // ステップ1: URL入力画面
        `<div>
            <h3 style="color:#FF5722;margin-bottom:20px">🔗 スプレッドシートURL登録</h3>
            <div style="background:#fff3e0;padding:20px;border-radius:12px;border-left:5px solid #FF5722;margin-bottom:20px">
                <p style="margin:0;font-weight:bold">✅ Google Apps ScriptのURLを入力してください</p>
            </div>
            <p style="font-size:16px;line-height:1.8;margin-bottom:20px">
                デプロイで取得した「ウェブアプリURL」を下の欄に貼り付けてください：
            </p>
            <div style="margin:20px 0">
                <input type="text" id="teacherUrlInput" placeholder="https://script.google.com/macros/s/.../exec" 
                       style="width:100%;padding:15px;border:2px solid #FF5722;border-radius:8px;font-size:14px;box-sizing:border-box">
            </div>
            <p style="color:#666;font-size:14px;margin-top:10px">
                ※ URLは「https://script.google.com/」で始まり「/exec」で終わります
            </p>
            <div style="margin-top:30px;display:flex;justify-content:space-between">
                <button class="btn" style="background:#999" onclick="prevStep()">◀ 戻る</button>
                <button class="btn" style="background:linear-gradient(135deg,#4CAF50,#66BB6A)" onclick="saveUrlAndNext()">保存して次へ ▶</button>
            </div>
        </div>`,
        
        // ステップ2: 保存確認画面
        `<div>
            <h3 style="color:#4CAF50;margin-bottom:20px">✅ 保存確認</h3>
            <div style="background:#e8f5e9;padding:20px;border-radius:12px;margin-bottom:20px">
                <p style="margin:0 0 10px 0;font-weight:bold">保存されたURL:</p>
                <div style="background:white;padding:10px;border-radius:8px;word-break:break-all;font-size:13px;color:#1976d2">
                    ${localStorage.getItem('teacherScriptUrl') || '（未保存）'}
                </div>
            </div>
            <p style="margin-top:20px;line-height:1.8">
                このURLが正しく保存されました。<br>
                次のステップで生徒配布用URLを生成します。
            </p>
            <div style="margin-top:30px;display:flex;justify-content:space-between">
                <button class="btn" style="background:#999" onclick="prevStep()">◀ 戻る</button>
                <button class="btn" style="background:linear-gradient(135deg,#FF5722,#FF7043)" onclick="nextStep()">次へ ▶</button>
            </div>
        </div>`,
        
        // ステップ3: 生徒配布用URL生成
        `<div style="text-align:center">
            <h2 style="color:#4CAF50;font-size:32px;margin-bottom:20px">🎉 設定完了！</h2>
            <p style="font-size:18px;line-height:1.8;color:#666;margin-bottom:30px">
                これで生徒が送信したデータが<br>
                あなたのスプレッドシートに自動で記録されます！
            </p>
            <div style="background:#e8f5e9;padding:30px;border-radius:15px;margin:30px 0;border:3px solid #4CAF50">
                <h3 style="color:#2e7d32;margin-bottom:20px">📱 生徒配布用URL</h3>
                <p style="color:#666;margin-bottom:15px">以下のURLをGoogle Classroomなどで生徒に配布してください：</p>
                <div style="background:white;padding:15px;border-radius:8px;word-break:break-all;margin-bottom:15px;border:2px solid #4CAF50">
                    <code id="studentDistUrl" style="font-size:13px;color:#1976d2">${generateStudentUrl()}</code>
                </div>
                <button class="btn" style="background:linear-gradient(135deg,#2196F3,#42A5F5);padding:12px 30px" onclick="copyStudentUrl()">📋 URLをコピー</button>
            </div>
            <div style="background:#fff3e0;padding:20px;border-radius:12px;margin-top:20px">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#666">
                    💡 <strong>使い方：</strong><br>
                    1. 上のURLをコピー<br>
                    2. Google Classroomの「課題」または「お知らせ」に貼り付け<br>
                    3. 生徒がこのURLから開くと、自動であなたのスプレッドシートに送信されます
                </p>
            </div>
            <div style="margin-top:40px">
                <button class="btn" style="background:linear-gradient(135deg,#FF5722,#FF7043);padding:15px 40px" onclick="closeSetupGuide()">完了</button>
            </div>
            <div style="margin-top:20px">
                <button class="btn" style="background:#999;padding:10px 30px" onclick="prevStep()">◀ 戻る</button>
            </div>
        </div>`
    ];
    
    if (currentStep < 0) currentStep = 0;
    if (currentStep >= steps.length) currentStep = steps.length - 1;
    
    content.innerHTML = steps[currentStep];
}

function saveUrlAndNext() {
    const urlInput = document.getElementById('teacherUrlInput');
    if (!urlInput) {
        N('入力欄が見つかりません', 'error');
        return;
    }
    
    const url = urlInput.value.trim();
    
    if (!url) {
        N('URLを入力してください', 'error');
        return;
    }
    
    if (!url.startsWith('https://script.google.com/')) {
        N('正しいGoogle Apps ScriptのURLを入力してください', 'error');
        return;
    }
    
    if (!url.endsWith('/exec')) {
        N('URLは「/exec」で終わる必要があります', 'error');
        return;
    }
    
    try {
        localStorage.setItem('teacherScriptUrl', url);
        SCRIPT_URL = url;
        console.log('URLを保存しました:', url);
        N('URLを保存しました！', 'success');
        
        setTimeout(() => {
            nextStep();
        }, 500);
    } catch (e) {
        console.error('保存エラー:', e);
        N('保存に失敗しました', 'error');
    }
}

function generateStudentUrl() {
    const teacherUrl = localStorage.getItem('teacherScriptUrl');
    if (!teacherUrl) {
        return '（URLが保存されていません）';
    }
    
    try {
        const encodedUrl = btoa(teacherUrl);
        const currentUrl = window.location.href.split('?')[0];
        const studentUrl = `${currentUrl}?t=${encodedUrl}`;
        
        console.log('生徒配布用URL:', studentUrl);
        return studentUrl;
    } catch (e) {
        console.error('URL生成エラー:', e);
        return '（URL生成に失敗しました）';
    }
}

function copyStudentUrl() {
    const urlElement = document.getElementById('studentDistUrl');
    if (!urlElement) {
        N('URL要素が見つかりません', 'error');
        return;
    }
    
    const url = urlElement.textContent;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            console.log('URLをコピーしました:', url);
            N('生徒配布用URLをコピーしました！', 'success');
        }).catch(err => {
            console.error('コピー失敗:', err);
            N('コピーに失敗しました', 'error');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            N('生徒配布用URLをコピーしました！', 'success');
        } catch (err) {
            N('コピーに失敗しました', 'error');
        }
        document.body.removeChild(textarea);
    }
}
