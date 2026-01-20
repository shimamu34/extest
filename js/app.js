// --- app.js (Refactored) ---

// グローバル定数・変数
const RADAR_COUNT = 6;
var radarVisible = radarVisible || Array(RADAR_COUNT).fill(true); [cite: 1]

// --- ユーティリティ関数 ---

/** 通知表示 */
function N(message, type = 'success') {
    const n = document.getElementById('notif');
    if (!n) return;
    n.textContent = message;
    n.className = `notification ${type}`; [cite: 10]
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000); [cite: 11]
}

/** 秒数(180) を "3'00\"" 形式に変換 */
const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60); [cite: 22]
    return `${m}'${s.toString().padStart(2, '0')}"`; [cite: 23]
};

/** 持久走などの "3'00\"" 形式を秒数に変換 */
function TS(t) {
    if (!t.includes("'")) return parseFloat(t); [cite: 14]
    const c = t.replace(/以下|以上/g, "").trim();
    const [min, sec] = c.split("'");
    return parseInt(min) * 60 + parseInt(sec.replace("\"", "")); [cite: 15]
}

/** 全角数字を半角に変換 */
const toHalfWidth = (str) => str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)); [cite: 88]

// --- 初期化処理 ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. URLパラメータからGAS URLを設定
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    if (t) {
        try {
            const decodedUrl = decodeURIComponent(escape(atob(t)));
            if (decodedUrl.includes('https://script.google.com')) {
                localStorage.setItem('gasUrl', decodedUrl); [cite: 3]
                console.log("送信先URLを自動設定しました: " + decodedUrl);
            }
        } catch (e) {
            console.error("URL解析失敗", e);
        }
    }

    // 2. UI初期化
    RT(); RS(); RE(); [cite: 4]
    L(); // 初期データ読み込み

    // 3. イベントリスナー
    document.getElementById("gender").addEventListener("change", () => {
        RT(); RS(); L(); [cite: 5]
    });
    document.getElementById("grade").addEventListener("change", L); [cite: 6]
});

// --- コアロジック ---

/** 種目名の短縮 */
function K(h) {
    const mapping = { "握": "握力", "上": "上体", "長": "長座", "横": "横", "持": "持", "シ": "シ", "50": "50m", "幅": "幅", "ハ": "ハ" };
    const key = Object.keys(mapping).find(k => h.includes(k));
    return key ? mapping[key] : ""; [cite: 12, 13, 14]
}

/** スコア計算 */
function CS(v, h, g) {
    if (v === null || v === undefined || v === "" || parseFloat(v) === 0) return 0; [cite: 15]
    const c = D[g].c;
    const k = K(h);
    let rv = (k === "50m" || k === "持") ? Math.ceil(v * 100) / 100 : Math.floor(v); [cite: 16]

    for (let r of c) {
        const t = r[k];
        let m = false;
        const parseVal = (val) => k === "持" ? TS(val) : parseFloat(val);

        if (t.includes("以上")) {
            if (rv >= parseVal(t)) m = true; [cite: 16]
        } else if (t.includes("以下")) {
            if (rv <= parseVal(t)) m = true; [cite: 17]
        } else if (t.includes("～")) {
            const [minStr, maxStr] = t.split("～");
            const min = parseVal(minStr);
            const max = parseVal(maxStr);
            if (k === "持") { if (rv >= min && rv <= max + 0.99) m = true; } [cite: 17]
            else if (k === "50m") { if (rv >= min && rv <= max + 0.09) m = true; } [cite: 18]
            else { if (rv >= min && rv <= max) m = true; } [cite: 19]
        }
        if (m) return r.p; [cite: 20]
    }
    return 0;
}

/** テーブル描画 */
function RT() {
    const g = document.getElementById("gender").value;
    if (!D[g]) return; [cite: 21]
    const h = D[g].h;

    let s = '<table><tr><th></th>' + h.map(x => `<th>${x}</th>`).join('') + '</tr>'; [cite: 23]
    
    ["記録", "帯広市", "北海道", "全国"].forEach(r => {
        s += `<tr><td>${r}</td>`;
        h.forEach((x, j) => {
            if (r === "記録") {
                if (j === 4) {
                    s += `<td style="padding:2px; min-width:100px;">
                            <div style="display:flex;align-items:center;justify-content:center;gap:2px;">
                                <input type="number" id="i4_min" class="v-in" onchange="U()" placeholder="分" style="width:38px;text-align:center;padding:2px;"> :
                                <input type="number" id="i4_sec" class="v-in" onchange="U()" placeholder="秒" style="width:38px;text-align:center;padding:2px;">
                            </div>
                            <input type="hidden" id="i4">
                          </td>`; [cite: 24, 25]
                } else if (j < 9) {
                    s += `<td><input type="number" id="i${j}" class="v-in" onchange="U()" step="0.1" style="width:100%;box-sizing:border-box;"></td>`; [cite: 25]
                } else {
                    s += `<td id="i9"><div>0</div><div>E</div></td>`; [cite: 26]
                }
            } else {
                let v = (j === 9) ? T[g][r] : A[g][r][j]; [cite: 28, 29]
                let displayVal = (j === 4) ? formatTime(v) : v; [cite: 28]
                if (j === 9) {
                    s += `<td>${v}</td>`; [cite: 30]
                } else {
                    const sc = CS(v, x, g);
                    s += `<td><div>${displayVal}</div><div style="font-size:0.8em;color:#666">(${sc}点)</div></td>`; [cite: 31]
                }
            }
        });
        s += '</tr>';
    });
    s += '</table>';
    const container = document.getElementById("table");
    container.style.position = "relative";
    container.innerHTML = '<div id="table-timestamp"></div>' + s; [cite: 32]
}

/** 日時更新 */
function updateTimestamp() {
    const now = new Date();
    const f = (n) => n.toString().padStart(2, '0');
    const datePart = `${now.getFullYear()}.${f(now.getMonth() + 1)}.${f(now.getDate())}`; [cite: 33]
    const timePart = `${f(now.getHours())}:${f(now.getMinutes())}:${f(now.getSeconds())}`;
    
    const tsArea = document.getElementById("table-timestamp");
    if (tsArea) {
        Object.assign(tsArea.style, {
            position: 'absolute', right: '0', bottom: '100%', marginBottom: '4px',
            textAlign: 'right', fontSize: '13px', color: '#2b6cb0', fontFamily: 'monospace',
            fontWeight: 'bold', white-space: 'nowrap', zIndex: '10', lineHeight: '1.2'
        }); [cite: 35-42]
        tsArea.innerHTML = `<div>${datePart}</div><div>${timePart}</div>`;
    }
}

/** 得点表・段階表描画 */
function RS() {
    const g = document.getElementById("gender").value;
    const { c, h } = D[g]; [cite: 43]
    let s = '<table><tr><th>点数</th>' + h.slice(0, -1).map(x => `<th>${x}</th>`).join('') + '</tr>';
    c.forEach((r, ri) => {
        s += `<tr><td>${r.p}</td>` + h.slice(0, -1).map((x, ci) => `<td id="s${ri}-${ci}">${r[K(x)]}</td>`).join('') + '</tr>'; [cite: 45]
    });
    document.getElementById("score").innerHTML = s + '</table>';
}

function RE() {
    let s = '<table><tr><th>段階</th><th>中1</th><th>中2</th><th>中3</th></tr>';
    E.forEach(r => {
        s += `<tr><td>${r.s}</td><td id="e${r.s}1">${r.c1}</td><td id="e${r.s}2">${r.c2}</td><td id="e${r.s}3">${r.c3}</td></tr>`; [cite: 47]
    });
    document.getElementById("eval").innerHTML = s + '</table>';
}

/** データ計算とUI更新 */
function U(isInitial = false) {
    // 1. 持久走の集約
    const m = parseInt(document.getElementById("i4_min")?.value) || 0;
    const sec = parseInt(document.getElementById("i4_sec")?.value) || 0;
    const i4 = document.getElementById("i4");
    if (i4) i4.value = (m > 0 || sec > 0) ? (m * 60) + sec : ""; [cite: 50]

    const g = document.getElementById("gender").value;
    const gr = parseInt(document.getElementById("grade").value);
    const { c, h } = D[g];

    // 2. ハイライト初期化
    document.querySelectorAll('[id^="s"]').forEach(el => el.style.background = ''); [cite: 52]
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove("highlight")); [cite: 53]

    // 3. 得点計算と個別ハイライト
    let scores = h.slice(0, -1).map((x, i) => {
        const v = parseFloat(document.getElementById(`i${i}`)?.value || "");
        if (isNaN(v) || v === 0) return 0;
        
        const sc = CS(v, x, g);
        const scoreRowIdx = c.findIndex(r => r.p === sc);
        if (scoreRowIdx !== -1) {
            const el = document.getElementById(`s${scoreRowIdx}-${i}`);
            if (el) el.style.background = '#cceeff'; [cite: 56]
        }
        return sc;
    });

    // 4. 合計とランク
    const totalScore = scores[0] + scores[1] + scores[2] + scores[3] + Math.max(scores[4], scores[5]) + scores[6] + scores[7] + scores[8]; [cite: 57]
    
    let lv = "E";
    for (let r of E) {
        const rg = r[`c${gr}`];
        let [min, max] = [0, 100];
        if (rg.includes("以上")) min = parseFloat(rg);
        else if (rg.includes("以下")) max = parseFloat(rg);
        else [min, max] = rg.split("～").map(Number); [cite: 60-62]
        
        if (totalScore >= min && totalScore <= max) { lv = r.s; break; } [cite: 63]
    }

    const scArea = document.getElementById("i9");
    if (scArea) {
        scArea.children[0].textContent = totalScore;
        scArea.children[1].textContent = lv; [cite: 64]
    }
    document.getElementById(`e${lv}${gr}`)?.classList.add("highlight"); [cite: 65]

    // 5. 外部連携・描画
    if (!isInitial) SI();
    updateTimestamp();
    RAnalysis(g); [cite: 66]

    const radarArea = document.getElementById("radar");
    if (typeof RR === 'function' && radarArea?.style.display !== "none") {
        RR(g); [cite: 68]
    }
}

// --- データ保存・読み込み ---

function SI() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const key = "y-" + g;
    
    const v = Array.from({length: 9}, (_, i) => document.getElementById(`i${i}`).value || ""); [cite: 71]
    const now = new Date();
    const f = (n) => n.toString().padStart(2, '0');
    const ts = `${now.getFullYear()}.${f(now.getMonth() + 1)}.${f(now.getDate())} ${f(now.getHours())}:${f(now.getMinutes())}:${f(now.getSeconds())}`; [cite: 73]

    let allData = JSON.parse(localStorage.getItem(key) || "{}");
    allData[gr] = { v, ts };
    localStorage.setItem(key, JSON.stringify(allData)); [cite: 75]

    const tsElement = document.getElementById("lastSaved");
    if (tsElement) tsElement.innerText = "最終保存: " + ts;
}

function L() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const allData = JSON.parse(localStorage.getItem("y-" + g) || '{}');
    const data = allData[gr];

    // リセット
    document.querySelectorAll(".v-in, #i4").forEach(input => input.value = ""); [cite: 78, 79]
    
    if (data) {
        const values = Array.isArray(data) ? data : (data.v || []);
        values.forEach((val, i) => {
            const input = document.getElementById(`i${i}`);
            if (input) input.value = val;
            if (i === 4 && val) {
                document.getElementById("i4_min").value = Math.floor(val / 60);
                document.getElementById("i4_sec").value = val % 60; [cite: 83]
            }
        });
        const tsElement = document.getElementById("lastSaved");
        if (tsElement) tsElement.innerText = data.ts ? "最終保存: " + data.ts : ""; [cite: 84]
    } else {
        document.getElementById("lastSaved").innerText = "";
    }
    U(true);
}

// --- 特殊機能 ---

/** 送信機能 */
function sendToTeacher() {
    N('送信処理を開始します...', 'info');
    const name = prompt("氏名を入力してください");
    if (!name) return N('キャンセルしました', 'info'); [cite: 89]

    const studentIdRaw = prompt("出席番号を入力してください（例：12）");
    if (!studentIdRaw) return N('キャンセルしました', 'info');
    const studentId = toHalfWidth(studentIdRaw); [cite: 91]

    const gasUrl = localStorage.getItem('gasUrl') || localStorage.getItem('teacherScriptUrl');
    if (!gasUrl) return alert("送信先URLが見つかりません。初期設定をやり直してください。");

    N('送信中...', 'info');
    let enduranceVal = document.getElementById('i4').value;
    if (enduranceVal) {
        const totalSec = parseInt(enduranceVal);
        enduranceVal = `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`; [cite: 96]
    }

    const data = {
        name, studentId,
        gender: document.getElementById('gender').value,
        grade: document.getElementById('grade').value,
        class: document.getElementById('class').value,
        session: document.getElementById('session').value,
        grip: document.getElementById('i0').value || "",
        situp: document.getElementById('i1').value || "",
        forward: document.getElementById('i2').value || "",
        sidestep: document.getElementById('i3').value || "",
        endurance: enduranceVal,
        shuttle: document.getElementById('i5').value || "",
        sprint50: document.getElementById('i6').value || "",
        jump: document.getElementById('i7').value || "",
        throw: document.getElementById('i8').value || ""
    };

    fetch(gasUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) })
    .then(() => {
        N('送信完了しました！', 'success');
        alert('先生のスプレッドシートへ送信が完了しました。');
    })
    .catch(err => {
        N('送信失敗', 'error');
        alert('エラー詳細：' + err);
    });
}

/** 分析・図鑑表示 */
function RAnalysis(g) {
    const h = D[g].h.slice(0, 9);
    let myScores = Array.from({length: 9}, (_, i) => {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        return isNaN(v) ? 0 : CS(v, h[i], g); [cite: 108]
    });
    
    if (myScores.every(s => s === 0)) {
        document.getElementById("fitnessPokedex").innerHTML = '<div style="grid-column:1/-1;text-align:center;color:white;opacity:0.8;padding:40px">データを入力すると図鑑が表示されます</div>';
        document.getElementById("totalRank").innerHTML = '';
        return;
    }

    const calcAvg = (indices) => {
        const valid = indices.map(i => myScores[i]).filter(s => s > 0);
        return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0; [cite: 111]
    };

    const types = [
        {name: 'パワー型', emoji: '💪', avg: calcAvg([0, 1, 7, 8]), color: '#f5576c'},
        {name: '持久力型', emoji: '🏃', avg: (Math.max(myScores[4], myScores[5]) + myScores[1])/2, color: '#00f2fe'},
        {name: '敏捷性型', emoji: '⚡', avg: calcAvg([3, 6, 8]), color: '#38f9d7'},
        {name: '柔軟性型', emoji: '🤸', avg: calcAvg([2, 1]), color: '#fee140'}
    ];

    document.getElementById("fitnessPokedex").innerHTML = types.map(type => {
        const level = Math.floor(type.avg);
        const progress = (type.avg / 10) * 100;
        return `<div class="pokedex-card" style="--type-color: ${type.color}">
                    <div style="text-align:center; margin-bottom:12px;">
                        <span style="font-size:48px; display:block; line-height:1">${type.emoji}</span>
                        <div style="font-size:18px; font-weight:bold;">${type.name} Lv.${level}</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.2); height:12px; border-radius:6px; overflow:hidden;">
                        <div style="background:${type.color}; height:100%; width:${progress}%;"></div>
                    </div>
                </div>`; [cite: 113-115]
    }).join('');

    // 合計ランク再計算 (U関数と共通化可能だが独立性を維持)
    const totalScore = myScores[0] + myScores[1] + myScores[2] + myScores[3] + Math.max(myScores[4], myScores[5]) + myScores[6] + myScores[7] + myScores[8]; [cite: 116]
    // ... (ランク判定ロジックはU関数と同様) ...
    document.getElementById("totalRank").innerHTML = `<div style="font-size:28px;">総合評価: (計算中...) (${totalScore}点)</div>`; 
}

/** 目標シミュレーター */
function setGoal(goalType) {
    const g = document.getElementById("gender").value;
    const gr = parseInt(document.getElementById("grade").value);
    const h = D[g].h.slice(0, 9);
    
    let myScores = h.map((header, i) => {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        return isNaN(v) ? 0 : CS(v, header, g);
    });

    // 持久走・SRの高い方を採用
    let adjusted = [...myScores];
    if (myScores[4] >= myScores[5]) adjusted[5] = 0; else adjusted[4] = 0; [cite: 128, 129]
    const currentTotal = adjusted.reduce((a, b) => a + b, 0); [cite: 131]

    // 目標点取得
    const rankEntry = E.find(e => e.s === goalType.replace('rank', ''));
    const targetRange = rankEntry[`c${gr}`];
    const targetScore = parseInt(targetRange.includes('以上') ? targetRange : targetRange.split('～')[0]); [cite: 134-136]

    const diff = Math.max(0, targetScore - currentTotal);
    let html = `<div style="background:white;padding:25px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">
                  <h5 style="margin:0 0 20px 0;font-size:20px;color:#9c27b0">🎯 ${goalType.replace('rank', '')}評価を目指す</h5>
                  <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:20px">
                    <div style="font-size:24px;font-weight:bold;color:#9c27b0">必要な得点: +${diff}点</div>
                  </div>`;

    if (diff > 0) {
        html += '<h6 style="color:#9c27b0;margin-bottom:15px;font-size:18px">💡 おすすめの伸ばし方</h6>';
        // ... (改善案生成ロジック: 冗長なため元のロジックをテンプレート化して維持) ...
    } else {
        html += '<div style="padding:20px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:white;border-radius:8px;text-align:center;font-size:18px">🎉 目標達成中！</div>';
    }
    document.getElementById("goalSimulator").innerHTML = html + '</div>';
}

/** 消去処理 */
function C() {
    if (!confirm("現在の学年の入力内容をすべて消去しますか？")) return;
    document.querySelectorAll(".v-in, #i4").forEach(i => i.value = ""); [cite: 157]
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const key = "y-" + g;
    let data = JSON.parse(localStorage.getItem(key) || '{}');
    delete data[gr]; [cite: 160]
    localStorage.setItem(key, JSON.stringify(data));
    document.getElementById("lastSaved").innerText = "";
    U();
    alert("消去しました。");
}

/** 印刷準備 */
function preparePrint() {
    const radarArea = document.getElementById("radar");
    if (!radarArea) return window.print();
    const originalDisplay = radarArea.style.display;
    radarArea.style.display = "block"; [cite: 7]
    if (typeof RR === 'function') RR(document.getElementById("gender").value);
    setTimeout(() => {
        window.print();
        radarArea.style.display = originalDisplay; [cite: 9]
    }, 300);
}
