// グラフ表示切り替え
function toggleRadar() {
    const c = document.getElementById("radar");
    if (c.style.display === "none") {
        c.style.display = "block";
        RR(document.getElementById("gender").value);
    } else {
        c.style.display = "none";
    }
}

function toggleGrowth() {
    const c = document.getElementById("growth");
    if (c.style.display === "none") {
        c.style.display = "block";
        RG(document.getElementById("gender").value);
    } else {
        c.style.display = "none";
    }
}

function toggleAnalysis() {
    const c = document.getElementById("correlation");
    if (c.style.display === "none") {
        c.style.display = "block";
        RAnalysis(document.getElementById("gender").value);
    } else {
        c.style.display = "none";
    }
}

function toggleTracking() {
    const c = document.getElementById("tracking");
    if (c.style.display === "none") {
        c.style.display = "block";
        document.getElementById("trackingDate").valueAsDate = new Date();
        updateTrackingView();
    } else {
        c.style.display = "none";
    }
}

// レーダーチャート描画（3学年比較版）
function RR(g) {
    const cv = document.getElementById("rc");
    const ctx = cv.getContext("2d");
    const h = D[g].h.slice(0, 9);
    const cols = [
        {s: "rgba(255,99,132,1)", f: "rgba(255,99,132,0.2)"},
        {s: "rgba(54,162,235,1)", f: "rgba(54,162,235,0.2)"},
        {s: "rgba(75,192,192,1)", f: "rgba(75,192,192,0.2)"},
        {s: "rgba(255,206,86,1)", f: "rgba(255,206,86,0.2)"},
        {s: "rgba(153,102,255,0.5)", f: "rgba(153,102,255,0.1)"},
        {s: "rgba(0,128,0,0.5)", f: "rgba(0,128,0,0.1)"}
    ];
    
    const rs = [];
    ["帯広市", "北海道", "全国"].forEach(rg => {
        rs.push(h.map((x, i) => CS(A[g][rg][i], x, g)));
    });
    
    // 現在の入力を取得
    const currentInput = h.map((x, i) => {
        const inp = document.getElementById(`i${i}`);
        if (!inp) return 0;
        const v = parseFloat(inp.value);
        return isNaN(v) ? 0 : CS(v, x, g);
    });
    rs.push(currentInput); // 3番目: 自分の現在

    // 過去学年データの比較（中1, 中2, 中3の保存データ）
    const gr = document.getElementById("grade").value;
    const k = `y-${g}`;
    const yd = JSON.parse(localStorage.getItem(k) || '{}');
    
    ["1", "2", "3"].forEach(gn => {
        const pg = "中" + gn;
        if (gn !== gr && yd[pg]) {
            rs.push(h.map((x, i) => CS(yd[pg].v[i], x, g)));
        }
    });
    
    ctx.clearRect(0, 0, cv.width, cv.height);
    const cX = cv.width / 2;
    const cY = cv.height / 2;
    const rad = 220;
    const as = (Math.PI * 2) / h.length;
    
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i++) {
        ctx.beginPath();
        ctx.arc(cX, cY, (rad / 10) * i, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.strokeStyle = "#ccc";
    h.forEach((lb, i) => {
        const a = as * i - Math.PI / 2;
        const x = cX + Math.cos(a) * rad;
        const y = cY + Math.sin(a) * rad;
        ctx.beginPath();
        ctx.moveTo(cX, cY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(lb, cX + Math.cos(a) * (rad + 40), cY + Math.sin(a) * (rad + 40));
    });

    rs.forEach((scs, ri) => {
        if (!radarVisible[ri] || !scs) return;
        const c = cols[ri] || cols[4];
        
        ctx.fillStyle = c.f;
        ctx.beginPath();
        scs.forEach((sc, i) => {
            const a = as * i - Math.PI / 2;
            const x = cX + Math.cos(a) * ((rad / 10) * sc);
            const y = cY + Math.sin(a) * ((rad / 10) * sc);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = c.s;
        ctx.lineWidth = ri >= 3 ? 3 : 2;
        ctx.beginPath();
        scs.forEach((sc, i) => {
            const a = as * i - Math.PI / 2;
            const x = cX + Math.cos(a) * ((rad / 10) * sc);
            const y = cY + Math.sin(a) * ((rad / 10) * sc);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();
    });
}

// 経年変化グラフ（元のRG関数を維持）
function RG(g) {
    const cv = document.getElementById("gc");
    const ctx = cv.getContext("2d");
    const h = D[g].h.slice(0, 9);
    const k = `y-${g}`;
    const yd = JSON.parse(localStorage.getItem(k) || '{}');
    
    ctx.clearRect(0, 0, cv.width, cv.height);
    
    const grs = ['中1', '中2', '中3'];
    const cols = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0'];
    const p = {t: 40, r: 100, b: 60, l: 60};
    const cW = cv.width - p.l - p.r;
    const cH = cv.height - p.t - p.b;
    
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const x = p.l + i * (cW / 3);
        ctx.beginPath();
        ctx.moveTo(x, p.t);
        ctx.lineTo(x, p.t + cH);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    grs.forEach((gr, i) => {
        ctx.fillText(gr, p.l + i * (cW / 3), cv.height - p.b + 25);
    });
    
    h.forEach((lb, idx) => {
        const cl = cols[idx];
        ctx.strokeStyle = cl;
        ctx.fillStyle = cl;
        ctx.lineWidth = 2;
        
        let pts = [];
        grs.forEach((gr, gi) => {
            if (yd[gr]) {
                const vl = yd[gr].v[idx];
                const sc = CS(vl, lb, g);
                const x = p.l + gi * (cW / 3);
                const y = p.t + cH - (sc / 10) * cH;
                pts.push({x, y, val: vl});
            }
        });
        
        if (pts.length > 1) {
            ctx.beginPath();
            pts.forEach((pt, i) => {
                if (i === 0) ctx.moveTo(pt.x, pt.y);
                else ctx.lineTo(pt.x, pt.y);
            });
            ctx.stroke();
        }
        
        pts.forEach(pt => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    });
}

// 体力分析（元のRAnalysis関数を維持）
function RAnalysis(g) {
    const h = D[g].h.slice(0, 9);
    
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
    
    const calcAvg = (indices) => {
        const validScores = indices.map(i => myScores[i]).filter(s => s > 0);
        return validScores.length > 0 ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length : 0;
    };
    
    const powerAvg = calcAvg([0, 7, 8]);
    const enduranceAvg = calcAvg([4, 5]);
    const agilityAvg = calcAvg([3, 6]);
    const flexibilityAvg = calcAvg([1, 2]);
    
    const types = [
        {name: 'パワー型', emoji: '💪', avg: powerAvg, color: '#f5576c'},
        {name: '持久力型', emoji: '🏃', avg: enduranceAvg, color: '#00f2fe'},
        {name: '敏捷性型', emoji: '⚡', avg: agilityAvg, color: '#38f9d7'},
        {name: '柔軟性型', emoji: '🤸', avg: flexibilityAvg, color: '#fee140'}
    ];
    
    let pokedexHtml = '';
    types.forEach(type => {
        const level = Math.floor(type.avg);
        const progress = (type.avg / 10) * 100;
        const nextLevel = Math.ceil(type.avg);
        const toNext = nextLevel - type.avg;
        
        pokedexHtml += `
            <div style="background:rgba(255,255,255,0.15);padding:20px;border-radius:12px;backdrop-filter:blur(10px)">
                <div style="display:flex;align-items:center;margin-bottom:15px">
                    <span style="font-size:36px;margin-right:15px">${type.emoji}</span>
                    <div style="flex:1">
                        <div style="font-size:18px;font-weight:bold;margin-bottom:5px">${type.name}</div>
                        <div style="font-size:24px;font-weight:bold">Lv.${level}</div>
                    </div>
                </div>
                <div style="background:rgba(255,255,255,0.3);height:20px;border-radius:10px;overflow:hidden;margin-bottom:8px">
                    <div style="background:${type.color};height:100%;width:${progress}%;transition:width 0.5s"></div>
                </div>
                <div style="font-size:13px;opacity:0.9">
                    ${type.avg.toFixed(1)}点 / 10.0点
                </div>
            </div>
        `;
    });
    
    document.getElementById("fitnessPokedex").innerHTML = pokedexHtml;
    
    const validScores = myScores.filter(s => s > 0);
    const totalScore = validScores.reduce((a, b) => a + b, 0);
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
}

// 目標設定（元のsetGoal関数を維持）
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
    
    const validScores = myScores.filter(s => s > 0);
    const totalScore = validScores.reduce((a, b) => a + b, 0);
    
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
    
    const pointsNeeded = Math.max(0, targetScore - totalScore);
    
    let html = `
        <div style="background:white;padding:25px;border-radius:12px;box-shadow:0 4px 15px rgba(0,0,0,0.1)">
            <h5 style="margin:0 0 20px 0;font-size:20px;color:#9c27b0">${goalTitle}</h5>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:20px">
                <div style="font-size:24px;font-weight:bold;color:#9c27b0">必要な得点: +${pointsNeeded}点</div>
            </div>
    `;
    
    if (pointsNeeded > 0) {
        html += '<div style="margin-top:20px"><h6 style="color:#9c27b0;margin-bottom:15px;font-size:18px">💡 おすすめの伸ばし方</h6>';
        
        const improvements = [];
        h.forEach((header, i) => {
            if (myScores[i] < 10) {
                const difficulty = myScores[i] >= 7 ? '難しい' : myScores[i] >= 5 ? '普通' : '簡単！';
                const diffColor = myScores[i] >= 7 ? '#f44336' : myScores[i] >= 5 ? '#FF9800' : '#4CAF50';
                improvements.push({
                    name: header,
                    current: myScores[i],
                    potential: 10 - myScores[i],
                    difficulty: difficulty,
                    diffColor: diffColor
                });
            }
        });
        
        improvements.sort((a, b) => b.potential - a.potential).slice(0, 5).forEach(imp => {
            html += `
                <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:10px;border-left:4px solid ${imp.diffColor}">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <div>
                            <span style="font-weight:bold;font-size:16px">${imp.name}</span>
                            <span style="color:#666;margin-left:10px">現在${imp.current}点 → あと${Math.min(2, imp.potential)}点アップ</span>
                        </div>
                        <span style="background:${imp.diffColor};color:white;padding:5px 12px;border-radius:20px;font-size:13px">${imp.difficulty}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    document.getElementById("goalSimulator").innerHTML = html + '</div>';
}

// トラッキング（元の関数を維持）
function addTrackingRecord() {
    const eventIdx = parseInt(document.getElementById("trackingEvent").value);
    const value = parseFloat(document.getElementById("trackingValue").value);
    const date = document.getElementById("trackingDate").value;
    const g = document.getElementById("gender").value;
    
    if (isNaN(value) || !date) {
        N('測定値と日付を入力してください', 'error');
        return;
    }
    
    const key = `tracking-${g}`;
    let trackingData = JSON.parse(localStorage.getItem(key) || '{}');
    if (!trackingData[eventIdx]) trackingData[eventIdx] = [];
    
    trackingData[eventIdx].push({
        date: date,
        value: value,
        unit: document.getElementById("trackingUnit").value,
        memo: document.getElementById("trackingMemo").value
    });
    
    trackingData[eventIdx].sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(key, JSON.stringify(trackingData));
    N('記録を追加しました！', 'success');
    updateTrackingView();
}

function updateTrackingView() {
    const eventIdx = parseInt(document.getElementById("trackingViewEvent").value);
    const g = document.getElementById("gender").value;
    const trackingData = JSON.parse(localStorage.getItem(`tracking-${g}`) || '{}');
    const records = trackingData[eventIdx] || [];
    
    if (records.length === 0) {
        document.getElementById("trackingGraph").getContext("2d").clearRect(0,0,1000,400);
        document.getElementById("trackingList").innerHTML = '<p style="text-align:center;color:#666;padding:20px">データがありません</p>';
        return;
    }
    drawTrackingGraph(records, D[g].h[eventIdx]);
    updateTrackingList(records, D[g].h[eventIdx], eventIdx);
}

function drawTrackingGraph(records, eventName) {
    const cv = document.getElementById("trackingGraph");
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height);
    const p = {t: 40, r: 80, b: 80, l: 80};
    const cW = cv.width - p.l - p.r;
    const cH = cv.height - p.t - p.b;
    const values = records.map(r => r.value);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const yMax = maxVal + (maxVal - minVal) * 0.1 || maxVal + 1;
    const yMin = Math.max(0, minVal - (maxVal - minVal) * 0.1);
    
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 3;
    ctx.beginPath();
    records.forEach((r, i) => {
        const x = p.l + (cW / (records.length - 1 || 1)) * i;
        const y = p.t + cH - ((r.value - yMin) / (yMax - yMin || 1)) * cH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    records.forEach((r, i) => {
        const x = p.l + (cW / (records.length - 1 || 1)) * i;
        const y = p.t + cH - ((r.value - yMin) / (yMax - yMin || 1)) * cH;
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.fillText(r.value, x - 10, y - 10);
    });
}

function updateTrackingList(records, eventName, eventIdx) {
    let html = '<table style="width:100%;border-collapse:collapse"><tr style="background:#FF5722;color:white"><th style="padding:12px">日付</th><th>値</th><th>メモ</th><th>操作</th></tr>';
    records.forEach((r, i) => {
        html += `<tr style="border-bottom:1px solid #eee">
            <td style="padding:12px;text-align:center">${r.date}</td>
            <td style="text-align:center;font-weight:bold">${r.value}</td>
            <td style="text-align:center">${r.memo || '-'}</td>
            <td style="text-align:center"><button onclick="deleteTrackingRecord(${eventIdx}, ${i})" style="background:#f44336;color:white;border:none;padding:5px 10px;border-radius:4px">削除</button></td>
        </tr>`;
    });
    document.getElementById("trackingList").innerHTML = html + '</table>';
}

function deleteTrackingRecord(eventIdx, recordIdx) {
    if (!confirm('削除しますか？')) return;
    const g = document.getElementById("gender").value;
    let data = JSON.parse(localStorage.getItem(`tracking-${g}`) || '{}');
    data[eventIdx].splice(recordIdx, 1);
    localStorage.setItem(`tracking-${g}`, JSON.stringify(data));
    updateTrackingView();
}
