// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboard();
});

// ダッシュボードデータ読み込み
async function loadDashboard() {
    showLoading();
    
    try {
        // 各種データ取得
        const [vehicles, reservations] = await Promise.all([
            apiGet('getVehicles'),
            apiGet('getReservations')
        ]);
        
        if (vehicles.success && reservations.success) {
            updateSummaryCards(vehicles.data, reservations.data);
            updateTodayReservations(reservations.data, vehicles.data);
            createCharts(vehicles.data, reservations.data);
            checkMaintenanceAlerts(vehicles.data);
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        showAlert('ダッシュボードの読み込みに失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// サマリーカード更新
function updateSummaryCards(vehicles, reservations) {
    // 総車両数
    document.getElementById('totalVehicles').textContent = vehicles.length;
    
    // 本日の予約
    const today = formatDate(new Date());
    const todayReservations = reservations.filter(r => 
        formatDate(r.date) === today && r.status !== 'キャンセル'
    );
    document.getElementById('todayReservations').textContent = todayReservations.length;
    
    // 今月の走行距離（ダミーデータ）
    document.getElementById('monthlyDistance').textContent = '1,234';
    
    // 平均燃費（ダミーデータ）
    document.getElementById('avgFuelEfficiency').textContent = '12.5';
}

// 本日の予約一覧
function updateTodayReservations(reservations, vehicles) {
    const today = formatDate(new Date());
    const todayReservations = reservations.filter(r => 
        formatDate(r.date) === today && r.status !== 'キャンセル'
    );
    
    const tbody = document.getElementById('todayReservationsTable');
    
    if (todayReservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">本日の予約はありません</td></tr>';
        return;
    }
    
    tbody.innerHTML = todayReservations.map(res => {
        const vehicle = vehicles.find(v => v.id === res.vehicleId);
        return `
            <tr>
                <td><span class="badge" style="background-color: ${getVehicleTypeColor(vehicle.type)}">${vehicle.number}</span></td>
                <td>${res.startTime} - ${res.endTime}</td>
                <td>${res.userName}</td>
                <td>${res.destination}</td>
            </tr>
        `;
    }).join('');
}

// グラフ作成
function createCharts(vehicles, reservations) {
    // 車両稼働率グラフ
    const utilizationCtx = document.getElementById('vehicleUtilizationChart').getContext('2d');
    new Chart(utilizationCtx, {
        type: 'bar',
        data: {
            labels: vehicles.map(v => v.number),
            datasets: [{
                label: '稼働率 (%)',
                data: [75, 60, 45], // ダミーデータ
                backgroundColor: vehicles.map(v => getVehicleTypeColor(v.type)),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // 走行距離推移グラフ
    const distanceCtx = document.getElementById('distanceChart').getContext('2d');
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    new Chart(distanceCtx, {
        type: 'line',
        data: {
            labels: last7Days,
            datasets: [{
                label: '走行距離 (km)',
                data: [120, 150, 80, 200, 95, 180, 140], // ダミーデータ
                borderColor: '#3498DB',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// 車検・点検アラート
function checkMaintenanceAlerts(vehicles) {
    const alertsDiv = document.getElementById('maintenanceAlerts');
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const alerts = [];
    
    vehicles.forEach(vehicle => {
        // 車検期限チェック
        const inspectionDate = new Date(vehicle.inspectionDate);
        if (inspectionDate <= thirtyDaysLater) {
            const daysLeft = Math.ceil((inspectionDate - today) / (1000 * 60 * 60 * 24));
            alerts.push({
                type: '車検',
                vehicle: vehicle.number,
                date: formatDate(inspectionDate),
                daysLeft: daysLeft
            });
        }
        
        // 点検期限チェック
        const maintenanceDate = new Date(vehicle.maintenanceDate);
        if (maintenanceDate <= thirtyDaysLater) {
            const daysLeft = Math.ceil((maintenanceDate - today) / (1000 * 60 * 60 * 24));
            alerts.push({
                type: '点検',
                vehicle: vehicle.number,
                date: formatDate(maintenanceDate),
                daysLeft: daysLeft
            });
        }
    });
    
    if (alerts.length === 0) {
        alertsDiv.innerHTML = '<p class="text-success mb-0"><i class="fas fa-check-circle"></i> 現在、期限が近い車検・点検はありません</p>';
        return;
    }
    
    alertsDiv.innerHTML = alerts.map(alert => {
        const urgencyClass = alert.daysLeft <= 7 ? 'danger' : 'warning';
        return `
            <div class="alert alert-${urgencyClass} mb-2">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>車両 ${alert.vehicle}</strong> の${alert.type}期限が<strong>${alert.daysLeft}日後</strong>（${alert.date}）に迫っています
            </div>
        `;
    }).join('');
}