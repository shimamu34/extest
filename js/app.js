// ==========================================
// 1. グローバル変数・初期設定
// ==========================================
var radarVisible = radarVisible || [true, true, true, true, true, true];

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

// ==========================================
// 2. ページ初期化処理
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    RT(); RS(); RE(); 
    L(); // ページを開いた時に現在の学年データを読み込む
    
    document.getElementById("gender").addEventListener("change", () => {
        RT(); RS(); 
        L(); 
    });
    
    document.getElementById("grade").addEventListener("change", () => {
        L(); 
    });
});

// ==========================================
// 3. ユーティリティ関数（名称短縮・変換・通知）
// ==========================================
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

function N(m, t = 'success') {
    const n = document.getElementById('notif');
    if (!n) return;
    n.textContent = m;
    n.className = `notification ${t}`;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
}

// ==========================================
// 4. 計算・判定ロジック
// ==========================================
function CS(v, h, g) {
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

// ==========================================
// 5. テーブル描画（ログ・得点表・評価表）
// ==========================================
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
    document.getElementById("table").style.position = "relative";
    document.getElementById("table").innerHTML = '<div id="table-timestamp"></div>' + s;
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

// ==========================================
// 6. 更新処理（U関数）
// ==========================================
function U(isInitial = false) {
    const m = parseInt(document.getElementById("i4_min")?.value) || 0;
    const sec = parseInt(document.getElementById("i4_sec")?.value) || 0;
    const i4 = document.getElementById("i4");
    if (i4) i4.value = (m > 0 || sec > 0) ? (m * 60) + sec : "";

    const g = document.getElementById("gender").value;
    const gr = parseInt(document.getElementById("grade").value);
    const c = D[g].c; const h = D[g].h;

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

    const totalScore = scores[0] + scores[1] + scores[2] + scores[3] + 
                       Math.max(scores[4], scores[5]) + 
                       scores[6] + scores[7] + scores[8];

    const scArea = document.getElementById("i9");
    let lv = "E";
    for (let i = 0; i < E.length; i++) {
        const r = E[i];
        const rg = r[`c${gr}`];
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

    if (typeof RR === 'function') {
        const radarArea = document.getElementById("radar");
        if (radarArea && radarArea.style.display !== "none") {
            RR(g);
        }
    }

    if (typeof renderRanking === 'function') {
        const ra = document.getElementById("ranking");
        if (ra && ra.style.display !== "none") renderRanking();
    }
}

// ==========================================
// 7. データ保存・読み込み（SI/L関数）
// ==========================================
function SI() {
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const key = "y-" + g;
    let v = [];
    for (let i = 0; i < 9; i++) { 
        v.push(document.getElementById(`i${i}`).value || "");
    }
    const now = new Date();
    const f = (n) => n.toString().padStart(2, '0');
    const ts = `${now.getFullYear()}.${f(now.getMonth() + 1)}.${f(now.getDate())} ${f(now.getHours())}:${f(now.getMinutes())}:${f(now.getSeconds())}`;
    let allData = JSON.parse(localStorage.getItem(key) || "{}");
    allData[gr] = { v: v, ts: ts };
    localStorage.setItem(key, JSON.stringify(allData));
    const tsElement = document.getElementById("lastSaved");
    if (tsElement) tsElement.innerText = "最終保存: " + ts;
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
        let timestamp = data.ts || "";
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
        const tsElement = document.getElementById("lastSaved");
        if (tsElement) tsElement.innerText = timestamp ? "最終保存: " + timestamp : "";
    } else {
        const tsElement = document.getElementById("lastSaved");
        if (tsElement) tsElement.innerText = "";
    }
    U(true);
}

// ==========================================
// 8. 分析・目標シミュレーター・特殊機能
// ==========================================
function updateTimestamp() {
    const now = new Date();
    const f = (n) => n.toString().padStart(2, '0');
    const datePart = `${now.getFullYear()}.${f(now.getMonth() + 1)}.${f(now.getDate())}`;
    const timePart = `${f(now.getHours())}:${f(now.getMinutes())}:${f(now.getSeconds())}`;
    const tsArea = document.getElementById("table-timestamp");
    if (tsArea) {
        tsArea.style = `position: absolute; right: 0; bottom: 100%; margin-bottom: 4px; text-align: right; font-size: 13px; color: #2b6cb0; background: transparent; padding: 0px 2px; font-family: monospace; line-height: 1.2; font-weight: bold; white-space: nowrap; z-index: 10;`;
        tsArea.innerHTML = `<div>${datePart}</div><div>${timePart}</div>`;
    }
}

function sendToTeacher() {
    N('送信処理を開始します...', 'info');
    const toHalfWidth = (str) => str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    const name = prompt("氏名を入力してください");
    if (!name) { N('送信をキャンセルしました', 'info'); return; }
    let studentIdRaw = prompt("出席番号を入力してください（例：12）");
    if (!studentIdRaw) { N('送信をキャンセルしました', 'info'); return; }
    const studentId = toHalfWidth(studentIdRaw);
    const gasUrl = localStorage.getItem('gasUrl') || localStorage.getItem('teacherScriptUrl');
    if (!gasUrl) {
        alert("送信先URLが見つかりません。初期設定をやり直してください。");
        N('送信エラー：URL未設定', 'error');
        return;
    }
    N('送信中...', 'info');
    let enduranceVal = document.getElementById('i4').value || "";
    if (enduranceVal !== "") {
        const totalSec = parseInt(enduranceVal);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        enduranceVal = `${m}:${s.toString().padStart(2, '0')}`;
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

function RAnalysis(g) {
    const h = D[g].h.slice(0, 9);
    let myScores = [];
    let hasData = false;
    for (let i = 0; i < 9; i++) {
        const v = parseFloat(document.getElementById(`i${i}`).value);
        if (!isNaN(v)) { hasData = true; myScores.push(CS(v, h[i], g)); }
        else { myScores.push(0); }
    }
    if (!hasData) {
        document.getElementById("fitnessPokedex").innerHTML = '<div style="grid-column:1/-1;text-align:center;color:white;opacity:0.8;padding:40px">データを入力すると図鑑が表示されます</div>';
        document.getElementById("totalRank").innerHTML = '';
        return;
    }
    const calcAvg = (indices) => {
        const validScores = indices.map(i => myScores[i]).filter(s => s > 0);
        return validScores.length > 0 ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length : 0;
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
        const progress = (type.avg / 10) * 100;
        pokedexHtml += `<div class="pokedex-card" style="--type-color: ${type.color}"><div style="text-align:center; margin-bottom:12px;"><span style="font-size:48px; display:block; line-height:1">${type.emoji}</span><div style="font-size:18px; font-weight:bold;">${type.name} Lv.${level}</div></div><div style="background:rgba(255,255,255,0.2); height:12px; border-radius:6px; overflow:hidden;"><div style="background:${type.color}; height:100%; width:${progress}%;"></div></div></div>`;
    });
    document.getElementById("fitnessPokedex").innerHTML = pokedexHtml;
    const totalScore = myScores[0] + myScores[1] + myScores[2] + myScores[3] + Math.max(myScores[4], myScores[5]) + myScores[6] + myScores[7] + myScores[8];
    const gr = parseInt(document.getElementById("grade").value);
    let rank = 'E';
    for (let i = 0; i < E.length; i++) {
        const rg = E[i][`c${gr}`];
        let min, max;
        if (rg.includes("以上")) { min = parseFloat(rg); max = 100; }
        else if (rg.includes("以下")) { min = 0; max = parseFloat(rg); }
        else { [min, max] = rg.split("～").map(Number); }
        if (totalScore >= min && totalScore <= max) { rank = E[i].s; break; }
    }
    document.getElementById("totalRank").innerHTML = `<div style="font-size:28px;">総合評価: ${rank} (${totalScore}点)</div>`;
}

function setGoal(goalType) {
    const g = document.getElementById("gender").value;
    const h = D[g].h.slice(0, 9);
    const gr = parseInt(document.getElementById("grade").value);
    let myScores = [];
    let myValues = [];

    // 現在の記録と得点を取得
    for (let i = 0; i < 9; i++) {
        const inp = document.getElementById(`i${i}`);
        const v = parseFloat(inp.value);
        myValues.push(!isNaN(v) ? v : 0);
        myScores.push(!isNaN(v) ? CS(v, h[i], g) : 0);
    }

    const scoreEndurance = myScores[4] || 0;
    const scoreShuttle = myScores[5] || 0;
    let adjustedScores = [...myScores];
    if (scoreEndurance >= scoreShuttle) { adjustedScores[5] = 0; } else { adjustedScores[4] = 0; }
    
    const validScores = adjustedScores.filter(s => s > 0);
    const totalScore = validScores.reduce((a, b) => a + b, 0);
    
    let targetScore = 0;
    let goalTitle = '';
    if (goalType === 'rankA') { targetScore = parseInt(E.find(e => e.s === 'A')[`c${gr}`].replace('以上', '')); goalTitle = '🎯 総合A評価を目指す'; }
    else if (goalType === 'rankB') { targetScore = parseInt(E.find(e => e.s === 'B')[`c${gr}`].split('～')[0]); goalTitle = '🎯 総合B評価を目指す'; }
    else if (goalType === 'rankC') { targetScore = parseInt(E.find(e => e.s === 'C')[`c${gr}`].split('～')[0]); goalTitle = '🎯 総合C評価を目指す'; }
    else if (goalType === 'rankD') { targetScore = parseInt(E.find(e => e.s === 'D')[`c${gr}`].split('～')[0]); goalTitle = '🎯 総合D評価を目指す'; }
    
    const pointsNeeded = Math.max(0, targetScore - totalScore);
    let html = `<div style="background:white;padding:25px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)"><h5 style="margin:0 0 20px 0;font-size:20px;color:#9c27b0">${goalTitle}</h5><div style="background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:20px"><div style="font-size:16px;color:#666;margin-bottom:10px">現在${totalScore}点 → 目標${targetScore}点以上</div><div style="font-size:24px;font-weight:bold;color:#9c27b0">必要な得点: +${pointsNeeded}点</div></div>`;
    
    if (pointsNeeded > 0) {
        html += '<div style="margin-top:20px"><h6 style="color:#9c27b0;margin-bottom:15px;font-size:18px">💡 おすすめの伸ばし方</h6>';
        const improvements = [];
        
        h.forEach((header, i) => {
            if (adjustedScores[i] < 10) {
                // 持久走とシャトルランの排他制御
                if (i === 4 && scoreShuttle > scoreEndurance && scoreShuttle !== 0) return;
                if (i === 5 && scoreEndurance > scoreShuttle && scoreEndurance !== 0) return;

                const potential = 10 - adjustedScores[i];
                const difficulty = adjustedScores[i] >= 7 ? '難しい' : adjustedScores[i] >= 5 ? '普通' : adjustedScores[i] >= 3 ? '簡単！' : 'とても簡単！';
                const diffColor = adjustedScores[i] >= 7 ? '#f44336' : adjustedScores[i] >= 5 ? '#FF9800' : adjustedScores[i] >= 3 ? '#4CAF50' : '#2196F3';
                
                // --- 【追加】総当たりシミュレーション ---
                let step = 1; let unit = "回";
                if (header.includes("50m")) { step = -0.01; unit = "秒"; }
                else if (header.includes("持久")) { step = -1; unit = "秒"; }
                else if (header.includes("ハンド") || header.includes("幅跳び")) { step = 0.1; unit = "m"; }
                else if (header.includes("握力")) { step = 0.1; unit = "kg"; }
                else if (header.includes("長座")) { step = 1; unit = "cm"; }

                let testVal = myValues[i] || (header.includes("走") ? 100 : 0); // 未入力時の初期値
                let currentPoint = adjustedScores[i];
                let safety = 0;
                while (CS(testVal, header, g) <= currentPoint && safety < 1000) {
                    testVal += step;
                    testVal = Math.round(testVal * 100) / 100;
                    safety++;
                }
                const gap = Math.abs(Math.round((testVal - myValues[i]) * 100) / 100);
                // --------------------------------------

                improvements.push({ 
                    name: header, 
                    current: currentPoint, 
                    next: currentPoint + 1,
                    gap: gap,
                    unit: unit,
                    targetVal: testVal,
                    difficulty: difficulty, 
                    diffColor: diffColor 
                });
            }
        });

        // 提案を5つに絞って表示
        improvements.slice(0, 5).forEach((imp) => {
            html += `
            <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:10px;border-left:4px solid ${imp.diffColor};display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-weight:bold;font-size:16px">${imp.name}</span>
                    <div style="color:#666;font-size:13px">現在${imp.current}点 → <span style="color:#2b6cb0;font-weight:bold">${imp.next}点</span></div>
                </div>
                <div style="text-align:right">
                    <div style="color:${imp.diffColor};font-weight:900;font-size:18px">あと ${imp.gap}${imp.unit}！</div>
                    <div style="color:#999;font-size:11px">(目標: ${imp.targetVal}${imp.unit})</div>
                </div>
            </div>`;
        });
        
        html += `<div style="margin-top:20px;padding:15px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:8px;text-align:center;font-size:16px">✨ これらを達成すれば目標クリア！頑張りましょう！</div></div>`;
    } else {
        html += '<div style="padding:20px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:white;border-radius:8px;text-align:center;font-size:18px">🎉 すでに目標達成しています！素晴らしい！</div>';
    }
    html += '</div>';
    document.getElementById("goalSimulator").innerHTML = html;
    document.querySelector("#correlation p").style.display = "none";
}

function C() {
    if (!confirm("現在の学年の入力内容をすべて消去しますか？")) return;
    const inputs = document.querySelectorAll(".v-in");
    inputs.forEach(input => input.value = "");
    const g = document.getElementById("gender").value;
    const gr = document.getElementById("grade").value;
    const key = "y-" + g;
    let allData = JSON.parse(localStorage.getItem(key) || '{}');
    if (allData[gr]) {
        delete allData[gr];
        localStorage.setItem(key, JSON.stringify(allData));
    }
    const tsElement = document.getElementById("lastSaved");
    if (tsElement) tsElement.innerText = "";
    U();
    alert("消去しました。");
}

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
