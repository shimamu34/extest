// charts.js の一番上に追記（二重定義エラーを防ぎつつ初期値を確保）
var radarVisible = radarVisible || [true, true, true, true, true, true];


// --- グラフ表示切り替え（レーダー） ---
function toggleRadar() {
    const c = document.getElementById("radar");
    if (c.style.display === "none") {
        c.style.display = "block";
        RR(document.getElementById("gender").value);
    } else {
        c.style.display = "none";
    }
}

// --- グラフ表示切り替え（分析） ---
function toggleAnalysis() {
    const c = document.getElementById("correlation");
    if (c.style.display === "none") {
        c.style.display = "block";
        RAnalysis(document.getElementById("gender").value);
    } else {
        c.style.display = "none";
    }
}

// --- ★新設：ランキング表示切り替え（独立ボタン用） ---
function toggleRanking() {
    const rb = document.getElementById("rankingBox");
    const g = document.getElementById("gender").value;
    if (rb.style.display === "none") {
        rb.style.display = "block";
        // ランキングの中身を最新にするため計算関数を呼ぶ
        if (typeof RAnalysis === 'function') RAnalysis(g);
    } else {
        rb.style.display = "none";
    }
}

// --- グラフ表示切り替え（トラッキング） ---
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

    // 4-6. 自分の各学年データ（修正済み）
    ["1", "2", "3"].forEach(grKey => {
        const gradeData = allData[grKey]; // データオブジェクトを取得
        const values = gradeData ? gradeData.v : null; // .v から配列を取り出す

        // 配列(values)が存在し、かつデータが入っているかチェック
        if (values && values.some(v => v !== "" && v !== null && parseFloat(v) !== 0)) {
            dataSets.push(h.map((x, i) => {
                const rawValue = values[i]; // 配列から値を取得
                
                // 値が空、または0の場合は0点とする
                if (rawValue === "" || rawValue === null || parseFloat(rawValue) === 0) {
                    return 0;
                }
                return CS(parseFloat(rawValue), x, g);
            }));
        } else {
            // データがない場合はグラフを描画しない
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
    const currentGr = document.getElementById("grade").value; // "1", "2", または "3"
    dataSets.forEach((scs, ri) => {
        if (!scs || (typeof radarVisible !== 'undefined' && !radarVisible[ri])) return;
        
        const c = cols[ri];
        const isSelf = ri >= 3; // 3:中1, 4:中2, 5:中3

        // --- ★ここを修正：現在の学年かどうかを正しく判定 ---
        // ri:3(中1)なら "1"、ri:4(中2)なら "2"、ri:5(中3)なら "3" と比較します
        const isActive = isSelf && (ri - 2).toString() === currentGr;
        
        ctx.beginPath();
        // ★isSelf（自分のデータ）かつ isActive（今の学年）でないなら点線にする
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

    // 凡例描画（クリック状態を反映）
    const regs = ["帯広", "北海道", "全国", "中1", "中2", "中3"];
    ctx.setLineDash([]);
    const startX = cX - 270;
    const itemWidth = 90;
    
    regs.forEach((rg, i) => {
        const lX = startX + i * itemWidth;
        const lY = cv.height - 20;
        const isVisible = (typeof radarVisible !== 'undefined' && radarVisible[i]);

        if (isVisible) {
            // 【表示中】本来の色で塗りつぶし
            ctx.fillStyle = cols[i].s;
            ctx.fillRect(lX, lY - 10, 15, 10);
            ctx.fillStyle = "#333";
        } else {
            // 【非表示】グレーの枠線だけにする
            ctx.strokeStyle = "#ccc";
            ctx.strokeRect(lX, lY - 10, 15, 10);
            ctx.fillStyle = "#aaa"; // 文字も薄く
        }

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
    const eventIdx = parseInt(document.getElementById("trackingViewEvent")?.value || 0);
    const g = document.getElementById("gender").value;
    const viewGrade = document.getElementById("trackingViewGrade").value;
    const key = `tracking-${g}`;
    const trackingData = JSON.parse(localStorage.getItem(key) || '{}');
    const allRecords = trackingData[eventIdx] || [];
    const records = allRecords.filter(r => String(r.grade) === String(viewGrade));
    const h = D[g].h;

    // --- ① 変な場所に表示されている「古い要素」を特定して隠す ---
    // IDが重複している場合や、意図しない場所にある要素を非表示にします
    const allEvents = document.querySelectorAll('#trackingViewEvent');
    if (allEvents.length > 1) {
        allEvents[0].style.display = 'none'; // 古い方を隠す
        allEvents[0].id = 'old-tracking-event'; // IDの重複を避ける
    }
    
    // --- ② グラフの直前に「新しいヘッダー」を正しく配置する ---
    const canvas = document.getElementById("trackingGraph");
    const trackingSection = document.getElementById("tracking");
    
    let header = document.getElementById("dynamicTrackingHeader");
    if (!header) {
        header = document.createElement("div");
        header.id = "dynamicTrackingHeader";
        // グラフCanvasのすぐ上に挿入
        canvas.parentNode.insertBefore(header, canvas);
    }
    
    // デザインの適用（中央タイトル ＆ 右寄せ種目選択）
    header.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #fff; border-radius: 12px; border-bottom: 4px solid #FF5722; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="flex: 1;"></div> 
            <h2 style="flex: 2; text-align: center; font-size: 28px; margin: 0; color: #333; font-weight: bold;">📊 変容グラフ</h2>
            <div style="flex: 1; text-align: right; display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <span style="font-weight: bold; color: #666;">表示種目:</span>
                <select id="trackingViewEvent" onchange="updateTrackingView()" 
    style="font-size: 18px; padding: 8px 12px; border-radius: 8px; border: 2px solid #FF5722; background: white; font-weight: bold; text-align: center; text-align-last: center;">
    ${h.slice(0, 9).map((name, i) => `<option value="${i}" ${i === eventIdx ? 'selected' : ''}>${name}</option>`).join('')}
</select>
            </div>
        </div>
    `;

    // --- ③ 描画処理 ---
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (records.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = 'bold 24px Arial'; 
        ctx.textAlign = 'center';
        ctx.fillText(`中${viewGrade}年の記録がありません`, canvas.width/2, 200);
        document.getElementById("trackingStats").innerHTML = '<div style="text-align:center;color:#666;padding:40px;background:#f5f5f5;border-radius:12px;font-size:20px;">データが登録されていません</div>';
        document.getElementById("trackingList").innerHTML = '';
        return;
    }
    
    drawTrackingGraph(records, h[eventIdx]);
    updateTrackingStats(records, h[eventIdx]); 
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
    
    const isLowerBetter = eventName.includes("50m") || eventName.includes("持久");
    let isImproved = isLowerBetter ? diff < 0 : diff > 0;
    const diffColor = isImproved ? '#d9534f' : (diff === 0 ? '#666' : '#0275d8');
    const diffIcon = isImproved ? '📈' : (diff === 0 ? '➡️' : '📉');
    const diffDisplay = (diff > 0 ? "+" : "") + diff.toFixed(1);

    let html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 25px;">
            <div style="background:#fff; padding:20px; border-radius:12px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #eee;">
                <div style="color:#666; font-size:16px; margin-bottom:10px; font-weight:bold;">初回記録</div>
                <div style="font-size:32px; font-weight:bold; color:#333;">${first.value}</div>
                <div style="color:#999; font-size:14px;">${first.date}</div>
            </div>
            <div style="background:#fff; padding:20px; border-radius:12px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #eee;">
                <div style="color:#666; font-size:16px; margin-bottom:10px; font-weight:bold;">最新記録</div>
                <div style="font-size:32px; font-weight:bold; color:#FF5722;">${last.value}</div>
                <div style="color:#999; font-size:14px;">${last.date}</div>
            </div>
            <div style="background:#fff; padding:20px; border-radius:12px; text-align:center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 2px solid ${diffColor}; border-top: 8px solid ${diffColor};">
                <div style="color:#666; font-size:16px; margin-bottom:10px; font-weight:bold;">伸び ${diffIcon}</div>
                <div style="font-size:32px; font-weight:bold; color:${diffColor}">${diffDisplay}</div>
                <div style="color:${diffColor}; font-size:16px; font-weight:bold;">(${diffPercent}%)</div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
            <div style="background:#fdfdfd; padding:25px; border-radius:12px; border-left: 8px solid #6c757d; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="color:#333; font-size:22px; font-weight:bold; margin-bottom:15px; display:flex; align-items:center;">
                    <span style="margin-right:10px;">📊</span> 統計詳細
                </div>
                <div style="font-size:20px; line-height:2.0; color: #444;">
                    <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #ccc;"><span>測定回数</span> <b>${records.length} 回</b></div>
                    <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #ccc;"><span>期間内平均</span> <b>${avg}</b></div>
                    <div style="display:flex; justify-content:space-between;"><span>自己ベスト</span> <b>${max}</b></div>
                    <div style="font-size:16px; color:#888; text-align:right;">(達成日: ${maxRecord.date})</div>
                </div>
            </div>
            <div style="background:#eef7ff; padding:25px; border-radius:12px; border-left: 8px solid #0275d8; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="color:#0275d8; font-size:22px; font-weight:bold; margin-bottom:15px; display:flex; align-items:center;">
                    <span style="margin-right:10px;">💡</span> 分析コメント
                </div>
                <div style="font-size:19px; line-height:1.7; color:#01438d; font-weight: bold;">
                    ${isImproved ? 
                        '素晴らしい向上です！日頃のトレーニングの成果が明確に数値として表れています。この調子で次の目標も突破しましょう！' : 
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
    
    // ★追加：表示用のカウンターを1から開始するように定義
    let displayNo = 1; 
    
    allRecords.forEach((r, i) => {
        // 選択中の学年以外のデータはスキップ
        if (String(r.grade) !== String(viewGrade)) return;
        
        html += `<tr style="border-bottom:1px solid #f0f0f0">
            <td style="padding:12px;text-align:center;font-weight:bold">${displayNo++}</td>
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
document.addEventListener('DOMContentLoaded', function() {
    const cv = document.getElementById("rc");
    if (!cv) return; // キャンバスが無い場合は何もしない（エラー回避）

    cv.onclick = function(e) {
        const rect = cv.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const cX = cv.width / 2;
        const startX = cX - 270; 
        const itemWidth = 90;    
        const lY = cv.height - 20;

        // 6つの凡例（帯広〜中3）のクリック判定
        for (let i = 0; i < 6; i++) {
            const lX = startX + i * itemWidth;
            if (x >= lX && x <= lX + 80 && y >= lY - 20 && y <= lY + 10) {
                radarVisible[i] = !radarVisible[i]; // 表示切り替え
                
                // 性別を取得して再描画
                const g = document.getElementById("gender") ? document.getElementById("gender").value : "m";
                RR(g); 
                break;
            }
        }
    };
});

// --- app.jsとHTMLを橋渡しする関数 ---
function updateRadar() {
    const g = document.getElementById("gender").value;
    RR(g);
}

// HTML側の toggleView 関数から呼ばれる更新処理を整理
const originalToggleView = window.toggleView; // 既存のtoggleViewを退避
window.toggleView = function(id) {
    // 1. まず表示を切り替える（HTML側のscriptタグに書いたロジックを実行）
    const ids = ['radar', 'rankingBox', 'correlation', 'tracking'];
    ids.forEach(i => {
        const el = document.getElementById(i);
        if (el) el.style.display = (i === id) ? 'block' : 'none';
    });

    // 2. 表示された瞬間に描画関数を呼び出す
    const g = document.getElementById("gender").value;
    if (id === 'radar') RR(g);
    if (id === 'correlation') RAnalysis(g);
    if (id === 'tracking') {
        document.getElementById("trackingDate").valueAsDate = new Date();
        updateTrackingView();
    }
};
