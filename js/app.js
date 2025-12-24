// URLから設定を読み込む（最優先）
(function() {
    const search = window.location.search;
    if (search) {
        const urlParams = new URLSearchParams(search);
        const t = urlParams.get('t');
        if (t) {
            try {
                const decodedUrl = atob(t);
                if (decodedUrl.includes('https://script.google.com')) {
                    localStorage.setItem('teacherScriptUrl', decodedUrl);
                    console.log("送信先URLを保存しました");
                }
            } catch (e) {
                console.error("解析エラー", e);
            }
        }
    }
})();

// 以降、前回の app.js の続き...

// --- 1. 宛先URLの読み込みと保存（最優先実行） ---
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    if (t) {
        try {
            const decodedUrl = atob(t);
            if (decodedUrl.includes('https://script.google.com')) {
                localStorage.setItem('teacherScriptUrl', decodedUrl);
                console.log("送信先URLを自動設定しました");
                // 【修正ポイント】ここにあったURLを消す処理(replaceState)を削除しました
            }
        } catch (e) {
            console.error("URL解析失敗", e);
        }
    }
})();

// グローバル変数
let radarVisible = [true, true, true, true, true];
let SCRIPT_URL = localStorage.getItem('teacherScriptUrl') || ''; // 初期値として保存済みURLを読み込む

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
    // テーブルと評価基準の初期化
    RT();
    RS();
    RE();
    LI();
    
    // イベントリスナーの設定
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
    n.textContent = m;
    n.className = `notification ${t}`;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
}

// 種目名を短縮形に変換
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

// 時間文字列を秒数に変換
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
            let min, max;
            if (k === "持") {
                min = TS(p[0]);
                max = TS(p[1]);
                if (rv >= min && rv <= max + 0.99) m = true;
            } else {
                min = parseFloat(p[0]);
                max = parseFloat(p[1]);
                if (k === "50m") {
                    if (rv >= min && rv <= max + 0.09) m = true;
                } else {
                    if (rv >= min && rv <= max) m = true;
                }
            }
        }
        
        if (m) return r.p;
    }
    return 0;
}

// テーブルレンダリング
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
                if (j === 9) {
                    v = T[g][r];
                    s += `<td>${v}</td>`;
                } else {
                    const sc = CS(v, x, g);
                    s += `<td><div>${v}</div><div style="font-size:0.85em;color:#666">(${sc}点)</div></td>`;
                }
            }
        });
        s += '</tr>';
    });
    s += '</table>';
    document.getElementById("table").innerHTML = s;
}

// 点数基準テーブルレンダリング
function RS() {
    const g = document.getElementById("gender").value;
    const c = D[g].c;
    const h = D[g].h;
    let s = '<table><tr><th>点数</th>';
    h.slice(0, -1).forEach(x => s += `<th>${x}</th>`);
    s += '</tr>';
    
    c.forEach((r, ri) => {
        s += `<tr><td>${r.p}</td>`;
        h.slice(0, -1).forEach((x, ci) => {
            s += `<td id="s${ri}-${ci}">${r[K(x)]}</td>`;
        });
        s += '</tr>';
    });
    s += '</table>';
    document.getElementById("score").innerHTML = s;
}

// 評価基準テーブルレンダリング
function RE() {
    let s = '<table><tr><th>段階</th><th>中1（13歳）</th><th>中2（14歳）</th><th>中3（15歳）</th></tr>';
    E.forEach(r => {
        s += `<tr><td>${r.s}</td><td id="e${r.s}1">${r.c1}</td><td id="e${r.s}2">${r.c2}</td><td id="e${r.s}3">${r.c3}</td></tr>`;
    });
    s += '</table>';
    document.getElementById("eval").innerHTML = s;
}

// データ更新と評価計算
function U() {
    const g = document.getElementById("gender").value;
    const gr = parseInt(document.getElementById("grade").value);
    const c = D[g].c;
    const h = D[g].h;
    let tot = 0;
    
    // ハイライトクリア
    c.forEach((r, ri) => h.slice(0, -1).forEach((x, ci) => {
        const el = document.getElementById(`s${ri}-${ci}`);
        if (el) el.style.background = '';
    }));
    
    E.forEach(r => [1, 2, 3].forEach(a => {
        const el = document.getElementById(`e${r.s}${a}`);
        if (el) el.classList.remove("highlight");
    }));
    
    // スコア計算
    let scores = [];
    h.slice(0, -1).forEach((x, i) => {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        if (isNaN(v)) {
            scores.push(null);
            return;
        }
        
        const k = K(x);
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
                let min, max;
                if (k === "持") {
                    min = TS(p[0]);
                    max = TS(p[1]);
                    if (rv >= min && rv <= max + 0.99) m = true;
                } else {
                    min = parseFloat(p[0]);
                    max = parseFloat(p[1]);
                    if (k === "50m") {
                        if (rv >= min && rv <= max + 0.09) m = true;
                    } else {
                        if (rv >= min && rv <= max) m = true;
                    }
                }
            }
            
            if (m) {
                scores.push(r.p);
                const el = document.getElementById(`s${j}-${i}`);
                if (el) el.style.background = '#cceeff';
                break;
            }
        }
    });
    
    // 持久走とシャトルランの処理
    const enduranceScore = scores[4] || 0;
    const shuttleScore = scores[5] || 0;
    
    if (enduranceScore > 0 && shuttleScore > 0) {
        tot = (scores[0]||0) + (scores[1]||0) + (scores[2]||0) + (scores[3]||0) + Math.max(enduranceScore, shuttleScore) + (scores[6]||0) + (scores[7]||0) + (scores[8]||0);
    } else {
        scores.forEach((sc) => {
            if (sc !== null) tot += sc;
        });
    }
    
    // 評価判定
    const sc = document.getElementById("i9");
    let lv = "E";
    
    for (let i = 0; i < E.length; i++) {
        const r = E[i];
        const rg = r[`c${gr}`];
        let min, max;
        
        if (rg.includes("以上")) {
            min = parseFloat(rg);
            max = Infinity;
        } else if (rg.includes("以下")) {
            min = -Infinity;
            max = parseFloat(rg);
        } else if (rg.includes("～")) {
            [min, max] = rg.split("～").map(Number);
        } else {
            min = max = parseFloat(rg);
        }
        
        if (tot >= min && tot <= max) {
            lv = r.s;
            break;
        }
    }
    
    sc.querySelector("div").textContent = tot;
    sc.querySelectorAll("div")[1].textContent = lv;
    
    const el = document.getElementById(`e${lv}${gr}`);
    if (el) el.classList.add("highlight");
    
    SI();
}

// データ保存
function SI() {
    const g = document.getElementById("gender").value;
    let v = [];
    for (let i = 0; i < 9; i++) {
        v.push(parseFloat(document.getElementById(`i${i}`).value) || "");
    }
    localStorage.setItem("m-" + g, JSON.stringify(v));
}

// データ読み込み
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

// 送信処理（修正版）
function sendToTeacher() {
    // 常に最新のURLをlocalStorageから取得
    const targetUrl = localStorage.getItem('teacherScriptUrl');
    
    if (!targetUrl) {
        N('先生のスクリプトURLが設定されていません', 'error');
        showSetupGuide();
        return;
    }
    
    const sid = prompt('出席番号を入力してください（例：15）');
    const name = prompt('氏名を入力してください');
    
    if (!sid || !name) {
        N('出席番号と氏名を入力してください', 'error');
        return;
    }
    
    let vals = [];
    for (let i = 0; i < 9; i++) {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        vals.push(isNaN(v) ? null : v);
    }
    
    const data = {
        studentId: sid,
        name: name,
        gender: document.getElementById('gender').value,
        grade: document.getElementById('grade').value,
        class: document.getElementById('class').value,
        session: document.getElementById('session').value,
        grip: vals[0],
        situp: vals[1],
        forward: vals[2],
        sidestep: vals[3],
        endurance: vals[4],
        shuttle: vals[5],
        sprint50: vals[6],
        jump: vals[7],
        throw: vals[8]
    };
    
    N('送信中...', 'info');
    
    fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(() => {
        N('先生に送信しました！', 'success');
    }).catch(err => {
        N('送信に失敗しました', 'error');
        console.error(err);
    });
}
