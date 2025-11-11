// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboard();
});

// ダッシュボードデータ読み込み
async function loadDashboard() {
    showLoading();
    
    try {
        const [vehicles, reservations, drivingRecords] = await Promise.all([
            apiGet('getVehicles'),
            apiGet('getReservations'),
            apiGet('getDrivingRecords')
        ]);
        
        if (vehicles.success && reservations.success) {
            updateSummaryCards(vehicles.data, reservations.data);
            updateTodayReservations(reservations.data, vehicles.data);
            createCharts(vehicles.data, reservations.data);
            checkMaintenanceAlerts(vehicles.data);
            
            // 運行記録表示
            if (drivingRecords.success) {
                updateRecentDrivingRecords(drivingRecords.data, vehicles.data);
            }
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
    const today = normalizeDate(new Date());
    const todayReservations = reservations.filter(r => {
        const resDate = normalizeDate(r.date);
        return resDate === today && r.status !== 'キャンセル';
    });
    document.getElementById('todayReservations').textContent = todayReservations.length;
    
    // 今月の走行距離（ダミーデータ）
    document.getElementById('monthlyDistance').textContent = '1,234';
    
    // 平均燃費（ダミーデータ）
    document.getElementById('avgFuelEfficiency').textContent = '12.5';
}

// 本日の予約一覧
function updateTodayReservations(reservations, vehicles) {
    const today = normalizeDate(new Date());
    
    console.log('今日の日付:', today);
    console.log('全予約データ:', reservations); // 全データを確認
    
    // 各予約の日付を詳しく確認
    reservations.forEach((r, index) => {
        console.log(`予約${index + 1}:`, {
            originalDate: r.date,
            dateType: typeof r.date,
            normalizedDate: normalizeDate(r.date),
            status: r.status
        });
    });
    
    const todayReservations = reservations.filter(r => {
        const resDate = normalizeDate(r.date);
        console.log('予約日付:', resDate, '一致:', resDate === today);
        return resDate === today && r.status !== 'キャンセル';
    });
    
    console.log('本日の予約数:', todayReservations.length);
    
    const tbody = document.getElementById('todayReservationsTable');
    
    if (todayReservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">本日の予約はありません</td></tr>';
        return;
    }
    
    tbody.innerHTML = todayReservations.map(res => {
        const vehicle = vehicles.find(v => v.id === res.vehicleId);
        if (!vehicle) return '';
        
        const startTime = normalizeTime(res.startTime);
        const endTime = normalizeTime(res.endTime);
        
        return `
            <tr>
                <td><span class="badge" style="background-color: ${getVehicleTypeColor(vehicle.type)}">${vehicle.number}</span></td>
                <td>${startTime} - ${endTime}</td>
                <td>${res.userName}</td>
                <td>${res.destination}</td>
            </tr>
        `;
    }).join('');
}

// 直近の運行記録表示
function updateRecentDrivingRecords(records, vehicles) {
    const tbody = document.getElementById('recentDrivingRecordsTable');
    
    if (!records || records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">運行記録がありません</td></tr>';
        return;
    }
    
    // 最新5件を表示
    const recentRecords = records.slice(-5).reverse();
    
    tbody.innerHTML = recentRecords.map(record => {
        const vehicle = vehicles.find(v => v.id === record.vehicleId);
        if (!vehicle) return '';
        
        return `
            <tr>
                <td>${normalizeDate(record.date)}</td>
                <td><span class="badge" style="background-color: ${getVehicleTypeColor(vehicle.type)}">${vehicle.number}</span></td>
                <td>${record.distance || 0} km</td>
                <td>${record.driverName}</td>
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
        if (vehicle.inspectionDate) {
            const inspectionDate = new Date(vehicle.inspectionDate);
            if (!isNaN(inspectionDate.getTime()) && inspectionDate <= thirtyDaysLater && inspectionDate >= today) {
                const daysLeft = Math.ceil((inspectionDate - today) / (1000 * 60 * 60 * 24));
                alerts.push({
                    type: '車検',
                    vehicle: vehicle.number,
                    date: normalizeDate(vehicle.inspectionDate),
                    daysLeft: daysLeft
                });
            }
        }
        
        // 点検期限チェック
        if (vehicle.maintenanceDate) {
            const maintenanceDate = new Date(vehicle.maintenanceDate);
            if (!isNaN(maintenanceDate.getTime()) && maintenanceDate <= thirtyDaysLater && maintenanceDate >= today) {
                const daysLeft = Math.ceil((maintenanceDate - today) / (1000 * 60 * 60 * 24));
                alerts.push({
                    type: '点検',
                    vehicle: vehicle.number,
                    date: normalizeDate(vehicle.maintenanceDate),
                    daysLeft: daysLeft
                });
            }
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