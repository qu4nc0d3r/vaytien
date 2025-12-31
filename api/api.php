<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Đường dẫn đến file data (từ thư mục api)
$dataFile = __DIR__ . '/../data/data.json';

// Xử lý request
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Đọc dữ liệu từ file
    if (file_exists($dataFile)) {
        $content = file_get_contents($dataFile);
        echo $content;
    } else {
        echo json_encode([]);
    }
} 
elseif ($method === 'POST') {
    // Lưu dữ liệu vào file
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if ($data !== null) {
        // Lưu vào file với format đẹp
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        file_put_contents($dataFile, $json);
        
        echo json_encode([
            'success' => true,
            'message' => 'Đã lưu dữ liệu thành công!'
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Dữ liệu không hợp lệ!'
        ]);
    }
}
else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
?>
