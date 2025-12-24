function updateRadarChart() {
    const canvas = document.getElementById('rc');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = document.getElementById("gender").value;
    
    // 1. 保存されている履歴（中1〜中3）を読み込む
    const history = JSON.parse(localStorage.getItem("history-" + g) || "{}");
    
    const datasets = [];

    // --- A. 帯広市平均（点線：data.jsから引用する想定の仮値） ---
    // ※後ほどdata.jsの平均値と完全に連動させる修正も可能です
    datasets.push({
        label: '帯広市平均',
        data: [6, 6, 6, 6, 6, 6, 6, 6], 
        borderColor: 'rgba(0, 0, 0, 0.4)',
        borderDash: [5, 5],
        fill: false,
        borderWidth: 2
    });

    // --- B. 学年ごとの自分のデータを追加 ---
    const colors = {
        "1": "rgba(76, 175, 80, 0.3)",   // 中1: 緑
        "2": "rgba(33, 150, 243, 0.3)",  // 中2: 青
        "3": "rgba(255, 152, 0, 0.3)"    // 中3: オレンジ
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

    // 3. グラフを描画（既存のグラフがあれば破棄して作り直す）
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
                    ticks: { stepSize: 2, display: false },
                    grid: { color: "#ddd" }
                }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// 画面表示を切り替える関数（これも上書きに含めます）
function toggleRadar() {
    const r = document.getElementById('radar');
    r.style.display = (r.style.display === 'none') ? 'block' : 'none';
    if (r.style.display === 'block') updateRadarChart();
}

// 経年変化は使わないので、もし呼ばれてもエラーにならないよう空の関数にしておきます
function toggleGrowth() {
    alert("経年変化はレーダーチャートに統合されました。");
}
