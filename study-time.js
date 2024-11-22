// ページ読み込み時に記録と目標を読み込む
document.addEventListener("DOMContentLoaded", () => {
  loadRecords(); // 学習記録を表示
  loadGoal(); // 目標を表示
  updateProgress(); // 進捗表示
  displayWeeklyAverageChart(); // グラフを表示
});

// 学習記録フォームの送信イベント
learningForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = document.getElementById("date").value;
  const subject = document.getElementById("subject").value;
  const hours = parseFloat(document.getElementById("hours").value);

  if (date && subject && hours) {
    const record = { date, subject, hours };

    saveRecord(record); // ローカルストレージに保存
    displayRecord(record); // 画面に表示
    updateProgress(); // 進捗の更新
    displayWeeklyAverageChart(); // グラフ更新
    learningForm.reset(); // フォームをリセット
  } else {
    alert("日付、学習内容、学習時間をすべて入力してください。");
  }
});

// 目標設定フォームの送信イベント
goalForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const goal = document.getElementById("goal").value;
  const goalHours = parseFloat(document.getElementById("goalHours").value);

  if (goal && goalHours) {
    const goalData = { goal, goalHours };
    localStorage.setItem("goal", JSON.stringify(goalData)); // ローカルストレージに目標を保存

    updateProgress(); // 進捗を更新
    goalForm.reset(); // フォームをリセット
  } else {
    alert("目標と目標学習時間を入力してください。");
  }
});

// ローカルストレージから目標を読み込み、表示
function loadGoal() {
  const goalData = JSON.parse(localStorage.getItem("goal"));
  if (goalData) {
    // 目標を画面に表示
    const goalText = document.getElementById("goalText");
    goalText.textContent = `目標: ${goalData.goal} | 目標時間: ${goalData.goalHours} 時間`;
    updateProgress(); // 読み込んだ目標に基づいて進捗を更新
  }
}

// ローカルストレージに学習記録を保存
function saveRecord(record) {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  records.push(record);
  localStorage.setItem("records", JSON.stringify(records));
}

// ローカルストレージから学習記録を読み込んで表示
function loadRecords() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  recordsContainer.innerHTML = ''; // 既存の記録をクリア
  records.forEach(displayRecord); // 記録を画面に表示
  displayWeeklyAverageChart(); // グラフを表示
}

// 学習記録を画面に表示
function displayRecord(record, index) {
  const recordDiv = document.createElement("div");
  recordDiv.classList.add("record");
  recordDiv.innerHTML = `
    <strong>日付:</strong> ${record.date} <br>
    <strong>学習内容:</strong> ${record.subject} <br>
    <strong>学習時間:</strong> ${record.hours} 時間
    <button class="delete-btn" data-id="${index}">削除</button>
  `;
  recordsContainer.appendChild(recordDiv);

  // 削除ボタンのイベントリスナー
  recordDiv.querySelector(".delete-btn").addEventListener("click", function() {
    deleteRecord(index); // indexを使って正しいレコードを削除
  });
}

// 学習記録を削除
function deleteRecord(index) {
  let records = JSON.parse(localStorage.getItem("records")) || [];
  records.splice(index, 1); // 配列から削除
  localStorage.setItem("records", JSON.stringify(records)); // ローカルストレージに更新
  loadRecords(); // 記録を再読み込みして表示を更新
  updateProgress(); // 進捗更新
  displayWeeklyAverageChart(); // グラフ更新
}

// 進捗の計算と表示
function updateProgress() {
  const goalData = JSON.parse(localStorage.getItem("goal"));
  const records = JSON.parse(localStorage.getItem("records")) || [];

  if (!goalData) {
    progressText.textContent = "目標設定を行ってください。";
    progressBar.style.width = "0%";
    return;
  }

  // 今週の学習時間を計算
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  firstDayOfWeek.setDate(today.getDate() - today.getDay());
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

  const currentWeekRecords = records.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= firstDayOfWeek && recordDate <= lastDayOfWeek;
  });

  const totalHours = currentWeekRecords.reduce((sum, record) => sum + record.hours, 0);
  const goalHours = goalData.goalHours;

  const progressPercent = Math.min((totalHours / goalHours) * 100, 100).toFixed(2);

  progressText.textContent = `今週の学習時間: ${totalHours} 時間 / 目標: ${goalHours} 時間 (${progressPercent}%)`;
  progressBar.style.width = `${progressPercent}%`;
}

// 週ごとの平均学習時間をグラフ表示
function displayWeeklyAverageChart() {
  const records = JSON.parse(localStorage.getItem("records")) || [];
  const weeklyHours = groupRecordsByWeek(records.sort((a, b) => new Date(a.date) - new Date(b.date))); // 日付順に並べる

  // 既存のグラフがある場合は削除して再描画
  if (window.myChart) window.myChart.destroy();

  const labels = Object.keys(weeklyHours);
  const data = Object.values(weeklyHours);

  window.myChart = new Chart(weeklyAverageChart, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '週別学習時間 (時間)',
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true
      }]
    },
    options: {
      scales: {
        x: {
          title: { display: true, text: '週' }
        },
        y: {
          title: { display: true, text: '合計学習時間 (時間)' }
        }
      }
    }
  });
}

// 学習記録を週ごとにグループ化
function groupRecordsByWeek(records) {
  const weeks = {};

  records.forEach(record => {
    const date = new Date(record.date);
    const firstDayOfWeek = new Date(date);
    firstDayOfWeek.setDate(date.getDate() - date.getDay()); // その週の最初の日曜日
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // その週の土曜日

    // "YYYY-MM-DD ~ YYYY-MM-DD" の形式で日付範囲を表示
    const weekRange = `${firstDayOfWeek.getFullYear()}-${('0' + (firstDayOfWeek.getMonth() + 1)).slice(-2)}-${('0' + firstDayOfWeek.getDate()).slice(-2)} ~ ${lastDayOfWeek.getFullYear()}-${('0' + (lastDayOfWeek.getMonth() + 1)).slice(-2)}-${('0' + lastDayOfWeek.getDate()).slice(-2)}`;

    if (!weeks[weekRange]) {
      weeks[weekRange] = 0;
    }
    weeks[weekRange] += record.hours;
  });

  return weeks;
}
