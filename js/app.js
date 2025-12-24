(function() {
    // URLの ?t= 以降をチェック
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    
    if (t) {
        try {
            const decodedUrl = atob(t);
            if (decodedUrl.indexOf('https://script.google.com') !== -1) {
                // ブラウザの保存領域に上書き保存
                localStorage.setItem('teacherScriptUrl', decodedUrl);
                console.log("送信先URLを更新しました: " + decodedUrl);
                
              
            }
        } catch (e) {
            console.error("URLデコードエラー:", e);
        }
    }
})();

// グローバル変数
let radarVisible = [true, true, true, true, true];
let SCRIPT_URL = '';

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
    // URLパラメータからスクリプトURLを取得
    checkTeacherUrl();
    
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

// URLパラメータから先生のスクリプトURLを取得して保存
function checkTeacherUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedUrl = urlParams.get('t');
    
    if (encodedUrl) {
        try {
            // Base64デコード
            const decodedUrl = atob(encodedUrl);
            
            // localStorageに保存
            localStorage.setItem('teacherScriptUrl', decodedUrl);
            SCRIPT_URL = decodedUrl;
            
            console.log('先生のスクリプトURLを保存しました:', decodedUrl);
            
            // URLパラメータを除去してクリーンなURLに変更
            const cleanUrl = window.location.href.split('?')[0];
            window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {
            console.error('URLデコードエラー:', e);
        }
    } else {
        // localStorageから読み込み
        const savedUrl = localStorage.getItem('teacherScriptUrl');
        if (savedUrl) {
            SCRIPT_URL = savedUrl;
            console.log('保存されたスクリプトURLを読み込みました');
        }
    }
}

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
        tot = scores[0] + scores[1] + scores[2] + scores[3] + Math.max(enduranceScore, shuttleScore) + scores[6] + scores[7] + scores[8];
    } else {
        scores.forEach((sc, i) => {
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
            document.getElementById(`i${i}`).value = v[i];
        }
        U();
    }
}

// データエクスポート
function exportData() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    
    let v = [];
    for (let i = 0; i < 9; i++) {
        v.push(parseFloat(document.getElementById(`i${i}`).value) || null);
    }
    
    const yearKey = `y-${g}`;
    const yearData = JSON.parse(localStorage.getItem(yearKey) || '{}');
    
    const trackingKey = `tracking-${g}`;
    const trackingData = JSON.parse(localStorage.getItem(trackingKey) || '{}');
    
    const bd = {
        v: "2.0",
        d: new Date().toISOString(),
        g: g,
        gr: parseInt(gr),
        vals: v,
        yearData: yearData,
        trackingData: trackingData
    };
    
    const js = JSON.stringify(bd, null, 2);
    const blob = new Blob([js], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `体力完全版_${g === 'male' ? '男' : '女'}_中${gr}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    N('全データをバックアップしました！');
}

// データインポート
function importData() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.onchange = e => {
        const f = e.target.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = ev => {
            try {
                const bd = JSON.parse(ev.target.result);
                if (!bd.v) {
                    N('無効なファイル', 'error');
                    return;
                }
                
                document.getElementById("gender").value = bd.g;
                document.getElementById("grade").value = bd.gr;
                RT();
                RS();
                bd.vals.forEach((v, i) => {
                    const inp = document.getElementById(`i${i}`);
                    if (inp && v !== null) inp.value = v;
                });
                U();
                
                if (bd.yearData) {
                    const yearKey = `y-${bd.g}`;
                    localStorage.setItem(yearKey, JSON.stringify(bd.yearData));
                }
                
                if (bd.trackingData) {
                    const trackingKey = `tracking-${bd.g}`;
                    localStorage.setItem(trackingKey, JSON.stringify(bd.trackingData));
                }
                
                N('全データを復元しました！');
            } catch (err) {
                N('読み込み失敗', 'error');
                console.error(err);
            }
        };
        r.readAsText(f);
    };
    inp.click();
}

// データクリア
function clearAllData() {
    if (!confirm('データをクリアしますか？')) return;
    for (let i = 0; i < 9; i++) {
        document.getElementById(`i${i}`).value = '';
    }
    localStorage.removeItem("m-" + document.getElementById("gender").value);
    U();
    N('クリア完了', 'info');
}

// 年次データ保存
function saveYearData() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    let v = [];
    let hasAnyData = false;
    
    for (let i = 0; i < 9; i++) {
        const val = parseFloat(document.getElementById(`i${i}`).value);
        if (!isNaN(val)) {
            hasAnyData = true;
            v.push(val);
        } else {
            v.push(null);
        }
    }
    
    if (!hasAnyData) {
        N('少なくとも1つの種目を入力してください', 'error');
        return;
    }
    
    const k = `y-${g}`;
    let yd = JSON.parse(localStorage.getItem(k) || '{}');
    yd[`中${gr}`] = {v: v, d: new Date().toISOString()};
    localStorage.setItem(k, JSON.stringify(yd));
    N(`中${gr}を記録しました！`);
    
    if (document.getElementById("growth").style.display !== "none") {
        RG(g);
    }
}

// 先生に送信
function sendToTeacher() {
    if (!SCRIPT_URL) {
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
    
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(() => {
        N('先生に送信しました！', 'success');
    }).catch(err => {
        N('送信に失敗しました', 'error');
        console.error(err);
    });
}
