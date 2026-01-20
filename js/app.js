// --- メイン計算更新関数 (修正版) ---
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
    
    // 1. メイン入力テーブル内の合計点更新
    if (scArea) {
        scArea.querySelector("div").textContent = totalScore;
        scArea.querySelectorAll("div")[1].textContent = lv;
    }
    
    // 2. ★追加：体力図鑑の下の「totalRank」エリアに情報を表示
    const totalRankArea = document.getElementById("totalRank");
    if (totalRankArea) {
        totalRankArea.innerHTML = `合計点: ${totalScore}点 ／ 総合評価: <span style="font-size:28px; color:#ffeb3b;">${lv}</span>`;
    }

    const highlightEl = document.getElementById(`e${lv}${gr}`);
    if (highlightEl) highlightEl.classList.add("highlight");

    if (!isInitial) SI();
    updateTimestamp();
    RAnalysis(g); // 図鑑とランキングの更新
    
    // 3. ★重要：レーダーチャート関数の呼び出し（charts.jsに合わせる）
    if (typeof updateRadar === 'function') updateRadar();
}

// --- 体力分析 (修正版) ---
function RAnalysis(g) {
    const h = D[g].h.slice(0, 9);
    let myScores = [];
    let hasData = false;
    
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
    
    const pokedex = document.getElementById("fitnessPokedex");
    if (!pokedex) return;

    if (!hasData) {
        pokedex.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:white;opacity:0.8;padding:40px">データを入力すると図鑑が表示されます</div>';
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
            pokedexHtml += `<div class="pokedex-card" style="--type-color:${type.color}; background:rgba(255,255,255,0.1); padding:10px; border-radius:10px; text-align:center; border:1px solid ${type.color}">
                <span style="font-size:48px;">${type.emoji}</span>
                <div style="font-weight:bold; margin-top:5px;">${type.name}</div>
                <div style="font-size:14px; opacity:0.9;">Lv.${level}</div>
            </div>`;
        });
        pokedex.innerHTML = `<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(100px, 1fr)); gap:10px;">${pokedexHtml}</div>`;
    }

    // ランキングの更新
    updateRanking(g, h);
}

// ランキング表示用（分離）
function updateRanking(g, h) {
    const rb = document.getElementById("rankingBox");
    if (!rb) return;
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
        return;
    }
    let html = `<h3 style="text-align:center; color:#ed8936; margin-bottom:20px;">🏆 種目別ランキング</h3><div style="display:flex; flex-wrap:wrap; gap:12px; justify-content:center;">`;
    rankData.forEach((item, index) => {
        let icon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
        html += `<div style="background:#f7fafc; border:2px solid #e2e8f0; padding:10px; border-radius:12px; text-align:center; min-width:110px;">
            <div style="font-size:12px; color:#718096;">${index + 1}位</div>
            <div style="font-size:15px; font-weight:bold;">${icon}${item.name}</div>
            <div style="font-size:18px; color:#2b6cb0;">${item.score}点</div>
        </div>`;
    });
    rb.innerHTML = html + `</div>`;
}
