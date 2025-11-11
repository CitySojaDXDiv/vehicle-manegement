let allVehicles = [];
let currentReservations = [];

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    // 今日の日付をデフォルトに設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('selectedDate').value = today;
    document.getElementById('reservationDate').value = today;
    
    // 車両データ取得
    await loadVehicles();
    
    // フォーム送信イベント
    document.getElementById('reservationForm').addEventListener('submit', handleFormSubmit);
    
    // 時刻変更時に利用可能車両を更新
    document.getElementById('reservationDate').addEventListener('change', updateAvailableVehicles);
    document.getElementById('startTime').addEventListener('change', updateAvailableVehicles);
    document.getElementById('endTime').addEventListener('change', updateAvailableVehicles);
});

// 車両データ読み込み
async function loadVehicles() {
    showLoading();
    
    try {
        const result = await apiGet('getVehicles');
        if (result.success) {
            allVehicles = result.data;
        }
    } catch (error) {
        console.error('Vehicle load error:', error);
        showAlert('車両データの読み込みに失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// 予約検索
async function searchReservations() {
    const selectedDate = document.getElementById('selectedDate').value;
    const vehicleTypeFilter = document.getElementById('vehicleTypeFilter').value;
    
    if (!selectedDate) {
        showAlert('日付を選択してください', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const formattedDate = normalizeDate(selectedDate);
        const result = await apiGet('getReservations', { date: formattedDate });
        
        if (result.success) {
            currentReservations = result.data;
            
            // 車両種別でフィルタ
            let filteredReservations = currentReservations;
            if (vehicleTypeFilter) {
                filteredReservations = currentReservations.filter(res => {
                    const vehicle = allVehicles.find(v => v.id === res.vehicleId);
                    return vehicle && vehicle.type === vehicleTypeFilter;
                });
            }
            
            displayReservations(filteredReservations);
        } else {
            showAlert('予約の取得に失敗しました', 'danger');
        }
    } catch (error) {
        console.error('Reservation search error:', error);
        showAlert('予約の検索に失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// 予約一覧表示
function displayReservations(reservations) {
    const listDiv = document.getElementById('reservationsList');
    
    if (reservations.length === 0) {
        listDiv.innerHTML = '<p class="text-muted text-center">予約がありません</p>';
        return;
    }
    
    listDiv.innerHTML = reservations.map(res => {
        const vehicle = allVehicles.find(v => v.id === res.vehicleId);
        if (!vehicle) {
            console.warn('車両が見つかりません:', res.vehicleId);
            return '';
        }
        
        const statusColor = getReservationStatusColor(res.status);
        const vehicleColor = getVehicleTypeColor(vehicle.type);
        const startTime = normalizeTime(res.startTime);
        const endTime = normalizeTime(res.endTime);
        
        return `
            <div class="card mb-2">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">
                                <span class="badge" style="background-color: ${vehicleColor}">
                                    ${vehicle.number} (${vehicle.type})
                                </span>
                                <span class="badge" style="background-color: ${statusColor}">
                                    ${res.status}
                                </span>
                            </h6>
                            <p class="mb-1">
                                <i class="fas fa-clock text-muted"></i> ${startTime} - ${endTime}
                            </p>
                            <p class="mb-1">
                                <i class="fas fa-user text-muted"></i> ${res.userName} (${res.department})
                            </p>
                            <p class="mb-1">
                                <i class="fas fa-map-marker-alt text-muted"></i> ${res.destination}
                            </p>
                            <p class="mb-0 text-muted small">${res.purpose}</p>
                        </div>
                        <div>
                            ${res.status === '予約中' ? `
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteReservation(${res.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 利用可能車両の更新
async function updateAvailableVehicles() {
    const date = document.getElementById('reservationDate').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    if (!date || !startTime || !endTime) {
        return;
    }
    
    if (startTime >= endTime) {
        showAlert('終了時刻は開始時刻より後に設定してください', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const formattedDate = normalizeDate(date);
        
        const result = await apiGet('getAvailableVehicles', {
            date: formattedDate,
            startTime: startTime,
            endTime: endTime
        });
        
        if (result.success) {
            const select = document.getElementById('vehicleSelect');
            select.innerHTML = '<option value="">選択してください</option>';
            
            result.data.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.number} (${vehicle.type}) - 定員${vehicle.capacity}名`;
                if (vehicle.notes) {
                    option.textContent += ` ※${vehicle.notes}`;
                }
                select.appendChild(option);
            });
            
            if (result.data.length === 0) {
                showAlert('指定時間に利用可能な車両がありません', 'warning');
            }
        }
    } catch (error) {
        console.error('Available vehicles error:', error);
        showAlert('利用可能車両の取得に失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// 予約重複チェック
async function checkReservationConflict(vehicleId, date, startTime, endTime) {
    try {
        const formattedDate = normalizeDate(date);
        const result = await apiGet('getReservations', { date: formattedDate });
        
        if (!result.success) return false;
        
        const conflicts = result.data.filter(res => {
            if (res.vehicleId !== vehicleId) return false;
            if (res.status === 'キャンセル') return false;
            
            // 時間重複チェック
            return !(endTime <= res.startTime || startTime >= res.endTime);
        });
        
        return conflicts.length > 0;
    } catch (error) {
        console.error('Conflict check error:', error);
        return false;
    }
}

// フォーム送信処理
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        vehicleId: parseInt(document.getElementById('vehicleSelect').value),
        date: normalizeDate(document.getElementById('reservationDate').value),
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        userName: document.getElementById('userName').value,
        department: document.getElementById('department').value,
        destination: document.getElementById('destination').value,
        purpose: document.getElementById('purpose').value,
        passengers: parseInt(document.getElementById('passengers').value)
    };
    
    // 時刻の妥当性チェック
    if (formData.startTime >= formData.endTime) {
        showAlert('終了時刻は開始時刻より後に設定してください', 'danger');
        return;
    }
    
    // 定員チェック
    const selectedVehicle = allVehicles.find(v => v.id === formData.vehicleId);
    if (!selectedVehicle) {
        showAlert('車両が選択されていません', 'danger');
        return;
    }
    
    if (formData.passengers > selectedVehicle.capacity) {
        showAlert(`乗車人員が定員（${selectedVehicle.capacity}名）を超えています`, 'danger');
        return;
    }
    
    // サーバー側で重複チェック
    const hasConflict = await checkReservationConflict(
        formData.vehicleId, 
        formData.date, 
        formData.startTime, 
        formData.endTime
    );
    
    if (hasConflict) {
        showAlert('選択した車両・時間帯は既に予約されています', 'danger');
        return;
    }
    
    showLoading();
    
    try {
        const result = await apiPost('createReservation', formData);
        
        if (result.success) {
            showAlert('予約を登録しました', 'success');
            resetForm();
            
            // 予約一覧を自動更新
            document.getElementById('selectedDate').value = formData.date.replace(/\//g, '-');
            await searchReservations();
        } else {
            showAlert(result.error || '予約の登録に失敗しました', 'danger');
        }
    } catch (error) {
        console.error('Reservation create error:', error);
        showAlert('予約の登録に失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// 新規予約フォーム表示
function showNewReservationForm() {
    resetForm();
    document.getElementById('formTitle').textContent = '新規予約';
    
    // フォームエリアまでスクロール（スマホ対応）
    document.getElementById('reservationForm').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// フォームリセット
function resetForm() {
    document.getElementById('reservationForm').reset();
    document.getElementById('reservationId').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reservationDate').value = today;
    document.getElementById('vehicleSelect').innerHTML = '<option value="">選択してください</option>';
}

// 予約編集（簡易版）
function editReservation(id) {
    showAlert('編集機能は開発中です', 'info');
}

// 予約削除
async function deleteReservation(id) {
    if (!confirm('この予約を削除してもよろしいですか？')) {
        return;
    }
    
    showLoading();
    
    try {
        const result = await apiPost('deleteReservation', { id: id });
        
        if (result.success) {
            showAlert('予約を削除しました', 'success');
            await searchReservations();
        } else {
            showAlert('予約の削除に失敗しました', 'danger');
        }
    } catch (error) {
        console.error('Reservation delete error:', error);
        showAlert('予約の削除に失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}