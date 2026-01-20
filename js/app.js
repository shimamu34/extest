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
                localStorage.setItem('gasUrl', decodedUrl);
                console.log("送信先URLを自動設定しました: " + decodedUrl);
            }
        } catch (e) {
            console.error("URL解析失敗", e);
        }
    }
})();

// --- 印刷用関数 ---
function preparePrint() {
    const gender = document.getElementById("gender").value;
    const radarArea = document.getElementById("radar");
    if (!radarArea) return window.print();
    const originalDisplay = radarArea.style.display;
    radarArea.style.display = "block";
    if (typeof RR === 'function') { RR(gender); }
    setTimeout(() => {
        window.print();
        radarArea.style.display = originalDisplay;
    }, 300);
}

// 通知表示
function N(m, t = 'success') {
    const n = document.getElementById('notif');
    if (!n) return;
    n.textContent = m;
    n.className = `notification ${t}`;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
}

// --- ユーティリティ関数 ---
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
    if (v === null || v === undefined || v === "" || parseFloat(v) === 0) return 0;
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

// --- テーブル描画 ---
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
                    s += `<td style="padding:2px; min-width:100px;">
                        <div style="display:flex;align-items:center;justify-content:center;gap:2px;">
                            <input type="number" id="i4_min" class="v-in" onchange="U()" placeholder="分" style="width:38px;text-align:center;padding:2px;">
                            :
                            <input type="number" id="i4_sec" class="v-in" onchange="U()" placeholder="秒" style="width:38px;text-align:center;padding:2px;">
                        </div>
                        <input type="hidden" id="i4">
                      </td>`;
                } else if (j < 9) {
                    s += `<td><input type="number" id="i${j}" class="v-in" onchange="U()" step="0.1" style="width:100%;box-sizing:border-box;"></td>`;
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
    const tableDiv = document.getElementById("table");
    tableDiv.style.position = "relative";
    tableDiv.innerHTML = '<div id="table-timestamp"></div>' + s;
}

// 日時更新
function updateTimestamp() {
    const now = new Date();
    const f = (n) => n.toString().padStart(2, '0');
    const datePart = `${now.getFullYear()}.${f(now.getMonth() + 1)}.${f(now.getDate())}`;
    const timePart = `${f(now.getHours())}:${f(now.getMinutes())}:${f(now.getSeconds())}`;
    const tsArea = document.getElementById("table-timestamp");
    if (tsArea) {
        tsArea.style = `position:absolute; right:0; bottom:100%; margin-bottom:4px; text-align:right; font-size:13px; color:#2b6cb0; font-family:monospace; font-weight:bold; white-space:nowrap; z-index:10;`;
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

// --- メイン計算更新関数 ---
function U(isInitial = false) {
    const m = parseInt(document.getElementById("i4_min")?.value) || 0;
    const sec = parseInt(document.getElementById("i4_sec")?.value) || 0;
    const i4 = document.getElementById("i4");
    if (i4) i4.value = (m > 0 || sec > 0) ? (m * 60) + sec : "";

    const g = document.getElementById("gender").value;
    const gr = parseInt(document.getElementById("grade").value);
    const c = D[g].c; const h = D[g].h;
    
    // ハイライトリセット
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
        const inputEl = document.getElementById(`i${i}`);
        const v = parseFloat(inputEl ? inputEl.value : "");
        if (isNaN(v) || v === 0) { scores.push(0); return; }
        const sc = CS(v, x, g);
        scores.push(sc);
        const scoreRowIdx = c.findIndex(r => r.p === sc);
        if (scoreRowIdx !== -1) {
            const el = document.getElementById(`s${scoreRowIdx}-${i}`);
            if (el) el.style.background = '#cceeff';
        }
    });

    const totalScore = scores[0] + scores[1] + scores[2] + scores[3] + Math.max(scores[4], scores[5]) + scores[6] + scores[7] + scores[8];
    const scArea = document.getElementById("i9");
    let lv = "E";
    for (let i = 0; i < E.length; i++) {
        const r = E[i]; const rg = r[`c${gr}`];
        let min, max;
        if (rg.includes("以上")) { min = parseFloat(rg); max = 100; }
        else if (rg.includes("以下")) { min = 0; max = parseFloat(rg); }
        else if (rg.includes("～")) { [min, max] = rg.split("～").map(Number); }
        if (totalScore >= min && totalScore <= max) { lv = r.s; break; }
    }
    
    if (scArea) {
        scArea.querySelector("div").textContent = totalScore;
        scArea.querySelectorAll("div")[1].textContent = lv;
    }
    const highlightEl = document.getElementById(`e${lv}${gr}`);
    if (highlightEl) highlightEl.classList.add("highlight");

    if (!isInitial) SI();
    updateTimestamp();
    RAnalysis(g); 
}

function SI() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const key = "y-" + g;
    let v = [];
    for (let i = 0; i < 9; i++) { v.push(document.getElementById(`i${i}`).value || ""); }
    const now = new Date();
    const f = (n) => n.toString().padStart(2, '0');
    const ts = `${now.getFullYear()}.${f(now.getMonth() + 1)}.${f(now.getDate())} ${f(now.getHours())}:${f(now.getMinutes())}:${f(now.getSeconds())}`;
    let allData = JSON.parse(localStorage.getItem(key) || "{}");
    allData[gr] = { v: v, ts: ts }; 
    localStorage.setItem(key, JSON.stringify(allData));
}

function L() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const allData = JSON.parse(localStorage.getItem("y-" + g) || '{}');
    const data = allData[gr];
    document.querySelectorAll(".v-in").forEach(input => { input.value = ""; });
    if (document.getElementById("i4")) document.getElementById("i4").value = "";
    if (document.getElementById("i4_min")) document.getElementById("i4_min").value = "";
    if (document.getElementById("i4_sec")) document.getElementById("i4_sec").value = "";

    if (data) {
        let values = Array.isArray(data) ? data : (data.v || []);
        values.forEach((val, i) => {
            const input = document.getElementById(`i${i}`);
            if (input) input.value = val;
            if (i === 4 && val) {
                const m = Math.floor(val / 60);
                const s = val % 60;
                if (document.getElementById("i4_min")) document.getElementById("i4_min").value = m;
                if (document.getElementById("i4_sec")) document.getElementById("i4_sec").value = s;
            }
        });
    }
    U(true); 
}

// --- 先生に送信 ---
function sendToTeacher() {
    N('送信処理を開始します...', 'info');
    const toHalfWidth = (str) => str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    const name = prompt("氏名を入力してください");
    if (!name) return;
    let studentIdRaw = prompt("出席番号を入力してください");
    if (!studentIdRaw) return;
    const studentId = toHalfWidth(studentIdRaw);
    const gasUrl = localStorage.getItem('gasUrl');
    if (!gasUrl) { alert("送信先URL未設定です"); return; }

    let enduranceVal = document.getElementById('i4').value || "";
    if (enduranceVal !== "") {
        const totalSec = parseInt(enduranceVal);
        enduranceVal = `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
    }

    const data = {
        name: name, studentId: studentId,
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
    .then(() => { N('送信完了！', 'success'); alert('送信完了しました'); })
    .catch(err => alert('エラー：' + err));
}

// --- 体力分析 & ランキング生成 ---
function RAnalysis(g) {
    const h = D[g].h.slice(0, 9);
    let myScores = [];
    let hasData = false;
    
    // データ取得
    for (let i = 0; i < 9; i++) {
        const inputEl = document.getElementById(`i${i}`);
        const v = inputEl ? parseFloat(inputEl.value) : NaN;
        if (!isNaN(v) && v !== 0) {
            hasData = true;
            myScores.push(CS(v, h[i], g));
        } else {
            myScores.push(0);
        }
    }
    
    // 図鑑表示
    if (!hasData) {
        document.getElementById("fitnessPokedex").innerHTML = '<div style="grid-column:1/-1;text-align:center;color:white;opacity:0.8;padding:40px">データを入力すると図鑑が表示されます</div>';
        document.getElementById("totalRank").innerHTML = '';
    } else {
        const calcAvg = (indices) => {
            const valid = indices.map(i => myScores[i]).filter(s => s > 0);
            return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        };
        const types = [
            {name: 'パワー型', emoji: '💪', avg: calcAvg([0, 1, 7, 8]), color: '#f5576c'},
            {name: '持久力型', emoji: '🏃', avg: (Math.max(myScores[4], myScores[5]) + myScores[1])/2, color: '#00f2fe'},
            {name: '敏捷性型', emoji: '⚡', avg: calcAvg([3, 6, 8]), color: '#38f9d7'},
            {name: '柔軟性型', emoji: '🤸', avg: calcAvg([2, 1]), color: '#fee140'}
        ];
        let pokedexHtml = '';
        types.forEach(type => {
            const level = Math.floor(type.avg);
            pokedexHtml += `<div class="pokedex-card" style="--type-color:${type.color}"><span style="font-size:48px;">${type.emoji}</span><div>${type.name} Lv.${level}</div></div>`;
        });
        document.getElementById("fitnessPokedex").innerHTML = pokedexHtml;
    }

    // --- 種目別ランキング表示の更新 ---
    const rb = document.getElementById("rankingBox");
    if (rb) {
        let rankData = [];
        h.forEach((name, i) => {
            const val = parseFloat(document.getElementById(`i${i}`).value);
            if (!isNaN(val) && val !== 0) {
                rankData.push({ name: name, score: CS(val, h[i], g) });
            }
        });
        rankData.sort((a, b) => b.score - a.score);

        if (rankData.length === 0) {
            rb.innerHTML = `<p style="text-align:center; color:#666; padding:20px;">データを入力するとランキングが表示されます</p>`;
        } else {
            let html = `<h3 style="text-align:center; color:#ed8936; margin-bottom:20px;">🏆 種目別ランキング（得点順）</h3><div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">`;
            rankData.forEach((item, index) => {
                let icon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                html += `<div style="background:#f7fafc; border:2px solid #e2e8f0; padding:10px 20px; border-radius:12px; font-weight:bold; text-align:center; min-width:120px;">
                    <div style="font-size:12px; color:#718096;">${index + 1}位</div>
                    <div style="font-size:16px;">${icon}${item.name}</div>
                    <div style="font-size:18px;">${item.score}点</div>
                </div>`;
            });
            rb.innerHTML = html + `</div>`;
        }
    }
}

// --- 目標シミュレーター ---
function setGoal(goalType) {
    const g = document.getElementById("gender").value;
    const h = D[g].h.slice(0, 9);
    const gr = parseInt(document.getElementById("grade").value);
    let myScores = [];
    for (let i = 0; i < 9; i++) {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        myScores.push(!isNaN(v) ? CS(v, h[i], g) : 0);
    }
    const totalScore = myScores[0] + myScores[1] + myScores[2] + myScores[3] + Math.max(myScores[4], myScores[5]) + myScores[6] + myScores[7] + myScores[8];
    
    let targetScore = 0;
    const goalObj = E.find(e => e.s === goalType.replace('rank', ''));
    if (goalObj) {
        const rg = goalObj[`c${gr}`];
        targetScore = rg.includes('以上') ? parseInt(rg) : parseInt(rg.split('～')[0]);
    }

    const pointsNeeded = Math.max(0, targetScore - totalScore);
    let html = `<div style="background:white;padding:25px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">
        <h5 style="color:#9c27b0; font-size:20px;">🎯 目標：${goalType.replace('rank', '')}評価 (${targetScore}点)</h5>
        <p>現在の合計：${totalScore}点 / あと <strong>${pointsNeeded}点</strong></p>`;
    
    if (pointsNeeded > 0) {
        html += `<p style="font-size:14px; color:#666;">※伸びしろのある種目から強化しましょう！</p>`;
    } else {
        html += `<p style="color:green; font-weight:bold;">🎉 目標達成中！</p>`;
    }
    document.getElementById("goalSimulator").innerHTML = html + `</div>`;
}

function C() {
    if (!confirm("現在の学年の入力内容を消去しますか？")) return;
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    let allData = JSON.parse(localStorage.getItem("y-" + g) || '{}');
    delete allData[gr];
    localStorage.setItem("y-" + g, JSON.stringify(allData));
    L();
    alert("消去しました。");
}
