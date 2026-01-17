// app.js

// グローバル変数
var radarVisible = radarVisible || [true, true, true, true, true, true];

// --- 1. 宛先URLの読み込みと保存 ---
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('t');
    if (t) {
        try {
            const decodedUrl = decodeURIComponent(escape(atob(t)));
            if (decodedUrl.includes('https://script.google.com')) {
                // キーを 'gasUrl' に統一
                localStorage.setItem('gasUrl', decodedUrl);
                console.log("送信先URLを自動設定しました: " + decodedUrl);
            }
        } catch (e) {
            console.error("URL解析失敗", e);
        }
    }
})();

// 初期化処理
document.addEventListener('DOMContentLoaded', function() {
    RT(); RS(); RE(); LI();
    
    document.getElementById("gender").addEventListener("change", () => {
        const g = document.getElementById("gender").value;
        RT(); RS();
        if (document.getElementById("radar").style.display !== "none") RR(g);
        if (document.getElementById("correlation").style.display !== "none") RAnalysis(g);
        if (document.getElementById("tracking").style.display !== "none") updateTrackingView();
        LI();
    });
    
    document.getElementById("grade").addEventListener("change", () => {
        LI();
    });
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

// 種目名短縮・時間変換・スコア計算などは既存のままでOK（中略）
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

function TS(t) {
    if (!t.includes("'")) return parseFloat(t);
    const c = t.replace(/以下|以上/g, "").trim();
    const p = c.split("'");
    return parseInt(p[0]) * 60 + parseInt(p[1].replace("\"", ""));
}

function CS(v, h, g) {
    // 追加：入力が空、null、undefined、または 0 の場合は 0 点を返す
    if (v === null || v === undefined || v === "" || parseFloat(v) === 0) {
        return 0;
    }
    const c = D[g].c; 
    const k = K(h);
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
        if (m) return r.p;
    }
    return 0;
}

// テーブル・評価描画
function RT() {
    const g = document.getElementById("gender").value;
    if (!D[g]) return;
    const h = D[g].h;
    
    const formatTime = (sec) => {
        const m = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        return `${m}'${s.toString().padStart(2, '0')}"`;
    };

    let s = '<table><tr><th></th>';
    h.forEach(x => s += `<th>${x}</th>`);
    s += '</tr>';
    ["記録", "帯広市", "北海道", "全国"].forEach(r => {
        s += '<tr><td>' + r + '</td>';
        h.forEach((x, j) => {
            if (r === "記録") {
                if (j === 4) { 
                    // 改行を排除し、inputの幅を38pxに微調整しました
                    s += `<td style="padding:2px; min-width:100px;"><div style="display:flex;align-items:center;justify-content:center;gap:2px;"><input type="number" id="i4_min" onchange="U()" placeholder="分" style="width:38px;text-align:center;padding:2px;">:<input type="number" id="i4_sec" onchange="U()" placeholder="秒" style="width:38px;text-align:center;padding:2px;"></div><input type="hidden" id="i4"></td>`;
                } else if (j < 9) {
                    s += `<td><input type="number" id="i${j}" onchange="U()" step="0.1" style="width:100%;box-sizing:border-box;"></td>`;
                } else {
                    s += `<td id="i9"><div>0</div><div>E</div></td>`;
                }
            } else {
                let v = A[g][r][j];
                let displayVal = (j === 4) ? formatTime(v) : v;
                if (j === 9) { 
                    v = T[g][r]; 
                    s += `<td>${v}</td>`; 
                } else { 
                    const sc = CS(v, x, g); 
                    s += `<td><div>${displayVal}</div><div style="font-size:0.8em;color:#666">(${sc}点)</div></td>`; 
                }
            }
        });
        s += '</tr>';
    });
    s += '</table>';
 　　document.getElementById("table").style.position = "relative";
    document.getElementById("table").innerHTML = '<div id="table-timestamp"></div>' + s;
    
    // 表示された直後に時刻を更新する
    updateTimestamp();
}

// 日時関係
function updateTimestamp() {
    const now = new Date();
    const f = (n) => n.toString().padStart(2, '0');

    const datePart = `${now.getFullYear()}.${f(now.getMonth() + 1)}.${f(now.getDate())}`;
    const timePart = `${f(now.getHours())}:${f(now.getMinutes())}:${f(now.getSeconds())}`;
    
    const tsArea = document.getElementById("table-timestamp");
    if (tsArea) {
        tsArea.style = `
            position: absolute;   /* 物理的な行数を作らずに浮かせる */
            right: 0;             /* 表の右端に合わせる */
            bottom: 100%;         /* 表の真上に配置 */
            margin-bottom: 4px;   /* 文字を大きくしたので、隙間を少しだけ広げました */
            
            text-align: right;
            font-size: 13px;      /* 文字を大きく調整 */
            color: #2b6cb0;       /* 青色 */
            background: transparent;
            padding: 0px 2px;
            font-family: monospace;
            line-height: 1.2;     /* 2段の間隔を少しゆったりめに */
            font-weight: bold;
            white-space: nowrap;
            z-index: 10;
        `;
        tsArea.innerHTML = `<div>${datePart}</div><div>${timePart}</div>`;
    }
}

function RS() {
    const g = document.getElementById("gender").value;
    const c = D[g].c; const h = D[g].h;
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

function RE() {
    let s = '<table><tr><th>段階</th><th>中1</th><th>中2</th><th>中3</th></tr>';
    E.forEach(r => { s += `<tr><td>${r.s}</td><td id="e${r.s}1">${r.c1}</td><td id="e${r.s}2">${r.c2}</td><td id="e${r.s}3">${r.c3}</td></tr>`; });
    s += '</table>';
    document.getElementById("eval").innerHTML = s;
}

function U() {
    // 【追加】分と秒を合体させて、隠し持った i4 に入れる
    const m = parseInt(document.getElementById("i4_min")?.value) || 0;
    const sec = parseInt(document.getElementById("i4_sec")?.value) || 0;
    const i4 = document.getElementById("i4");
    if (i4) {
        if (m > 0 || sec > 0) {
            i4.value = (m * 60) + sec;
        } else {
            i4.value = "";
        }
    }
    const g = document.getElementById("gender").value;
    const gr = parseInt(document.getElementById("grade").value);
    const c = D[g].c; const h = D[g].h;
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
        // 修正：isNaN(v) だけでなく v === 0 の場合も null（未入力扱い）として処理する
        if (isNaN(v) || v === 0) { 
            scores.push(null); 
            return; 
        }
        const k = K(x);
        let rv = k === "50m" || k === "持" ? Math.ceil(v * 100) / 100 : Math.floor(v);
        for (let j = 0; j < c.length; j++) {
            const r = c[j]; const t = r[k];
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
    const endS = scores[4] || 0; const shuS = scores[5] || 0;
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
        if (tot >= min && tot <= max) { lv = r.s; break; }
    }
    scArea.querySelector("div").textContent = tot;
    scArea.querySelectorAll("div")[1].textContent = lv;
    const highlightEl = document.getElementById(`e${lv}${gr}`);
    if (highlightEl) highlightEl.classList.add("highlight");
    SI();
    RAnalysis(g);
    updateTimestamp();
    if (typeof updateAllCharts === 'function') updateAllCharts();
}

function SI() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    let v = [];
    for (let i = 0; i < 9; i++) { v.push(document.getElementById(`i${i}`).value || ""); }
    let allData = JSON.parse(localStorage.getItem("y-" + g) || "{}");
    allData[gr] = v;
    localStorage.setItem("y-" + g, JSON.stringify(allData));
}

function LI() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const sv = localStorage.getItem("y-" + g);
    
    // 最初に持久走の分・秒入力欄をクリアしておく（これによって他学年の残骸を消す）
    const mField = document.getElementById("i4_min");
    const sField = document.getElementById("i4_sec");
    if (mField) mField.value = "";
    if (sField) sField.value = "";

    if (sv) {
        const allData = JSON.parse(sv);
        const v = allData[gr] || ["","","","","","","","",""];
        for (let i = 0; i < v.length; i++) {
            const input = document.getElementById(`i${i}`);
            if (input) {
                input.value = v[i];
                
                // --- 持久走の秒数を「分」と「秒」に分けて表示させる処理 ---
                if (i === 4 && v[i] !== "") {
                    const total = parseInt(v[i]);
                    if (mField && sField) {
                        mField.value = Math.floor(total / 60); 
                        sField.value = total % 60;             
                    }
                }
            }
        }
        U();
    } else {
        // データが全くない時のリセット処理
        for (let i = 0; i < 9; i++) {
            const input = document.getElementById(`i${i}`);
            if (input) input.value = "";
        }
        U();
    }
}

// --- 送信機能（修正版） ---
function sendToTeacher() {
    // 1. 通知を表示（これで「動いている感」を出します）
    N('送信処理を開始します...', 'info');

    const toHalfWidth = (str) => str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

    const name = prompt("氏名を入力してください");
    if (!name) { N('送信をキャンセルしました', 'info'); return; }

    let studentIdRaw = prompt("出席番号を入力してください（例：12）");
    if (!studentIdRaw) { N('送信をキャンセルしました', 'info'); return; }
    const studentId = toHalfWidth(studentIdRaw);

    // 2. URLの取得（gasUrl または teacherScriptUrl の両方を確認する）
    const gasUrl = localStorage.getItem('gasUrl') || localStorage.getItem('teacherScriptUrl');
    
    if (!gasUrl) {
        alert("送信先URLが見つかりません。初期設定をやり直してください。");
        N('送信エラー：URL未設定', 'error');
        return;
    }

    N('送信中...', 'info'); // 送信中の通知

    const data = {
        name: name,
        studentId: studentId,
        gender: document.getElementById('gender').value,
        grade: document.getElementById('grade').value,
        class: document.getElementById('class').value,
        session: document.getElementById('session').value,
        grip: document.getElementById('i0').value || "",
        situp: document.getElementById('i1').value || "",
        forward: document.getElementById('i2').value || "",
        sidestep: document.getElementById('i3').value || "",
        endurance: document.getElementById('i4').value || "",
        shuttle: document.getElementById('i5').value || "",
        sprint50: document.getElementById('i6').value || "",
        jump: document.getElementById('i7').value || "",
        throw: document.getElementById('i8').value || ""
    };

    fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
    })
    .then(() => {
        N('送信完了しました！', 'success');
        alert('先生のスプレッドシートへ送信が完了しました。');
    })
    .catch(err => {
        console.error("Fetch error:", err);
        N('送信失敗', 'error');
        alert('エラー詳細：' + err);
    });
}

// データ消去
function clearData() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    if (confirm(`中学${gr}年生の入力記録をすべて消去しますか？`)) {
        let allData = JSON.parse(localStorage.getItem("y-" + g) || "{}");
        delete allData[gr];
        localStorage.setItem("y-" + g, JSON.stringify(allData));
        
        // 1. 通常の入力欄（i0〜i8）をすべて空にする
        for (let i = 0; i < 9; i++) {
            const inputField = document.getElementById(`i${i}`);
            if (inputField) inputField.value = "";
        }
        
        // 2. 【追加】持久走専用の入力欄（分・秒）も空にする
        const mField = document.getElementById("i4_min");
        const sField = document.getElementById("i4_sec");
        if (mField) mField.value = "";
        if (sField) sField.value = "";
        
        U(); // 合計点や評価もリセット
        N(`中${gr}の記録を消去しました`, "info");
    }
}

function RAnalysis(g) {
            const h = D[g].h.slice(0, 9);
            
            // 自分のスコアを取得
            let myScores = [];
            let hasData = false;
            for (let i = 0; i < 9; i++) {
                const inp = document.getElementById(`i${i}`);
                const v = parseFloat(inp.value);
                if (!isNaN(v)) {
                    hasData = true;
                    myScores.push(CS(v, h[i], g));
                } else {
                    myScores.push(0);
                }
            }
            
            if (!hasData) {
                document.getElementById("fitnessPokedex").innerHTML = '<div style="grid-column:1/-1;text-align:center;color:white;opacity:0.8;padding:40px">データを入力すると図鑑が表示されます</div>';
                document.getElementById("totalRank").innerHTML = '';
                document.getElementById("goalSimulator").innerHTML = '';
                return;
            }
            
            // タイプ別レベル計算
// 0:握力, 1:上体起こし, 2:長座体前屈, 3:反復横とび, 4:持久走, 5:シャトルラン, 6:50m, 7:立ち幅跳び, 8:ハンドボール投げ

const calcAvg = (indices) => {
    const validScores = indices.map(i => myScores[i]).filter(s => s > 0);
    return validScores.length > 0 ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length : 0;
};

// パワー型：握力(0), 上体起こし(1), 立ち幅(7), ハンド(8)
const powerAvg = calcAvg([0, 1, 7, 8]); 

// 持久力型：(持久走(4) or シャトルラン(5)の高い方) と 上体起こし(1) の平均
const enduranceBest = Math.max(myScores[4], myScores[5]);
let eList = [];
if (enduranceBest > 0) eList.push(enduranceBest);
if (myScores[1] > 0) eList.push(myScores[1]); // 上体起こしは「1」番！
const enduranceAvg = eList.length > 0 ? eList.reduce((a, b) => a + b, 0) / eList.length : 0;

// 敏捷性型：反復横とび(3), 50m走(6), ハンドボール投(8)
const agilityAvg = calcAvg([3, 6, 8]);

// 柔軟性型：長座体前屈(2), 上体起こし(1)
const flexibilityAvg = calcAvg([2, 1]); // 長座は「2」、上体は「1」！

const types = [
    {name: 'パワー型', emoji: '💪', avg: powerAvg, color: '#f5576c'},
    {name: '持久力型', emoji: '🏃', avg: enduranceAvg, color: '#00f2fe'},
    {name: '敏捷性型', emoji: '⚡', avg: agilityAvg, color: '#38f9d7'},
    {name: '柔軟性型', emoji: '🤸', avg: flexibilityAvg, color: '#fee140'}
];
            
            // 図鑑表示
            let pokedexHtml = '';
            types.forEach(type => {
                const level = Math.floor(type.avg);
                const progress = (type.avg / 10) * 100;
                const nextLevel = Math.ceil(type.avg);
                const toNext = nextLevel - type.avg;
               
                pokedexHtml += `
                    pokedexHtml += `
            <div class="pokedex-card" style="--type-color: ${type.color}">
                <div style="display:block; text-align:center; margin-bottom:12px;">
                    <span style="font-size:48px; display:block; margin-bottom:8px; line-height:1">${type.emoji}</span>
                    <div>
                        <div style="font-size:18px; font-weight:bold; opacity:0.9; margin-bottom:2px">${type.name}</div>
                        <div style="font-size:18px; font-weight:900; line-height:1">Lv.${level}</div>
                    </div>
                </div>
                <div style="width:100%">
                    <div style="background:rgba(255,255,255,0.2); height:12px; border-radius:6px; overflow:hidden; margin-bottom:8px">
                        <div style="background:${type.color}; height:100%; width:${progress}%; transition:width 0.8s ease-out;"></div>
                    </div>
                    <div style="font-size:14px; font-weight:bold; text-align:center; line-height:1.3">
                        <span>${type.avg.toFixed(1)}点 / 10.0点</span>
                        ${toNext > 0 && toNext < 1 ? 
                            `<span style="font-size:12px; opacity:1; font-weight:bold; display:block; color: rgba(255,255,255,0.9);">
                                あと${toNext.toFixed(1)}点でLvアップ！
                            </span>` : ''}
                    </div>
                </div>
            </div>
        `;
            });
            
            document.getElementById("fitnessPokedex").innerHTML = pokedexHtml;
            // --- ここから追加：もしシミュレーターで目標が設定されていたらタイトルを維持する ---
            const currentGoalTitle = document.getElementById('goalTargetName');
            if (currentGoalTitle && currentGoalTitle.innerText === "あなたの体力タイプ図鑑") {
                // まだ目標ボタンが押されていない場合のみ、デフォルトに戻す（必要に応じて）
                currentGoalTitle.innerText = "あなたの体力タイプ図鑑";
            }
            // --- ここまで追加 ---
    
            // 総合評価
            // 持久系は高い方のみを採用し、合計8種目で計算
　　　const totalScore = 
    myScores[0] + myScores[1] + myScores[2] + myScores[3] + 
    Math.max(myScores[4], myScores[5]) + // 持久走 or シャトルラン
    myScores[6] + myScores[7] + myScores[8];
            const gr = parseInt(document.getElementById("grade").value);
            let rank = 'E';
            let rankMin = 0, rankMax = 0;
            
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
                
                if (totalScore >= min && totalScore <= max) {
                    rank = r.s;
                    rankMin = min;
                    rankMax = max;
                    break;
                }
            }
            
            const nextRankIndex = ['E', 'D', 'C', 'B', 'A'].indexOf(rank) + 1;
            const nextRank = nextRankIndex < 5 ? ['E', 'D', 'C', 'B', 'A'][nextRankIndex] : null;
            const toNextRank = nextRank ? (rankMax + 1 - totalScore) : 0;
            
            let totalHtml = `
                <div style="font-size:28px;margin-bottom:10px">総合評価: ${rank} (${totalScore}点)</div>
                ${nextRank ? `<div style="font-size:16px;opacity:0.9">次の${nextRank}評価まで: あと${toNextRank}点！</div>` : '<div style="font-size:16px;opacity:0.9">最高ランク達成！🎉</div>'}
            `;
            
            document.getElementById("totalRank").innerHTML = totalHtml;
            
            // 初期状態のシミュレーター表示
            //document.getElementById("goalSimulator").innerHTML = '<div style="text-align:center;color:#666;padding:40px">上のボタンから目標を選んでください</div>';
        }

function setGoal(goalType) {
    const g = document.getElementById("gender").value;
    const h = D[g].h.slice(0, 9);
    const gr = parseInt(document.getElementById("grade").value);
    
    let myScores = [];
    let myValues = [];
    for (let i = 0; i < 9; i++) {
        const inp = document.getElementById(`i${i}`);
        const v = parseFloat(inp.value);
        myValues.push(!isNaN(v) ? v : 0);
        myScores.push(!isNaN(v) ? CS(v, h[i], g) : 0);
    }
    
    // --- 修正ポイント：持久走(index 4)とシャトルラン(index 5)の判定 ---
    const scoreEndurance = myScores[4] || 0;
    const scoreShuttle = myScores[5] || 0;
    
    // 高い方の得点を選び、低い方を 0 にする（計算から除外する）
    let adjustedScores = [...myScores];
    if (scoreEndurance >= scoreShuttle) {
        adjustedScores[5] = 0; // シャトルランを除外
    } else {
        adjustedScores[4] = 0; // 持久走を除外
    }
    
    // 8種目ベースでの合計得点を算出
    const validScores = adjustedScores.filter(s => s > 0);
    const totalScore = validScores.reduce((a, b) => a + b, 0);
    // -----------------------------------------------------------
    
    let targetScore = 0;
    let goalTitle = '';
    let goalDesc = '';
    
    if (goalType === 'rankA') {
        const aRange = E.find(e => e.s === 'A')[`c${gr}`];
        targetScore = parseInt(aRange.replace('以上', ''));
        goalTitle = '🎯 総合A評価を目指す';
    } else if (goalType === 'rankB') {
        const bRange = E.find(e => e.s === 'B')[`c${gr}`];
        targetScore = parseInt(bRange.split('～')[0]);
        goalTitle = '🎯 総合B評価を目指す';
    } else if (goalType === 'rankC') {
        const cRange = E.find(e => e.s === 'C')[`c${gr}`];
        targetScore = parseInt(cRange.split('～')[0]);
        goalTitle = '🎯 総合C評価を目指す';
    } else if (goalType === 'rankD') {
        const dRange = E.find(e => e.s === 'D')[`c${gr}`];
        targetScore = parseInt(dRange.split('～')[0]);
        goalTitle = '🎯 総合D評価を目指す';
    }

    //document.getElementById('goalTargetName').innerText = goalTitle.replace('🎯 ', '');
    goalDesc = `現在${totalScore}点 → 目標${targetScore}点以上`;
    
    const pointsNeeded = Math.max(0, targetScore - totalScore);
    
    let html = `
        <div style="background:white;padding:25px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">
            <h5 style="margin:0 0 20px 0;font-size:20px;color:#9c27b0">${goalTitle}</h5>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:20px">
                <div style="font-size:16px;color:#666;margin-bottom:10px">${goalDesc}</div>
                <div style="font-size:24px;font-weight:bold;color:#9c27b0">必要な得点: +${pointsNeeded}点</div>
            </div>
    `;
    
    if (pointsNeeded > 0) {
        html += '<div style="margin-top:20px"><h6 style="color:#9c27b0;margin-bottom:15px;font-size:18px">💡 おすすめの伸ばし方</h6>';
        
        const improvements = [];
        h.forEach((header, i) => {
            // 計算に使われている種目（得点がある種目）のみ提案
            if (adjustedScores[i] > 0 && adjustedScores[i] < 10) {
                const potential = 10 - adjustedScores[i];
                const difficulty = adjustedScores[i] >= 7 ? '難しい' : adjustedScores[i] >= 5 ? '普通' : adjustedScores[i] >= 3 ? '簡単！' : 'とても簡単！';
                const diffColor = adjustedScores[i] >= 7 ? '#f44336' : adjustedScores[i] >= 5 ? '#FF9800' : adjustedScores[i] >= 3 ? '#4CAF50' : '#2196F3';
                improvements.push({
                    name: header, current: adjustedScores[i], potential: potential, difficulty: difficulty, diffColor: diffColor
                });
            }
        });
        
        // 未入力の種目（持久走/SRは高い方以外除外された状態）
        h.forEach((header, i) => {
            if (myScores[i] === 0) {
                // 持久走とSRの両方が0の場合は両方提案に出るが、片方入力済なら片方は無視される
                if (i === 4 && scoreShuttle > 0) return;
                if (i === 5 && scoreEndurance > 0) return;
                
                improvements.push({
                    name: header, current: 0, potential: 10, difficulty: '未測定', diffColor: '#9E9E9E'
                });
            }
        });
        
        improvements.sort((a, b) => (a.current === 0 ? 1 : b.current === 0 ? -1 : b.potential - a.potential));
        
        let totalRecommend = 0;
        let count = 0;
        improvements.forEach((imp) => {
            if (count < 5 && totalRecommend < pointsNeeded) {
                const recommend = imp.current === 0 ? 5 : Math.min(2, imp.potential, pointsNeeded - totalRecommend);
                if (recommend > 0) {
                    html += `
                        <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:10px;border-left:4px solid ${imp.diffColor}">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <div>
                                    <span style="font-weight:bold;font-size:16px">${imp.name}</span>
                                    <span style="color:#666;margin-left:10px">${imp.current === 0 ? '未測定 → 平均5点を目指す' : `現在${imp.current}点 → ${imp.current + recommend}点`}</span>
                                </div>
                                <span style="background:${imp.diffColor};color:white;padding:5px 12px;border-radius:20px;font-size:13px;font-weight:bold">${imp.difficulty}</span>
                            </div>
                        </div>
                    `;
                    totalRecommend += recommend;
                    count++;
                }
            }
        });
        
        html += `<div style="margin-top:20px;padding:15px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:8px;text-align:center;font-size:16px">
            ✨ これらを達成すれば目標クリア！頑張りましょう！
        </div></div>`;
    } else {
        html += '<div style="padding:20px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:white;border-radius:8px;text-align:center;font-size:18px">🎉 すでに目標達成しています！素晴らしい！</div>';
    }
    
    html += '</div>';
    document.getElementById("goalSimulator").innerHTML = html;
    document.querySelector("#correlation p").style.display = "none";
}
