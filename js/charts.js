/**
 * js/charts.js 
 * 全機能統合版：レーダーチャート（3学年重ね合わせ）、体力分析図鑑、トラッキング
 */

// --- 1. レーダーチャート表示（中1〜3の重ね合わせ対応） ---
function updateRadarChart() {
    const canvas = document.getElementById('rc');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = document.getElementById("gender").value;
    
    // localStorageから過去の履歴を取得
    const history = JSON.parse(localStorage.getItem("history-" + g) || "{}");
    const datasets = [];

    // 基準線（帯広市平均：data.jsから計算または定数）
    datasets.push({
        label: '帯広市平均',
        data: [6, 6, 6, 6, 6, 6, 6, 6], 
        borderColor: 'rgba(0, 0, 0, 0.4)',
        borderDash: [5, 5],
        fill: false,
        borderWidth: 2
    });

    // 学年別カラー設定
    const colors = {
        "1": "rgba(76, 175, 80, 0.3)",  // 緑
        "2": "rgba(33, 150, 243, 0.3)", // 青
        "3": "rgba(255, 152, 0, 0.3)"   // オレンジ
    };

    // 保存されている各学年のデータをセット
    ["1", "2", "3"].forEach(grade => {
        if (history[grade]) {
            datasets.push({
                label: `中${grade}の自分`,
                data: history[grade],
                backgroundColor: colors[grade],
                borderColor: colors[grade].replace("0.3", "1"),
                borderWidth: 2,
                fill: true
            });
        }
    });

    if (window.myRadar) window.myRadar.destroy();
    window.myRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ["握力", "上体", "長座", "反復", "持久/S", "50m", "立幅", "投"],
            datasets: datasets
        },
        options: {
            scales: { r: { min: 0, max: 10, ticks: { display: false } } },
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// --- 2. 体力分析図鑑 × 目標達成シミュレーター（メインロジック） ---
function fitnessAnalysis() {
    const pokedex = document.getElementById('fitnessPokedex');
    const totalRankArea = document.getElementById('totalRank');
    if (!pokedex) return;

    // 表から現在の得点を取得
    const points = [];
    let totalScore = 0;
    for(let i=0; i<8; i++) {
        const row = document.querySelector(`#table tr:nth-child(${i+1})`);
        const p = row ? parseInt(row.cells[2].innerText) || 0 : 0;
        points.push(p);
        totalScore += p;
    }

    // 総合ランク判定
    let rank = "E";
    if (totalScore >= 65) rank = "A";
    else if (totalScore >= 50) rank = "B";
    else if (totalScore >= 35) rank = "C";
    else if (totalScore >= 20) rank = "D";
    
    totalRankArea.innerHTML = `総合得点: ${totalScore}点 / 総合評価: ${rank}ランク`;

    // タイプ判定ロジック（パワー、スピード、柔軟性など）
    const types = [];
    if (points[0] > 7 && points[7] > 7) types.push({name: "剛腕の巨人", desc: "握力と投げに優れたパワータイプ"});
    if (points[5] > 7 && points[6] > 7) types.push({name: "神速の駿馬", desc: "50m走と立ち幅跳びが武器のスピードタイプ"});
    if (points[2] > 7) types.push({name: "軟体の蛇", desc: "驚異の柔軟性を持つテクニシャン"});
    if (points[4] > 7) types.push({name: "不屈の鉄人", desc: "無限のスタミナを持つ持久力タイプ"});
    
    if (types.length === 0) types.push({name: "成長の原石", desc: "これからの伸び代が一番大きいバランス型"});

    pokedex.innerHTML = types.map(t => `
        <div style="background:rgba(255,255,255,0.2);padding:15px;border-radius:10px">
            <div style="font-weight:bold;font-size:18px">${t.name}</div>
            <div style="font-size:13px">${t.desc}</div>
        </div>
    `).join('');
}

function setGoal(targetRank) {
    const goalArea = document.getElementById('goalSimulator');
    const targetScores = { rankA: 65, rankB: 50, rankC: 35, rankD: 20 };
    const currentScore = Array.from(document.querySelectorAll('#table tr')).reduce((acc, tr) => acc + (parseInt(tr.cells[2].innerText) || 0), 0);
    const diff = targetScores[targetRank] - currentScore;

    if (diff <= 0) {
        goalArea.innerHTML = `<div style="text-align:center;color:#4CAF50;font-weight:bold">おめでとう！すでに目標を達成しています！</div>`;
    } else {
        goalArea.innerHTML = `
            <div style="background:white;padding:15px;border-radius:10px;color:#333">
                <p>目標まであと <strong>${diff}点</strong> 必要です。</p>
                <p style="font-size:14px">おすすめの強化項目: <br>得点が低い種目をあと1点ずつ伸ばすのが近道です！</p>
            </div>`;
    }
}

// --- 3. 種目別トラッキング機能 ---
function addTrackingRecord() {
    const event = document.getElementById('trackingEvent').value;
    const value = document.getElementById('trackingValue').value;
    const date = document.getElementById('trackingDate').value || new Date().toISOString().split('T')[0];
    const unit = document.getElementById('trackingUnit').value;
    const memo = document.getElementById('trackingMemo').value;

    if (!value) { alert("値を入力してください"); return; }

    const records = JSON.parse(localStorage.getItem('tracking_records') || '[]');
    records.push({ event, value: parseFloat(value), date, unit, memo });
    localStorage.setItem('tracking_records', JSON.stringify(records));
    
    alert("記録を保存しました");
    updateTrackingView();
}

function updateTrackingView() {
    const canvas = document.getElementById('trackingGraph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const eventIdx = document.getElementById('trackingViewEvent').value;
    const records = JSON.parse(localStorage.getItem('tracking_records') || '[]');
    const filtered = records.filter(r => r.event == eventIdx).sort((a,b) => new Date(a.date) - new Date(b.date));

    if (window.myTracking) window.myTracking.destroy();
    window.myTracking = new Chart(ctx, {
        type: 'line',
        data: {
            labels: filtered.map(r => r.date),
            datasets: [{
                label: '記録の推移',
                data: filtered.map(r => r.value),
                borderColor: '#FF5722',
                tension: 0.3,
                fill: false
            }]
        }
    });

    const list = document.getElementById('trackingList');
    list.innerHTML = filtered.reverse().map(r => `
        <div style="padding:10px;border-bottom:1px solid #eee;display:flex;justify-content:space-between">
            <span>${r.date}</span> <strong>${r.value}</strong> <span>${r.unit || ''}</span>
        </div>
    `).join('');
}

// --- 4. パネル表示切り替え ---
function toggleRadar() { 
    const r = document.getElementById('radar');
    r.style.display = (r.style.display === 'none') ? 'block' : 'none';
    if (r.style.display === 'block') updateRadarChart();
}
function toggleGrowth() { toggleRadar(); alert("経年変化はレーダーチャートに統合されました。"); }
function toggleAnalysis() { 
    const c = document.getElementById('correlation');
    c.style.display = (c.style.display === 'none') ? 'block' : 'none';
    if (c.style.display === 'block') fitnessAnalysis();
}
function toggleTracking() { 
    const t = document.getElementById('tracking');
    t.style.display = (t.style.display === 'none') ? 'block' : 'none';
    if (t.style.display === 'block') updateTrackingView();
}
