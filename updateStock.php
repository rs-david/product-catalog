<?php
require 'config.php';
header('Content-Type: application/json');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$id = $data['id'] ?? null;
$cambio = $data['cambio'] ?? null;

if (!$id || !isset($cambio)) {
    echo json_encode(['status' => 'error', 'mensaje' => 'Datos insuficientes']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Actualización atómica con cláusula RETURNING para obtener el valor final de inmediato
    $sql = "UPDATE productos 
            SET stock = stock + :cambio 
            WHERE id = :id 
            RETURNING stock";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $id,
        ':cambio' => $cambio
    ]);

    $nuevoStock = $stmt->fetchColumn();

    // Validar que el stock no sea negativo
    if ($nuevoStock < 0) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'mensaje' => 'Stock insuficiente para esta operación']);
        exit;
    }

    $pdo->commit();
    echo json_encode([
        'status' => 'success', 
        'nuevo_stock' => $nuevoStock
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['status' => 'error', 'mensaje' => $e->getMessage()]);
}
