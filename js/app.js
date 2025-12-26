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

// テーブル・評価描画（既存のままでOK）
function RT() {
    const g = document.getElementById("gender").value;
    if (!D[g]) return;
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
        if (isNaN(v)) { scores.push(null); return; }
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
    if (sv) {
        const allData = JSON.parse(sv);
        const v = allData[gr] || ["","","","","","","","",""];
        for (let i = 0; i < v.length; i++) {
            const input = document.getElementById(`i${i}`);
            if (input) input.value = v[i];
        }
        U();
    } else {
        for (let i = 0; i < 9; i++) {
            const input = document.getElementById(`i${i}`);
            if (input) input.value = "";
        }
        U();
    }
}

// --- 送信機能 ---
function sendToTeacher() {
    const toHalfWidth = (str) => str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

    const name = prompt("氏名を入力してください");
    if (!name) return;

    let studentIdRaw = prompt("出席番号を入力してください（例：12）");
    if (!studentIdRaw) return;
    const studentId = toHalfWidth(studentIdRaw);

    const gasUrl = localStorage.getItem('gasUrl');
    if (!gasUrl) {
        alert("先生がURLを設定していません。初期設定ガイドを確認してください。");
        return;
    }

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
        N('送信リクエストを完了しました！', 'success');
        alert('送信完了しました。\nスプレッドシートに反映されているか確認してください。');
    })
    .catch(err => {
        console.error("Fetch error:", err);
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
        for (let i = 0; i < 9; i++) {
            const inputField = document.getElementById(`i${i}`);
            if (inputField) inputField.value = "";
        }
        U(); 
        N(`中${gr}の記録を消去しました`, "info");
    }
}
