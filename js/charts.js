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

// レーダーチャート描画（RR関数全体をこの内容で上書きしてください）
function RR(g) {
    const cv = document.getElementById("rc");
    const ctx = cv.getContext("2d");
    const h = D[g].h.slice(0, 9); // 9種目
    
    
    const cols = [
        {s: "rgba(255,99,132,1)", f: "rgba(255,99,132,0.2)"}, // 0:帯広
        {s: "rgba(54,162,235,1)", f: "rgba(54,162,235,0.2)"}, // 1:北海道
        {s: "rgba(75,192,192,1)", f: "rgba(75,192,192,0.2)"}, // 2:全国
        {s: "rgba(255,159,64,1)", f: "rgba(255,159,64,0.1)"}, // 3:中1
        {s: "rgba(153,102,255,1)", f: "rgba(153,102,255,0.1)"},// 4:中2
        {s: "rgba(76,175,80,1)", f: "rgba(76,175,80,0.1)"}    // 5:中3
    ];

    const allData = JSON.parse(localStorage.getItem("y-" + g) || '{}');
    const dataSets = [];
    
    // 1-3. 統計データ
    ["帯広市", "北海道", "全国"].forEach(rg => {
        dataSets.push(h.map((x, i) => CS(A[g][rg][i], x, g)));
    });

    // 4-6. 自分の各学年データ（ここが修正の核心部分です）
    ["1", "2", "3"].forEach(grKey => {
        // その学年のデータが一つでも入力されているかチェック
        if (allData[grKey] && allData[grKey].some(v => v !== "" && v !== null && parseFloat(v) !== 0)) {
            dataSets.push(h.map((x, i) => {
                const rawValue = allData[grKey][i];
                // 【重要】値が空、または0の場合は、高得点計算(CS)を避けて0点とする
                if (rawValue === "" || rawValue === null || parseFloat(rawValue) === 0) {
                    return 0;
                }
                return CS(parseFloat(rawValue), x, g);
            }));
        } else {
            // データが全くない学年はグラフを描画しない
            dataSets.push(null);
        }
    });

    // --- 以下、描画処理（変更なしですが、関数として完結させるため記載） ---
    ctx.clearRect(0, 0, cv.width, cv.height);
    const cX = cv.width / 2;
    const cY = cv.height / 2 - 15; // ここをマイナスにすると上に上がります
    const rad = 210; // 半径をわずかに小さくすると、さらに余白をコントロールしやすくなります 
    const as = (Math.PI * 2) / h.length;

    // 背景（目盛り）描画
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 10; i++) {
        ctx.beginPath(); 
        ctx.arc(cX, cY, (rad / 10) * i, 0, Math.PI * 2); 
        ctx.stroke();

        // --- ★ここから追加・修正：目盛りの数字を大きく表示 ---
        if (i === 1 || i === 5 || i === 10) {
            const text = i + "点";
            const textY = cY - (rad / 10) * i;
            
            // 1. 数字を見やすくするために背景に白い丸を描画
            ctx.beginPath();
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // 80%の不透明度
            ctx.arc(cX, textY, 12, 0, Math.PI * 2); // 半径12pxの白い円
            ctx.fill();

            // 2. 文字の描画（太字で大きく）
            ctx.fillStyle = "#444"; // 少し濃いめのグレー
            ctx.font = "bold 14px Arial"; // サイズを10px → 14pxに拡大
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(text, cX, textY);
        }
    }
    
    // 軸とラベル描画
    h.forEach((lb, i) => {
        const a = as * i - Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(cX, cY); ctx.lineTo(cX + Math.cos(a) * rad, cY + Math.sin(a) * rad); ctx.stroke();
        
        ctx.fillStyle = "#333"; 
        ctx.textAlign = "center";
        ctx.font = "bold 13px Arial";

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

        const offset = 18; 
        let x = cX + Math.cos(a) * (rad + offset);
        let y = cY + Math.sin(a) * (rad + offset);
        if (Math.abs(Math.sin(a)) > 0.9) y += (Math.sin(a) > 0) ? 10 : -5;
        ctx.fillText(fullLabel, x, y);
    });

    // データのポリゴン描画
    const currentGr = document.getElementById("grade").value;
    dataSets.forEach((scs, ri) => {
        if (!scs || (typeof radarVisible !== 'undefined' && !radarVisible[ri])) return;
        
        const c = cols[ri];
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

    // 凡例描画
    const regs = ["帯広", "北海道", "全国", "中1", "中2", "中3"];
    ctx.setLineDash([]);
    const startX = cX - 270;
    const itemWidth = 90;
    regs.forEach((rg, i) => {
        const lX = startX + i * itemWidth;
        const lY = cv.height - 20;
        ctx.fillStyle = (typeof radarVisible !== 'undefined' && radarVisible[i]) ? cols[i].s : "#ccc";
        ctx.fillRect(lX, lY - 10, 15, 10);
        ctx.fillStyle = "#333";
        ctx.textAlign = "left";
        ctx.font = "bold 12px Arial";
        ctx.fillText(rg, lX + 20, lY);
    });
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
    const viewGrade = document.getElementById("trackingViewGrade").value;
    const key = `tracking-${g}`;
    const trackingData = JSON.parse(localStorage.getItem(key) || '{}');
    const allRecords = trackingData[eventIdx] || [];
    const records = allRecords.filter(r => String(r.grade) === String(viewGrade));
    const h = D[g].h;

    // --- ヘッダー部分のレイアウト修正 ---
    const trackingArea = document.getElementById("tracking");
    // 既存の「変容グラフ」というタイトルがHTML側にある場合は、JSで上書きするか、HTML側を調整します。
    // ここでは統計表示エリア(trackingStats)より上の部分を整理する想定です。

    const canvas = document.getElementById("trackingGraph");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (records.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`中${viewGrade}年の記録がありません`, canvas.width/2, 200);
        document.getElementById("trackingStats").innerHTML = '<div style="text-align:center;color:#666;padding:20px;background:#f5f5f5;border-radius:8px">データがありません</div>';
        document.getElementById("trackingList").innerHTML = '';
        return;
    }
    
    drawTrackingGraph(records, h[eventIdx]);
    updateTrackingStats(records, h[eventIdx]); // 下記の修正版が呼ばれます
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
    
    // 伸びの色判定（50m走や持久走は数値が低いほうが良いため、種目名で判定）
    const isLowerBetter = eventName.includes("50m") || eventName.includes("持久");
    let isImproved = isLowerBetter ? diff < 0 : diff > 0;
    
    const diffColor = isImproved ? '#d9534f' : (diff === 0 ? '#666' : '#0275d8');
    const diffIcon = isImproved ? '📈' : (diff === 0 ? '➡️' : '📉');
    
    // 数値の符号調整
    const diffDisplay = (diff > 0 ? "+" : "") + diff.toFixed(1);

    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; margin-bottom: 20px;">
            <div style="background:#fff; padding:15px; border-radius:10px; text-align:center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee;">
                <div style="color:#888; font-size:11px; margin-bottom:5px; font-weight:bold;">初回記録</div>
                <div style="font-size:20px; font-weight:bold; color:#333;">${first.value}</div>
                <div style="color:#bbb; font-size:10px;">${first.date}</div>
            </div>
            <div style="background:#fff; padding:15px; border-radius:10px; text-align:center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee;">
                <div style="color:#888; font-size:11px; margin-bottom:5px; font-weight:bold;">最新記録</div>
                <div style="font-size:20px; font-weight:bold; color:#FF5722;">${last.value}</div>
                <div style="color:#bbb; font-size:10px;">${last.date}</div>
            </div>
            <div style="background:#fff; padding:15px; border-radius:10px; text-align:center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #eee; border-top: 4px solid ${diffColor};">
                <div style="color:#888; font-size:11px; margin-bottom:5px; font-weight:bold;">伸び ${diffIcon}</div>
                <div style="font-size:20px; font-weight:bold; color:${diffColor}">${diffDisplay}</div>
                <div style="color:${diffColor}; font-size:10px; font-weight:bold;">${diffPercent}%</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div style="background:#f8f9fa; padding:15px; border-radius:10px; border-left: 5px solid #6c757d;">
                <div style="color:#444; font-size:13px; font-weight:bold; margin-bottom:10px; display:flex; align-items:center;">
                    <span style="margin-right:5px;">📊</span> 統計情報
                </div>
                <div style="font-size:13px; line-height:1.8; color: #555;">
                    <div style="display:flex; justify-content:space-between;"><span>測定回数</span> <b>${records.length}回</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>平均値</span> <b>${avg}</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>最高記録</span> <b>${max}</b></div>
                    <div style="font-size:10px; color:#999; text-align:right;">(${maxRecord.date})</div>
                </div>
            </div>
            <div style="background:#eef7ff; padding:15px; border-radius:10px; border-left: 5px solid #0275d8;">
                <div style="color:#0275d8; font-size:13px; font-weight:bold; margin-bottom:10px; display:flex; align-items:center;">
                    <span style="margin-right:5px;">💡</span> 分析コメント
                </div>
                <div style="font-size:13px; line-height:1.6; color:#01438d; font-weight: 500;">
                    ${isImproved ? 
                        '素晴らしい向上です！トレーニングの成果がしっかり出ていますね。この調子を維持しましょう！' : 
                        (diff === 0 ? '記録が安定しています。さらなる向上を目指して、練習メニューに変化をつけてみるのも良いかもしれません。' : 
                        '今回は少し記録を落としましたが、体調や環境の影響もあります。次の測定でリベンジしましょう！')}
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

function updateAllCharts() {
    const g = document.getElementById("gender").value;
    // 表示されている時だけ描画を更新する
    if (document.getElementById("radar").style.display !== "none") RR(g);
    if (document.getElementById("correlation").style.display !== "none") RAnalysis(g);
    if (document.getElementById("tracking").style.display !== "none") updateTrackingView();
}

function preparePrint() {
    // 1. 性別の値を取得
    const gender = document.getElementById("gender").value;

    // 2. グラフエリアが「none」だと描画がバグる場合があるため、一時的に表示状態にする
    const radarArea = document.getElementById("radar");
    const originalDisplay = radarArea.style.display;
    radarArea.style.display = "block";

    // 3. グラフ描画関数(RR)を強制実行
    RR(gender);

    // 4. 描画が完了するのをわずかに待ってから印刷ダイアログを開く
    setTimeout(() => {
        window.print();
        
        // 5. 印刷が終わったら元の表示状態（隠れていたなら隠す）に戻す
        // ※ 印刷プレビューを閉じるとここが実行されます
        radarArea.style.display = originalDisplay;
    }, 300);
}

// --- 追加：凡例クリック判定 ---
document.getElementById("rc").onclick = function(e) {
    const cv = e.target;
    const rect = cv.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cX = cv.width / 2;
    const startX = cX - 270; // 凡例の開始位置
    const itemWidth = 90;    // 各凡例の幅
    const lY = cv.height - 20;

    // 6つの凡例（帯広〜中3）のどこをクリックしたか判定
    for (let i = 0; i < 6; i++) {
        const lX = startX + i * itemWidth;
        // 四角と文字のあたり（横80px、縦25pxの範囲）をクリックしたかチェック
        if (x >= lX && x <= lX + 80 && y >= lY - 20 && y <= lY + 10) {
            radarVisible[i] = !radarVisible[i]; // 表示・非表示を反転
            RR(document.getElementById("gender").value); // 再描画
            break;
        }
    }
};
