/**
 * js/charts.js 
 * 全てのグラフ表示をコントロールするファイル
 */

// 1. レーダーチャートを表示・更新する関数
function updateRadarChart() {
    const canvas = document.getElementById('rc');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = document.getElementById("gender").value;
    
    // 保存されている履歴（中1〜中3）を読み込む
    const history = JSON.parse(localStorage.getItem("history-" + g) || "{}");
    const datasets = [];

    // --- 【基準】帯広市平均（点線） ---
    datasets.push({
        label: '帯広市平均',
        data: [6, 6, 6, 6, 6, 6, 6, 6], // ※後でdata.jsの平均値と連動可能
        borderColor: 'rgba(0, 0, 0, 0.4)',
        borderDash: [5, 5],
        fill: false,
        borderWidth: 2
    });

    // --- 【個人】学年ごとのデータ（履歴があれば追加） ---
    const colors = {
        "1": "rgba(76, 175, 80, 0.3)",  // 中1: 緑
        "2": "rgba(33, 150, 243, 0.3)", // 中2: 青
        "3": "rgba(255, 152, 0, 0.3)"  // 中3: オレンジ
    };

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

    // グラフを実際に描画する（Chart.jsを使用）
    if (window.myRadar) window.myRadar.destroy();
    window.myRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ["握力", "上体", "長座", "反復", "持久/S", "50m", "立幅", "投"],
            datasets: datasets
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    max: 10,
                    ticks: { stepSize: 2, display: false }
                }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// 2. ボタンを押した時の「表示・非表示」を切り替える関数群
function toggleRadar() {
    const r = document.getElementById('radar');
    r.style.display = (r.style.display === 'none') ? 'block' : 'none';
    if (r.style.display === 'block') updateRadarChart();
}

function toggleGrowth() {
    alert("経年変化は『レーダーチャート』に統合されました。中1〜中3の比較が1枚で見られます。");
}

function toggleAnalysis() {
    const c = document.getElementById('correlation');
    c.style.display = (c.style.display === 'none') ? 'block' : 'none';
    // updateAnalysis関数が他で定義されている場合に実行
    if (c.style.display === 'block' && typeof updateAnalysis === 'function') updateAnalysis();
}

function toggleTracking() {
    const t = document.getElementById('tracking');
    t.style.display = (t.style.display === 'none') ? 'block' : 'none';
    // updateTrackingView関数が他で定義されている場合に実行
    if (t.style.display === 'block' && typeof updateTrackingView === 'function') updateTrackingView();
}
