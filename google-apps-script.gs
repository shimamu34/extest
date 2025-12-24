/**
 * 中学体力テスト記録システム - Google Apps Script
 * 
 * このコードをGoogleスプレッドシートのApps Scriptエディタに貼り付けてください。
 * 
 * セットアップ手順:
 * 1. Googleスプレッドシートを開く
 * 2. 「拡張機能」→「Apps Script」を選択
 * 3. このコードを貼り付け
 * 4. 「デプロイ」→「新しいデプロイ」
 * 5. 種類: ウェブアプリ
 * 6. 次のユーザーとして実行: 自分
 * 7. アクセスできるユーザー: 全員
 * 8. 「デプロイ」をクリック
 * 9. 表示される「ウェブアプリURL」をコピー
 */

/**
 * POSTリクエストを処理する関数
 * 生徒から送られてくる体力テストデータを受信してスプレッドシートに記録
 */
function doPost(e) {
  try {
    // POSTデータをJSONとしてパース
    const data = JSON.parse(e.postData.contents);
    
    // 現在のスプレッドシートを取得
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 「体力テスト記録」シートを取得（なければ作成）
    let sheet = ss.getSheetByName('体力テスト記録');
    
    if (!sheet) {
      // シートが存在しない場合は新規作成
      sheet = ss.insertSheet('体力テスト記録');
      
      // ヘッダー行を追加
      sheet.appendRow([
        '出席番号', '氏名', '性別', '学年', '組', '測定回',
        '握力', '上体起こし', '長座体前屈', '反復横とび',
        '持久走', 'シャトルラン', '50m走', '立ち幅跳び', 'ハンドボール投げ',
        '送信日時'
      ]);
      
      // ヘッダー行を太字にして背景色を設定
      const headerRange = sheet.getRange(1, 1, 1, 16);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      
      // 列幅の自動調整
      for (let i = 1; i <= 16; i++) {
        sheet.autoResizeColumn(i);
      }
    }
    
    // データ行を追加
    sheet.appendRow([
      data.studentId,
      data.name,
      data.gender === 'male' ? '男子' : '女子',
      data.grade,
      data.class,
      data.session,
      data.grip,
      data.situp,
      data.forward,
      data.sidestep,
      data.endurance,
      data.shuttle,
      data.sprint50,
      data.jump,
      data.throw,
      new Date()
    ]);
    
    // 最新行に軽い背景色を設定（見やすさ向上）
    const lastRow = sheet.getLastRow();
    const dataRange = sheet.getRange(lastRow, 1, 1, 16);
    if (lastRow % 2 === 0) {
      dataRange.setBackground('#f8f9fa');
    }
    
    // 数値列の書式設定
    const numericColumns = [7, 8, 9, 10, 11, 12, 13, 14, 15]; // 体力測定値の列
    numericColumns.forEach(col => {
      const cell = sheet.getRange(lastRow, col);
      cell.setNumberFormat('0.00');
    });
    
    // 成功レスポンスを返す
    return ContentService.createTextOutput(
      JSON.stringify({success: true, message: 'データを記録しました'})
    ).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // エラーログを記録
    Logger.log('エラー: ' + error.toString());
    
    // エラーレスポンスを返す
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false, 
        error: error.toString(),
        message: 'データの記録に失敗しました'
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * GETリクエストを処理する関数（テスト用）
 * ブラウザで直接アクセスした際の確認画面を表示
 */
function doGet(e) {
  const html = HtmlService.createHtmlOutput(`
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .card {
            background: white;
            color: #333;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          h1 {
            margin-top: 0;
            color: #667eea;
          }
          .status {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            display: inline-block;
            margin: 20px 0;
          }
          code {
            background: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>🎯 体力テスト記録システム</h1>
          <div class="status">✅ システムは正常に動作しています</div>
          <h2>📊 このスクリプトについて</h2>
          <p>
            このGoogle Apps Scriptは、生徒から送信される体力テストのデータを
            自動的にスプレッドシートに記録します。
          </p>
          <h3>🔧 セットアップ状況</h3>
          <ul>
            <li>✅ スクリプトは正常にデプロイされています</li>
            <li>✅ POSTリクエストを受け付けています</li>
            <li>✅ データは「体力テスト記録」シートに保存されます</li>
          </ul>
          <h3>📝 使い方</h3>
          <ol>
            <li>このURLを<strong>体力テストアプリの初回設定</strong>に入力</li>
            <li>生徒配布用URLを生成</li>
            <li>Google Classroomなどで生徒に配布</li>
          </ol>
          <p style="margin-top: 30px; color: #999; font-size: 14px;">
            最終更新: 2025年12月23日
          </p>
        </div>
      </body>
    </html>
  `);
  return html;
}

/**
 * テスト用関数: ダミーデータを送信してスプレッドシートに記録されるか確認
 * Apps Scriptエディタで実行できます
 */
function testDataInsertion() {
  // テストデータを作成
  const testData = {
    postData: {
      contents: JSON.stringify({
        studentId: '99',
        name: 'テスト太郎',
        gender: 'male',
        grade: '2',
        class: 'A',
        session: '1',
        grip: 30.5,
        situp: 28,
        forward: 45,
        sidestep: 52,
        endurance: 360,
        shuttle: 85,
        sprint50: 7.8,
        jump: 210,
        throw: 25
      })
    }
  };
  
  // doPost関数を呼び出し
  const result = doPost(testData);
  Logger.log(result.getContent());
  
  // 結果をログに出力
  Logger.log('テストデータの挿入が完了しました');
  Logger.log('スプレッドシートの「体力テスト記録」シートを確認してください');
}

/**
 * 集計用関数: クラス別の平均値を計算
 * スプレッドシートのメニューから実行できます
 */
function calculateClassAverages() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSheet = ss.getSheetByName('体力テスト記録');
  
  if (!dataSheet) {
    Browser.msgBox('「体力テスト記録」シートが見つかりません');
    return;
  }
  
  // データ範囲を取得（ヘッダーを除く）
  const lastRow = dataSheet.getLastRow();
  if (lastRow <= 1) {
    Browser.msgBox('データが存在しません');
    return;
  }
  
  const dataRange = dataSheet.getRange(2, 1, lastRow - 1, 16);
  const data = dataRange.getValues();
  
  // クラス別に集計
  const classList = {};
  
  data.forEach(row => {
    const className = `${row[3]}年${row[4]}組`; // 学年+組
    if (!classList[className]) {
      classList[className] = {
        count: 0,
        grip: 0, situp: 0, forward: 0, sidestep: 0,
        endurance: 0, shuttle: 0, sprint50: 0, jump: 0, throw: 0
      };
    }
    
    classList[className].count++;
    classList[className].grip += row[6] || 0;
    classList[className].situp += row[7] || 0;
    classList[className].forward += row[8] || 0;
    classList[className].sidestep += row[9] || 0;
    classList[className].endurance += row[10] || 0;
    classList[className].shuttle += row[11] || 0;
    classList[className].sprint50 += row[12] || 0;
    classList[className].jump += row[13] || 0;
    classList[className].throw += row[14] || 0;
  });
  
  // 平均値を計算して新しいシートに出力
  let summarySheet = ss.getSheetByName('クラス別平均');
  if (!summarySheet) {
    summarySheet = ss.insertSheet('クラス別平均');
  } else {
    summarySheet.clear();
  }
  
  // ヘッダー
  summarySheet.appendRow([
    'クラス', '人数', '握力', '上体起こし', '長座体前屈', '反復横とび',
    '持久走', 'シャトルラン', '50m走', '立ち幅跳び', 'ハンドボール投げ'
  ]);
  
  // 各クラスの平均値
  Object.keys(classList).sort().forEach(className => {
    const classData = classList[className];
    summarySheet.appendRow([
      className,
      classData.count,
      (classData.grip / classData.count).toFixed(2),
      (classData.situp / classData.count).toFixed(2),
      (classData.forward / classData.count).toFixed(2),
      (classData.sidestep / classData.count).toFixed(2),
      (classData.endurance / classData.count).toFixed(2),
      (classData.shuttle / classData.count).toFixed(2),
      (classData.sprint50 / classData.count).toFixed(2),
      (classData.jump / classData.count).toFixed(2),
      (classData.throw / classData.count).toFixed(2)
    ]);
  });
  
  // 書式設定
  const headerRange = summarySheet.getRange(1, 1, 1, 11);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  
  Browser.msgBox('クラス別平均を計算しました！\n「クラス別平均」シートを確認してください。');
}

/**
 * カスタムメニューを追加
 * スプレッドシートを開いた際に自動実行される
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📊 体力テスト')
    .addItem('📈 クラス別平均を計算', 'calculateClassAverages')
    .addItem('🧪 テストデータを挿入', 'testDataInsertion')
    .addToUi();
}
