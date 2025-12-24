// --- 1. 宛先URLの読み込みと保存（最優先実行） ---
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    
    if (t) {
        try {
            // Base64デコード（日本語・特殊文字対応版）
            const decodedUrl = decodeURIComponent(escape(atob(t)));
            
            if (decodedUrl.includes('https://script.google.com')) {
                localStorage.setItem('teacherScriptUrl', decodedUrl);
                console.log("送信先URLを自動設定しました: " + decodedUrl);
            }
        } catch (e) {
            console.error("URL解析失敗", e);
        }
    }
})();

// グローバル変数
let radarVisible = [true, true, true, true, true];

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
    RT();
    RS();
    RE();
    LI();
    
    document.getElementById("gender").addEventListener("change", () => {
        const g = document.getElementById("gender").value;
        RT();
        RS();
        if (document.getElementById("radar").style.display !== "none") RR(g);
        if (document.getElementById("growth").style.display !== "none") RG(g);
        if (document.getElementById("correlation").style.display !== "none") RAnalysis(g);
        if (document.getElementById("tracking").style.display !== "none") updateTrackingView();
        LI();
    });
    
    document.getElementById("grade").addEventListener("change", U);
});

// 通知表示
function N(m, t = 'success') {
    const n = document.getElementById('notif');
    if (!n) return;
    n.textContent = m;
    n.className = `notification ${t}`;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
}

// 種目名短縮
function K(h) {
    if (h.includes("握")) return "握力";
    if (h.includes("上")) return "上体";
    if (h.includes("長")) return "長座";
    if (h.includes("横")) return "横";
    if (h.includes("持")) return "持";
    if (h.includes("シ")) return "シ";
    if (h.includes("50")) return "50m";
    if (h.includes("幅")) return "幅";
    if (h.includes("ハ")) return "ハ";
    return "";
}

// 時間変換
function TS(t) {
    if (!t.includes("'")) return parseFloat(t);
    const c = t.replace(/以下|以上/g, "").trim();
    const p = c.split("'");
    return parseInt(p[0]) * 60 + parseInt(p[1].replace("\"", ""));
}

// スコア計算
function CS(v, h, g) {
    const c = D[g].c;
    const k = K(h);
    let rv = k === "50m" || k === "持" ? Math.ceil(v * 100) / 100 : Math.floor(v);
    for (let j = 0; j < c.length; j++) {
        const r = c[j];
        const t = r[k];
        let m = false;
        if (t.includes("以上")) {
            const th = k === "持" ? TS(t) : parseFloat(t);
            if (rv >= th) m = true;
        } else if (t.includes("以下")) {
            const th = k === "持" ? TS(t) : parseFloat(t);
            if (rv <= th) m = true;
        } else if (t.includes("～")) {
            const p = t.split("～");
            let min = k === "持" ? TS(p[0]) : parseFloat(p[0]);
            let max = k === "持" ? TS(p[1]) : parseFloat(p[1]);
            if (k === "持") { if (rv >= min && rv <= max + 0.99) m = true; }
            else if (k === "50m") { if (rv >= min && rv <= max + 0.09) m = true; }
            else { if (rv >= min && rv <= max) m = true; }
        }
        if (m) return r.p;
    }
    return 0;
}

// テーブル描画
function RT() {
    const g = document.getElementById("gender").value;
    const h = D[g].h;
    let s = '<table><tr><th></th>';
    h.forEach(x => s += `<th>${x}</th>`);
    s += '</tr>';
    ["記録", "帯広市", "北海道", "全国"].forEach(r => {
        s += '<tr><td>' + r + '</td>';
        h.forEach((x, j) => {
            if (r === "記録") {
                if (j < 9) s += `<td><input type="number" id="i${j}" onchange="U()" step="0.01"></td>`;
                else s += `<td id="i9"><div>0</div><div>E</div></td>`;
            } else {
                let v = A[g][r][j];
                if (j === 9) { v = T[g][r]; s += `<td>${v}</td>`; }
                else { const sc = CS(v, x, g); s += `<td><div>${v}</div><div style="font-size:0.85em;color:#666">(${sc}点)</div></td>`; }
            }
        });
        s += '</tr>';
    });
    s += '</table>';
    document.getElementById("table").innerHTML = s;
}

// 点数表描画
function RS() {
    const g = document.getElementById("gender").value;
    const c = D[g].c;
    const h = D[g].h;
    let s = '<table><tr><th>点数</th>';
    h.slice(0, -1).forEach(x => s += `<th>${x}</th>`);
    s += '</tr>';
    c.forEach((r, ri) => {
        s += `<tr><td>${r.p}</td>`;
        h.slice(0, -1).forEach((x, ci) => { s += `<td id="s${ri}-${ci}">${r[K(x)]}</td>`; });
        s += '</tr>';
    });
    s += '</table>';
    document.getElementById("score").innerHTML = s;
}

// 評価表描画
function RE() {
    let s = '<table><tr><th>段階</th><th>中1</th><th>中2</th><th>中3</th></tr>';
    E.forEach(r => { s += `<tr><td>${r.s}</td><td id="e${r.s}1">${r.c1}</td><td id="e${r.s}2">${r.c2}</td><td id="e${r.s}3">${r.c3}</td></tr>`; });
    s += '</table>';
    document.getElementById("eval").innerHTML = s;
}

// データ計算・保存
function U() {
    const g = document.getElementById("gender").value;
    const gr = parseInt(document.getElementById("grade").value);
    const c = D[g].c;
    const h = D[g].h;
    let tot = 0;
    c.forEach((r, ri) => h.slice(0, -1).forEach((x, ci) => {
        const el = document.getElementById(`s${ri}-${ci}`);
        if (el) el.style.background = '';
    }));
    E.forEach(r => [1, 2, 3].forEach(a => {
        const el = document.getElementById(`e${r.s}${a}`);
        if (el) el.classList.remove("highlight");
    }));
    let scores = [];
    h.slice(0, -1).forEach((x, i) => {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        if (isNaN(v)) { scores.push(null); return; }
        const k = K(x);
        let rv = k === "50m" || k === "持" ? Math.ceil(v * 100) / 100 : Math.floor(v);
        for (let j = 0; j < c.length; j++) {
            const r = c[j];
            const t = r[k];
            let m = false;
            if (t.includes("以上")) { const th = k === "持" ? TS(t) : parseFloat(t); if (rv >= th) m = true; }
            else if (t.includes("以下")) { const th = k === "持" ? TS(t) : parseFloat(t); if (rv <= th) m = true; }
            else if (t.includes("～")) {
                const p = t.split("～");
                let min = k === "持" ? TS(p[0]) : parseFloat(p[0]);
                let max = k === "持" ? TS(p[1]) : parseFloat(p[1]);
                if (k === "持") { if (rv >= min && rv <= max + 0.99) m = true; }
                else if (k === "50m") { if (rv >= min && rv <= max + 0.09) m = true; }
                else { if (rv >= min && rv <= max) m = true; }
            }
            if (m) { scores.push(r.p); const el = document.getElementById(`s${j}-${i}`); if (el) el.style.background = '#cceeff'; break; }
        }
    });
    const endS = scores[4] || 0;
    const shuS = scores[5] || 0;
    if (endS > 0 && shuS > 0) {
        tot = (scores[0]||0)+(scores[1]||0)+(scores[2]||0)+(scores[3]||0)+Math.max(endS, shuS)+(scores[6]||0)+(scores[7]||0)+(scores[8]||0);
    } else {
        scores.forEach(sc => { if (sc !== null) tot += sc; });
    }
    const scArea = document.getElementById("i9");
    let lv = "E";
    for (let i = 0; i < E.length; i++) {
        const r = E[i]; const rg = r[`c${gr}`];
        let min, max;
        if (rg.includes("以上")) { min = parseFloat(rg); max = Infinity; }
        else if (rg.includes("以下")) { min = -Infinity; max = parseFloat(rg); }
        else if (rg.includes("～")) { [min, max] = rg.split("～").map(Number); }
        else { min = max = parseFloat(rg); }
        if (tot >= min && tot <= max) { lv = r.s; break; }
    }
    scArea.querySelector("div").textContent = tot;
    scArea.querySelectorAll("div")[1].textContent = lv;
    const highlightEl = document.getElementById(`e${lv}${gr}`);
    if (highlightEl) highlightEl.classList.add("highlight");
    SI();
}

function SI() {
    const g = document.getElementById("gender").value;
    let v = [];
    for (let i = 0; i < 9; i++) { v.push(document.getElementById(`i${i}`).value || ""); }
    localStorage.setItem("m-" + g, JSON.stringify(v));
}

function LI() {
    const g = document.getElementById("gender").value;
    const sv = localStorage.getItem("m-" + g);
    if (sv) {
        const v = JSON.parse(sv);
        for (let i = 0; i < v.length; i++) {
            const input = document.getElementById(`i${i}`);
            if (input) input.value = v[i];
        }
        U();
    }
}

// --- 先生に送信処理（エラー対策強化版） ---
function sendToTeacher() {
    const targetUrl = localStorage.getItem('teacherScriptUrl');
    
    if (!targetUrl || targetUrl === "null" || targetUrl === "") {
        alert('【エラー】送信先のURLが見つかりません。\n\n「初回設定」ボタンからウェブアプリURLを保存するか、先生から配られた専用URL（?t=...）から開き直してください。');
        return;
    }

    const sid = prompt('出席番号を入力してください');
    if (!sid) return;
    const name = prompt('氏名を入力してください');
    if (!name) return;
    
    let vals = [];
    for (let i = 0; i < 9; i++) {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        vals.push(isNaN(v) ? "" : v);
    }
    
    const data = {
        studentId: sid,
        name: name,
        gender: document.getElementById('gender').value,
        grade: document.getElementById('grade').value,
        class: document.getElementById('class').value,
        session: document.getElementById('session').value,
        grip: vals[0], situp: vals[1], forward: vals[2], sidestep: vals[3],
        endurance: vals[4], shuttle: vals[5], sprint50: vals[6], jump: vals[7], throw: vals[8]
    };

    N('送信中...', 'info');

    // 通信処理
    fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',  // セキュリティ制限を回避
        cache: 'no-cache',
        headers: {
            'Content-Type': 'text/plain' // GASで受け取るための最も安定した設定
        },
        body: JSON.stringify(data)
    })
    .then(() => {
        // no-corsでは成功判定が取れないため、実行されたら成功とみなす
        N('送信リクエストを完了しました！', 'success');
        alert('送信完了しました。\nスプレッドシートに反映されているか確認してください。');
    })
    .catch(err => {
        console.error("Fetch error:", err);
        N('送信エラーが発生しました', 'error');
        // エラー内容が "Load failed" の場合のアドバイスを表示
        if(err.message === "Load failed" || err.name === "TypeError") {
            alert('エラー詳細：' + err + '\n\n【考えられる原因】\n1. GASのデプロイ設定が「全員(Anyone)」になっていない\n2. 広告ブロック等の拡張機能が通信を止めている\n3. iPhoneの「サイト越えトラッキング防止」がオンになっている');
        } else {
            alert('エラー詳細：' + err);
        }
    });
}
// --- データ管理機能（クリア） ---

// 3. クリア：入力した記録をすべて消去する
// --- データ管理機能（確実に消去する版） ---

function clearData() {
    // 1. 確認ダイアログを出す
    if (confirm("入力したすべての記録を消去してもよろしいですか？")) {
        
        // 2. データの保存場所（localStorage）を空にする
        const g = document.getElementById("gender").value;
        localStorage.removeItem("m-" + g);
        
        // 3. 入力欄（input）をすべて空文字にする
        for (let i = 0; i < 9; i++) {
            const inputField = document.getElementById(`i${i}`);
            if (inputField) {
                inputField.value = ""; // 文字を消す
            }
        }
        
        // 4. 合計点や評価の表示（i9）をリセットする
        const scoreArea = document.getElementById("i9");
        if (scoreArea) {
            scoreArea.innerHTML = "<div>0</div><div>E</div>";
        }

        // 5. グラフや表のハイライトを更新する
        if (typeof U === "function") {
            U(); 
        }

        // 6. 完了通知
        N("記録をすべて消去しました", "info");
        
        // 念のため画面を再読み込み（これで確実に消えます）
        // location.reload(); // もしこれを入れるとページ全体がリフレッシュされます
    }
}
// --- 履歴保存機能（末尾に追加） ---
function saveYearData() {
    const g = document.getElementById("gender").value;
    const grade = document.getElementById("grade").value;
    const points = [];
    
    // 表から8種目の点数を取得（現在の入力値）
    for(let i=0; i<8; i++) {
        const row = document.querySelector(`#table tr:nth-child(${i+1})`);
        points.push(row ? parseInt(row.cells[2].innerText) || 0 : 0);
    }
    
    // 履歴としてブラウザに保存
    let history = JSON.parse(localStorage.getItem("history-" + g) || "{}");
    history[grade] = points;
    localStorage.setItem("history-" + g, JSON.stringify(history));
    
    // グラフが開いていれば即時更新
    if (document.getElementById('radar').style.display !== 'none') {
        updateRadarChart();
    }
    alert("中" + grade + "の記録をグラフに固定しました。");
}
// 【保存機能】今の学年の点数を履歴として保存する関数
function saveYearData() {
    const g = document.getElementById("gender").value;
    const grade = document.getElementById("grade").value;
    const points = [];
    
    // 表（table）から今の点数（1〜10点）を8種目分抜き出す
    for(let i=0; i<8; i++) {
        // 表の各行の3番目のセル（点数が入っている場所）を取得
        const row = document.querySelector(`#table tr:nth-child(${i+1})`);
        const p = row ? parseInt(row.cells[2].innerText) : 0;
        points.push(isNaN(p) ? 0 : p);
    }
    
    // 過去の全履歴を読み出し、今回の学年分を上書きして保存し直す
    let history = JSON.parse(localStorage.getItem("history-" + g) || "{}");
    history[grade] = points;
    localStorage.setItem("history-" + g, JSON.stringify(history));
    
    // グラフが開いている状態なら、その場でグラフを更新する
    if (document.getElementById('radar').style.display !== 'none') {
        updateRadarChart();
    }
    
    alert("中" + grade + "年生の記録として保存しました。グラフに反映されます。");
}
