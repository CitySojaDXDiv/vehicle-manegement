// API呼び出し（GET）
async function apiGet(action, params = {}) {
    try {
        const url = new URL(GAS_API_URL);
        url.searchParams.append('action', action);
        
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        
        const response = await fetch(url);
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showAlert('エラーが発生しました', 'danger');
        return { success: false, error: error.message };
    }
}

// API呼び出し（POST）
async function apiPost(action, data) {
    try {
        const url = `${GAS_API_URL}?action=${action}`;
        
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showAlert('エラーが発生しました', 'danger');
        return { success: false, error: error.message };
    }
}

// アラート表示
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// ローディング表示
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
    loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingDiv.style.zIndex = '9999';
    loadingDiv.innerHTML = `
        <div class="spinner-border text-light" role="status">
            <span class="visually-hidden">読み込み中...</span>
        </div>
    `;
    
    document.body.appendChild(loadingDiv);
}

// ローディング非表示
function hideLoading() {
    const loadingDiv = document.getElementById('loading-overlay');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// 日付フォーマット（YYYY/MM/DD）
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// 時刻フォーマット（HH:MM）
function formatTime(time) {
    if (typeof time === 'string') return time;
    const d = new Date(time);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// 曜日取得
function getDayOfWeek(date) {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(date);
    return days[d.getDay()];
}

// 車両種別の色
function getVehicleTypeColor(type) {
    const colors = {
        '普通車': '#3498DB',
        '軽自動車': '#27AE60',
        '2t超トラック': '#E67E22',
        'バス': '#9B59B6'
    };
    return colors[type] || '#95A5A6';
}

// 予約状態の色
function getReservationStatusColor(status) {
    const colors = {
        '予約中': '#3498DB',
        '使用中': '#F39C12',
        '完了': '#27AE60',
        'キャンセル': '#95A5A6'
    };
    return colors[status] || '#95A5A6';
}