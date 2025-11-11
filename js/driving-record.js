let allVehicles = [];
let departureData = {};

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    // 今日の日付をデフォルトに設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('depDate').value = today;
    
    // 現在時刻をデフォルトに設定
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('depTime').value = currentTime;
    document.getElementById('arrTime').value = currentTime;
    
    // 車両データ取得
    await loadVehicles();
    
    // フォーム送信イベント
    document.getElementById('departureForm').addEventListener('submit', handleDepartureSubmit);
    document.getElementById('arrivalForm').addEventListener('submit', handleArrivalSubmit);
    
    // 燃料残量スライダー
    document.getElementById('arrFuelLevel').addEventListener('input', updateFuelLevelDisplay);
    
    // 終業時メーター入力時に走行距離を自動計算
    document.getElementById('arrEndMeter').addEventListener('input', calculateDistance);
});

// 車両データ読み込み
async function loadVehicles() {
    showLoading();
    
    try {
        const result = await apiGet('getVehicles');
        if (result.success) {
            allVehicles = result.data;
            populateVehicleSelects();
        }
    } catch (error) {
        console.error('Vehicle load error:', error);
        showAlert('車両データの読み込みに失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// 車両セレクトボックスに選択肢を追加
function populateVehicleSelects() {
    const depSelect = document.getElementById('depVehicle');
    const arrSelect = document.getElementById('arrVehicle');
    
    allVehicles.forEach(vehicle => {
        if (vehicle.status === '使用可') {
            const option1 = document.createElement('option');
            option1.value = vehicle.id;
            option1.textContent = `${vehicle.number} (${vehicle.type})`;
            depSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = vehicle.id;
            option2.textContent = `${vehicle.number} (${vehicle.type})`;
            arrSelect.appendChild(option2);
        }
    });
}

// 出発時フォーム送信
async function handleDepartureSubmit(e) {
    e.preventDefault();
    
    // 酒気帯び確認チェック
    const alcoholPresence = document.getElementById('depBeforeAlcoholPresence').value;
    const alcoholValue = parseFloat(document.getElementById('depBeforeAlcoholValue').value);
    
    if (alcoholPresence === '有' || alcoholValue > 0) {
        if (!confirm('酒気帯びが検知されています。本当に出発記録を登録しますか？')) {
            return;
        }
    }
    
    // 出発データを一時保存（帰着時に使用）
    departureData = {
        vehicleId: parseInt(document.getElementById('depVehicle').value),
        date: document.getElementById('depDate').value,
        weather: document.getElementById('depWeather').value,
        vehicleCondition: document.getElementById('depCondition').value,
        startTime: document.getElementById('depTime').value,
        destination: document.getElementById('depDestination').value,
        startMeter: parseInt(document.getElementById('depStartMeter').value),
        purpose: document.getElementById('depPurpose').value,
        passengers: parseInt(document.getElementById('depPassengers').value),
        driverName: document.getElementById('depDriver').value,
        beforeCheckerType: document.getElementById('depBeforeCheckerType').value,
        beforeCheckerName: document.getElementById('depBeforeCheckerName').value,
        beforeCheckMethod: document.getElementById('depBeforeCheckMethod').value,
        beforeAlcoholPresence: alcoholPresence,
        beforeAlcoholValue: alcoholValue
    };
    
    // LocalStorageに保存
    localStorage.setItem('departureData', JSON.stringify(departureData));
    
    showAlert('出発記録を保存しました。帰着時に記録を完成させてください。', 'success');
    
    // フォームをリセット
    document.getElementById('departureForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('depDate').value = today;
}

// 帰着時フォーム送信
async function handleArrivalSubmit(e) {
    e.preventDefault();
    
    // 出発データを取得
    const savedDepartureData = localStorage.getItem('departureData');
    if (!savedDepartureData) {
        showAlert('出発記録が見つかりません。先に出発時入力を行ってください。', 'warning');
        return;
    }
    
    const departure = JSON.parse(savedDepartureData);
    
    // 酒気帯び確認チェック
    const alcoholPresence = document.getElementById('arrAfterAlcoholPresence').value;
    const alcoholValue = parseFloat(document.getElementById('arrAfterAlcoholValue').value);
    
    if (alcoholPresence === '有' || alcoholValue > 0) {
        showAlert('運転後に酒気帯びが検知されています。適切な対応を行ってください。', 'danger');
    }
    
    // 完全な運行記録データを作成
    const fullRecord = {
        ...departure,
        endTime: document.getElementById('arrTime').value,
        endMeter: parseInt(document.getElementById('arrEndMeter').value),
        gasoline: parseFloat(document.getElementById('arrGasoline').value) || 0,
        diesel: parseFloat(document.getElementById('arrDiesel').value) || 0,
        oil: parseFloat(document.getElementById('arrOil').value) || 0,
        noRefuel: document.getElementById('arrNoRefuel').checked,
        fuelLevel: parseInt(document.getElementById('arrFuelLevel').value),
        afterCheckerType: document.getElementById('arrAfterCheckerType').value,
        afterCheckerName: document.getElementById('arrAfterCheckerName').value,
        afterCheckMethod: document.getElementById('arrAfterCheckMethod').value,
        afterAlcoholPresence: alcoholPresence,
        afterAlcoholValue: alcoholValue,
        notes: document.getElementById('arrNotes').value,
        dayOfWeek: getDayOfWeek(departure.date),
        reservationId: null // 予約との紐付けは後で実装
    };
    
    showLoading();
    
    try {
        const result = await apiPost('createDrivingRecord', fullRecord);
        
        if (result.success) {
            showAlert('運行記録を登録しました', 'success');
            
            // LocalStorageをクリア
            localStorage.removeItem('departureData');
            
            // フォームをリセット
            document.getElementById('arrivalForm').reset();
            document.getElementById('arrFuelLevel').value = 4;
            updateFuelLevelDisplay();
        } else {
            showAlert('運行記録の登録に失敗しました', 'danger');
        }
    } catch (error) {
        console.error('Driving record create error:', error);
        showAlert('運行記録の登録に失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// 燃料残量表示更新
function updateFuelLevelDisplay() {
    const level = document.getElementById('arrFuelLevel').value;
    document.getElementById('fuelLevelDisplay').textContent = `${level}/8`;
}

// 走行距離自動計算
function calculateDistance() {
    const savedDepartureData = localStorage.getItem('departureData');
    if (!savedDepartureData) {
        return;
    }
    
    const departure = JSON.parse(savedDepartureData);
    const endMeter = parseInt(document.getElementById('arrEndMeter').value);
    
    if (endMeter && endMeter > departure.startMeter) {
        const distance = endMeter - departure.startMeter;
        document.getElementById('arrDistance').value = distance + ' km';
    } else {
        document.getElementById('arrDistance').value = '';
    }
}