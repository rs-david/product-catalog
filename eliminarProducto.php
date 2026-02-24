<?php
require 'config.php';
header('Content-Type: application/json');

// Leer el ID enviado por JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);
$id = $data['id'] ?? null;

if (!$id) {
    echo json_encode(['status' => 'error', 'mensaje' => 'ID no válido']);
    exit;
}

try {
    // Preparamos la sentencia DELETE
    $sql = "DELETE FROM productos WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);

    // Verificamos si se borró algún registro
    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'mensaje' => 'Eliminado']);
    } else {
        echo json_encode(['status' => 'error', 'mensaje' => 'El producto no existe o ya fue eliminado']);
    }

} catch (PDOException $e) {
    // Si el producto está relacionado con otra tabla (ej. ventas), 
    // Postgres lanzará un error de "Foreign Key Constraint"
    if ($e->getCode() == 23503) {
        echo json_encode(['status' => 'error', 'mensaje' => 'No se puede eliminar porque tiene ventas asociadas']);
    } else {
        echo json_encode(['status' => 'error', 'mensaje' => $e->getMessage()]);
    }
}