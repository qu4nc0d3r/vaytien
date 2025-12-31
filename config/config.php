<?php
/**
 * File cấu hình
 * Có thể mở rộng thêm các cấu hình khác ở đây
 */

// Đường dẫn đến file data
define('DATA_FILE', __DIR__ . '/../data/data.json');

// Cấu hình timezone
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Cấu hình encoding
mb_internal_encoding('UTF-8');
?>
