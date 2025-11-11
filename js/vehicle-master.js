// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    await loadVehicles();
});

// 車両一覧読み込み
async function loadVehicles() {
    showLoading();
    
    try {
        const result = await apiGet('getVehicles');
        
        if (result.success) {
            displayVehicles(result.data);
        }
    } catch (error) {
        console.error('Vehicle load error:', error);
        showAlert('車両データの読み込みに失敗しました', 'danger');
    } finally {
        hideLoading();
    }
}

// 車両一覧表示
function displayVehicles(vehicles) {
    const tbody = document.getElementById('vehicleTableBody');
    
    if (vehicles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">車両データがありません</td></tr>';
        return;
    }
    
    tbody.innerHTML = vehicles.map(vehicle => {
        const vehicleColor = getVehicleTypeColor(vehicle.type);
        const statusBadge = vehicle.status === '使用可' 
            ? '<span class="badge bg-success">使用可</span>' 
            : '<span class="badge bg-secondary">整備中</span>';
        
        // 期限チェック
        const today = new Date();
        const inspectionDate = new Date(vehicle.inspectionDate);
        const maintenanceDate = new Date(vehicle.maintenanceDate);
        const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        let inspectionAlert = '';
        if (inspectionDate <= thirtyDaysLater) {
            inspectionAlert = ' <i class="fas fa-exclamation-triangle text-warning"></i>';
        }
        
        let maintenanceAlert = '';
        if (maintenanceDate <= thirtyDaysLater) {
            maintenanceAlert = ' <i class="fas fa-exclamation-triangle text-warning"></i>';
        }
        
        return `
            <tr>
                <td>${vehicle.id}</td>
                <td>
                    <span class="badge" style="background-color: ${vehicleColor}">
                        ${vehicle.number}
                    </span>
                </td>
                <td>${vehicle.type}</td>
                <td>${vehicle.capacity}名</td>
                <td>${vehicle.notes || '-'}</td>
                <td>${formatDate(vehicle.inspectionDate)}${inspectionAlert}</td>
                <td>${formatDate(vehicle.maintenanceDate)}${maintenanceAlert}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}