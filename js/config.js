// Google Apps Script Web App URL
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwJEi9d5NcQKvzvDuze_staIZ8TafabhQCl593IWghU8y7SWcLUwqcM_BCre74zXNk/exec';

// スプレッドシートID
const SPREADSHEET_ID = '1iy_tbzG8W-Som6DL1E8OXm4ZFop6jbU9jTGSefgcQq0';

// 車両種別
const VEHICLE_TYPES = ['普通車', '軽自動車', '2t超トラック', 'バス'];

// 天気
const WEATHER_OPTIONS = ['晴', '曇', '雨'];

// 車両状況
const VEHICLE_CONDITIONS = ['良', '不良'];

// 確認者区分
const CHECKER_TYPES = ['安全運転管理者', '副安全運転管理者', '運行管理者', '上記以外'];

// 確認方法
const CHECK_METHODS = ['対面', '電話等'];

// 酒気帯びの有無
const ALCOHOL_PRESENCE = ['有', '無'];

// 燃料残量レベル（8段階）
const FUEL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];