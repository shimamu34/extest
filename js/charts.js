// charts.js の一番上に追記（二重定義エラーを防ぎつつ初期値を確保）
var radarVisible = radarVisible || [true, true, true, true, true, true];

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

// レーダーチャート描画
function RR(g) {
    const cv = document.getElementById("rc");
    const ctx = cv.getContext("2d");
    const h = D[g].h.slice(0, 9); // 9種目
    
    // 6色定義（0-2:統計、3-5:自分学年）
    const cols = [
        {s: "rgba(255,99,132,1)", f: "rgba(255,99,132,0.2)"}, // 0:帯広
        {s: "rgba(54,162,235,1)", f: "rgba(54,162,235,0.2)"}, // 1:北海道
        {s: "rgba(75,192,192,1)", f: "rgba(75,192,192,0.2)"}, // 2:全国
        {s: "rgba(255,159,64,1)", f: "rgba(255,159,64,0.1)"}, // 3:中1
        {s: "rgba(153,102,255,1)", f: "rgba(153,102,255,0.1)"},// 4:中2
        {s: "rgba(76,175,80,1)", f: "rgba(76,175,80,0.1)"}    // 5:中3
    ];

    // 保存されている全学年データを取得
    const allData = JSON.parse(localStorage.getItem("y-" + g) || '{}');
    const dataSets = [];
    
    // 1-3. 統計データ
    ["帯広市", "北海道", "全国"].forEach(rg => {
        dataSets.push(h.map((x, i) => CS(A[g][rg][i], x, g)));
    });

    // 4-6. 自分の各学年データ
    ["1", "2", "3"].forEach(grKey => {
        if (allData[grKey] && allData[grKey].some(v => v !== "")) {
            // 空文字でないデータがある場合のみ計算してセット
            dataSets.push(h.map((x, i) => CS(parseFloat(allData[grKey][i]) || 0, x, g)));
        } else {
            dataSets.push(null);
        }
    });

    ctx.clearRect(0, 0, cv.width, cv.height);
    
    const cX = cv.width / 2;
    const cY = cv.height / 2;
    const rad = 220; // 半径
    const as = (Math.PI * 2) / h.length;

    // 背景（円と軸）の描画
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i++) {
        ctx.beginPath(); ctx.arc(cX, cY, (rad / 10) * i, 0, Math.PI * 2); ctx.stroke();
    }
    h.forEach((lb, i) => {
        const a = as * i - Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(cX, cY); ctx.lineTo(cX + Math.cos(a) * rad, cY + Math.sin(a) * rad); ctx.stroke();
        
        ctx.fillStyle = "#333"; 
        ctx.textAlign = "center";
        ctx.font = "bold 13px Arial"; // 少し小さくして確実に枠内に収める

        // --- 名前を強制的にフルネームに変換 ---
        let fullLabel = lb;
        if (lb.includes("持")) fullLabel = "持久走";
        else if (lb.includes("シ")) fullLabel = "20mシャトルラン";
        else if (lb.includes("握")) fullLabel = "握力";
        else if (lb.includes("上")) fullLabel = "上体起こし";
        else if (lb.includes("長")) fullLabel = "長座体前屈";
        else if (lb.includes("反")) fullLabel = "反復横とび";
        else if (lb.includes("立")) fullLabel = "立ち幅とび";
        else if (lb.includes("ハ")) fullLabel = "ハンドボール投";
        else if (lb.includes("50")) fullLabel = "50m走";

        // 描画位置の調整（35 → 25 に少し内側へ寄せ、上下位置も微調整）
        const offset = 25; 
        let x = cX + Math.cos(a) * (rad + offset);
        let y = cY + Math.sin(a) * (rad + offset);

        // 文字の位置が上下に来る場合、少しだけy軸をずらすと読みやすくなります
        if (Math.abs(Math.sin(a)) > 0.9) {
            y += (Math.sin(a) > 0) ? 10 : -5;
        }

        ctx.fillText(fullLabel, x, y);
    });

    // データ描画
    const currentGr = document.getElementById("grade").value;
    dataSets.forEach((scs, ri) => {
        if (!scs || !radarVisible[ri]) return;
        
        const c = cols[ri];
        // 選択中の学年（自分データ）なら実線、それ以外（過去学年）は点線
        const isSelf = ri >= 3;
        const isActive = isSelf && (ri - 2).toString() === currentGr;
        
        ctx.beginPath();
        ctx.setLineDash(isSelf && !isActive ? [5, 5] : []);
        ctx.strokeStyle = c.s;
        ctx.fillStyle = c.f;
        ctx.lineWidth = isActive ? 3 : 2;

        scs.forEach((sc, i) => {
            const a = as * i - Math.PI / 2;
            const r = (rad / 10) * sc;
            const x = cX + Math.cos(a) * r;
            const y = cY + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });

    // --- 凡例ボタンの描画（修正版） ---
    const regs = ["帯広", "北海道", "全国", "中1", "中2", "中3"];
    ctx.setLineDash([]);
    
    // 凡例の開始位置と間隔を定義
    const startX = cX - 270; // 左端の開始位置
    const itemWidth = 90;    // 1項目あたりの幅

    regs.forEach((rg, i) => {
        const lX = startX + i * itemWidth;
        const lY = cv.height - 20;
        
        // 四角いアイコン
        ctx.fillStyle = radarVisible[i] ? cols[i].s : "#ccc";
        ctx.fillRect(lX, lY - 10, 15, 10);
        
        // テキスト
        ctx.fillStyle = "#333";
        ctx.textAlign = "left";
        ctx.font = "bold 12px Arial";
        ctx.fillText(rg, lX + 20, lY); // アイコンの右側にテキストを表示
    });

    // --- 凡例クリックイベント（修正版） ---
    cv.onclick = e => {
        const rect = cv.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // クリックされた高さが凡例エリア（下部40px以内）かチェック
        if (y > cv.height - 40) {
            // クリックされた位置から、どの項目（0〜5）かを計算
            const idx = Math.floor((x - startX) / itemWidth);
            
            if (idx >= 0 && idx < 6) {
                radarVisible[idx] = !radarVisible[idx];
                RR(g); // 再描画
            }
        }
    };
}

// 体力分析
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
                    ${type.avg > 0 ? `${type.avg.toFixed(1)}点 / 10.0点` : 'データなし'}
                    ${toNext > 0 && toNext < 1 ? ` (次のレベルまであと${toNext.toFixed(1)}点！)` : ''}
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
    document.getElementById("goalSimulator").innerHTML = '<div style="text-align:center;color:#666;padding:40px">上のボタンから目標を選んでください</div>';
}

// 目標設定
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
    let targetRank = '';
    
    if (goalType === 'rankA') {
        const aRange = E.find(e => e.s === 'A')[`c${gr}`];
        targetScore = parseInt(aRange.replace('以上', ''));
        goalTitle = '🎯 総合A評価を目指す';
        goalDesc = `現在${totalScore}点 → 目標${targetScore}点以上`;
        targetRank = 'A';
    } else if (goalType === 'rankB') {
        const bRange = E.find(e => e.s === 'B')[`c${gr}`];
        targetScore = parseInt(bRange.split('～')[0]);
        goalTitle = '🎯 総合B評価を目指す';
        goalDesc = `現在${totalScore}点 → 目標${targetScore}点以上`;
        targetRank = 'B';
    } else if (goalType === 'rankC') {
        const cRange = E.find(e => e.s === 'C')[`c${gr}`];
        targetScore = parseInt(cRange.split('～')[0]);
        goalTitle = '🎯 総合C評価を目指す';
        goalDesc = `現在${totalScore}点 → 目標${targetScore}点以上`;
        targetRank = 'C';
    } else if (goalType === 'rankD') {
        const dRange = E.find(e => e.s === 'D')[`c${gr}`];
        targetScore = parseInt(dRange.split('～')[0]);
        goalTitle = '🎯 総合D評価を目指す';
        goalDesc = `現在${totalScore}点 → 目標${targetScore}点以上`;
        targetRank = 'D';
    }
    
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
        
        const hasEndurance = myValues[4] > 0;
        const hasShuttle = myValues[5] > 0;
        
        const improvements = [];
        h.forEach((header, i) => {
            if (i === 4 && !hasEndurance && hasShuttle) return;
            if (i === 5 && !hasShuttle && hasEndurance) return;
            
            if (myScores[i] < 10 && myScores[i] > 0) {
                const potential = 10 - myScores[i];
                const difficulty = myScores[i] >= 7 ? '難しい' : myScores[i] >= 5 ? '普通' : myScores[i] >= 3 ? '簡単！' : 'とても簡単！';
                const diffColor = myScores[i] >= 7 ? '#f44336' : myScores[i] >= 5 ? '#FF9800' : myScores[i] >= 3 ? '#4CAF50' : '#2196F3';
                improvements.push({
                    name: header,
                    current: myScores[i],
                    potential: potential,
                    difficulty: difficulty,
                    diffColor: diffColor
                });
            }
        });
        
        h.forEach((header, i) => {
            if (i === 4 && !hasEndurance && hasShuttle) return;
            if (i === 5 && !hasShuttle && hasEndurance) return;
            
            if (myScores[i] === 0) {
                improvements.push({
                    name: header,
                    current: 0,
                    potential: 10,
                    difficulty: '未測定',
                    diffColor: '#9E9E9E'
                });
            }
        });
        
        improvements.sort((a, b) => {
            if (a.current === 0 && b.current > 0) return 1;
            if (a.current > 0 && b.current === 0) return -1;
            return b.potential - a.potential;
        });
        
        let recommendCount = 0;
        let totalRecommend = 0;
        improvements.forEach((imp, idx) => {
            if (recommendCount < 5 && totalRecommend < pointsNeeded) {
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
                    recommendCount++;
                    totalRecommend += recommend;
                }
            }
        });
        
        html += `<div style="margin-top:20px;padding:15px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border-radius:8px;text-align:center;font-size:16px">
            ✨ これらを達成すれば目標クリア！頑張りましょう！
        </div>`;
        
        html += '</div>';
    } else {
        html += '<div style="padding:20px;background:linear-gradient(135deg,#4CAF50,#66BB6A);color:white;border-radius:8px;text-align:center;font-size:18px">🎉 すでに目標達成しています！素晴らしい！</div>';
    }
    
    html += '</div>';
    
    document.getElementById("goalSimulator").innerHTML = html;
}

// トラッキング機能
function addTrackingRecord() {
    const eventIdx = parseInt(document.getElementById("trackingEvent").value);
    const value = parseFloat(document.getElementById("trackingValue").value);
    const unit = document.getElementById("trackingUnit").value;
    const date = document.getElementById("trackingDate").value;
    const memo = document.getElementById("trackingMemo").value;
    const g = document.getElementById("gender").value;
    const h = D[g].h;

    // ★追加：今のマイレコード画面で選ばれている学年を取得（1, 2, 3のどれか）
    const saveGrade = document.getElementById("grade").value;
    
    if (isNaN(value) || !date) {
        N('測定値と日付を入力してください', 'error');
        return;
    }
    
    const score = CS(value, h[eventIdx], g);
    const key = `tracking-${g}`;
    let trackingData = JSON.parse(localStorage.getItem(key) || '{}');
    
    if (!trackingData[eventIdx]) trackingData[eventIdx] = [];
    
    // ★ここを修正：データを保存する箱に grade を追加
    trackingData[eventIdx].push({
        date: date,
        value: value,
        unit: unit,
        memo: memo,
        score: score,
        grade: saveGrade // これで学年が保存される
    });
    
    trackingData[eventIdx].sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(key, JSON.stringify(trackingData));
    
    // 入力欄をクリア
    document.getElementById("trackingValue").value = '';
    document.getElementById("trackingMemo").value = '';
    
    N('記録を追加しました！', 'success');
    
    // 表示中の学年を、保存した学年に自動で合わせる
    document.getElementById("trackingViewGrade").value = saveGrade;
    updateTrackingView();
}

function updateTrackingView() {
    const eventIdx = parseInt(document.getElementById("trackingViewEvent").value);
    const g = document.getElementById("gender").value;
    
    // ★追加：新しく作った「表示学年」リストから値を取得
    const viewGrade = document.getElementById("trackingViewGrade").value;
    
    const key = `tracking-${g}`;
    const trackingData = JSON.parse(localStorage.getItem(key) || '{}');
    
    // すべての記録を取得
    const allRecords = trackingData[eventIdx] || [];
    
    // ★修正：選択した学年(viewGrade)と同じ学年のデータだけを抜き出す
    const records = allRecords.filter(r => String(r.grade) === String(viewGrade));
    
    const h = D[g].h;

    // グラフのリセット
    const canvas = document.getElementById("trackingGraph");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (records.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`中${viewGrade}年の記録がありません`, 500, 200);
        
        document.getElementById("trackingStats").innerHTML = '<p style="text-align:center;color:#666">データがありません</p>';
        document.getElementById("trackingList").innerHTML = '';
        return;
    }
    
    // グラフと統計情報を描画
    drawTrackingGraph(records, h[eventIdx]);
    updateTrackingStats(records, h[eventIdx]);
    
    // ★修正：リスト表示関数に allRecords と viewGrade を渡す
    updateTrackingList(allRecords, h[eventIdx], eventIdx, viewGrade);
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
    const range = maxVal - minVal;
    const padding = range * 0.1;
    
    const yMax = maxVal + padding;
    const yMin = Math.max(0, minVal - padding);
    const yRange = yMax - yMin;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = p.t + (cH / 5) * i;
        ctx.beginPath();
        ctx.moveTo(p.l, y);
        ctx.lineTo(p.l + cW, y);
        ctx.stroke();
        
        const val = yMax - (yRange / 5) * i;
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1), p.l - 10, y + 4);
    }
    
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    records.forEach((r, i) => {
        const x = p.l + (cW / (records.length - 1)) * i;
        const date = new Date(r.date);
        const label = `${i + 1}回目\n${date.getMonth() + 1}/${date.getDate()}`;
        ctx.fillText(label, x, cv.height - p.b + 30);
    });
    
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 3;
    ctx.beginPath();
    records.forEach((r, i) => {
        const x = p.l + (cW / (records.length - 1)) * i;
        const y = p.t + cH - ((r.value - yMin) / yRange) * cH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    records.forEach((r, i) => {
        const x = p.l + (cW / (records.length - 1)) * i;
        const y = p.t + cH - ((r.value - yMin) / yRange) * cH;
        
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(r.value, x, y - 12);
    });
    
    ctx.fillStyle = '#FF5722';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${eventName} の変容`, cv.width / 2, 25);
}

function updateTrackingStats(records, eventName) {
    const first = records[0];
    const last = records[records.length - 1];
    const diff = last.value - first.value;
    const diffPercent = ((diff / first.value) * 100).toFixed(1);
    const avg = (records.reduce((sum, r) => sum + r.value, 0) / records.length).toFixed(1);
    const max = Math.max(...records.map(r => r.value));
    const maxRecord = records.find(r => r.value === max);
    
    const diffColor = diff > 0 ? '#4CAF50' : diff < 0 ? '#f44336' : '#666';
    const diffIcon = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
    
    let html = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:15px;margin-bottom:20px">
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;text-align:center">
                <div style="color:#666;font-size:13px;margin-bottom:5px">初回記録</div>
                <div style="font-size:24px;font-weight:bold;color:#FF5722">${first.value}</div>
                <div style="color:#999;font-size:12px">${first.date}</div>
            </div>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;text-align:center">
                <div style="color:#666;font-size:13px;margin-bottom:5px">最新記録</div>
                <div style="font-size:24px;font-weight:bold;color:#FF5722">${last.value}</div>
                <div style="color:#999;font-size:12px">${last.date}</div>
            </div>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px;text-align:center">
                <div style="color:#666;font-size:13px;margin-bottom:5px">伸び ${diffIcon}</div>
                <div style="font-size:24px;font-weight:bold;color:${diffColor}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}</div>
                <div style="color:${diffColor};font-size:12px;font-weight:bold">${diff > 0 ? '+' : ''}${diffPercent}%</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px">
            <div style="background:#f5f5f5;padding:15px;border-radius:8px">
                <div style="color:#666;font-size:13px;margin-bottom:8px">📊 統計情報</div>
                <div style="font-size:14px;line-height:1.8">
                    • 測定回数: ${records.length}回<br>
                    • 平均値: ${avg}<br>
                    • 最高記録: ${max} (${maxRecord.date})
                </div>
            </div>
            <div style="background:#f5f5f5;padding:15px;border-radius:8px">
                <div style="color:#666;font-size:13px;margin-bottom:8px">💡 分析コメント</div>
                <div style="font-size:14px;line-height:1.8">
                    ${diff > 0 ? '順調に成長しています！この調子で頑張りましょう🎉' : diff < 0 ? '一時的に下がっていますが、コンディションを整えて再チャレンジ💪' : '記録が安定しています。次のステップを目指しましょう！'}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById("trackingStats").innerHTML = html;
}

function updateTrackingList(allRecords, eventName, eventIdx, viewGrade) {
    let html = '<table style="width:100%;border-collapse:collapse">';
    html += '<tr style="background:#FF5722;color:white"><th style="padding:12px">No</th><th>日付</th><th>測定値</th><th>メモ</th><th>操作</th></tr>';
    
    allRecords.forEach((r, i) => {
        // ★修正：選択中の学年以外のデータは表示しない
        if (String(r.grade) !== String(viewGrade)) return;
        
        html += `<tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:12px;text-align:center;font-weight:bold">${i + 1}</td>
            <td style="padding:12px;text-align:center">${r.date}</td>
            <td style="padding:12px;text-align:center;font-weight:bold;color:#FF5722">${r.value}</td>
            <td style="padding:12px;text-align:center">${r.memo || '-'}</td>
            <td style="padding:12px;text-align:center">
                <button class="btn" style="background:#f44336;padding:6px 12px;font-size:12px" 
                onclick="deleteTrackingRecord(${eventIdx}, ${i})">削除</button>
            </td>
        </tr>`;
    });
    
    html += '</table>';
    document.getElementById("trackingList").innerHTML = html;
}

function deleteTrackingRecord(eventIdx, recordIdx) {
    if (!confirm('この記録を削除しますか？')) return;
    
    const g = document.getElementById("gender").value;
    const key = `tracking-${g}`;
    let trackingData = JSON.parse(localStorage.getItem(key) || '{}');
    
    if (trackingData[eventIdx]) {
        trackingData[eventIdx].splice(recordIdx, 1);
        localStorage.setItem(key, JSON.stringify(trackingData));
        N('記録を削除しました', 'info');
        updateTrackingView();
    }
}
// charts.js の一番下に追加
function updateAllCharts() {
    const g = document.getElementById("gender").value;
    // 表示されている時だけ描画を更新する
    if (document.getElementById("radar").style.display !== "none") RR(g);
    if (document.getElementById("correlation").style.display !== "none") RAnalysis(g);
    if (document.getElementById("tracking").style.display !== "none") updateTrackingView();
}
chartsコードです。確認してみて
