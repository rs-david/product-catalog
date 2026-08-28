<?php
require 'config.php';
require 'generarPrefijoDeModelo.php';
header('Content-Type: application/json');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validación básica
if (!isset($data['id'])) {
    echo json_encode(['status' => 'error', 'mensaje' => 'ID no proporcionado']);
    exit;
}

try {
    // 1. Preparar el array de etiquetas para Postgres text[]
    $etiquetasPostgres = '{' . implode(',', array_map('trim', $data['etiquetas'])) . '}';

    $prefijo = generarPrefijoDeModelo($data['categoria']);

    // 2. Sentencia SQL
    $sql = "UPDATE productos SET 
                nombre = :nombre,
                descripcion = :descripcion,
                categoria = :categoria,
                prefijo = :prefijo,
                costo = :costo,
                precio = :precio,
                stock = :stock,
                etiquetas = :etiquetas,
                url = :url
            WHERE id = :id";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        ':id'          => $data['id'],
        ':nombre'      => $data['nombre'],
        ':descripcion' => $data['descripcion'],
        ':categoria'   => $data['categoria'],
        ':prefijo'     => $prefijo,
        ':costo'       => $data['costo'],
        ':precio'      => $data['precio'],
        ':stock'       => $data['stock'],
        ':etiquetas'   => $etiquetasPostgres,
        ':url'         => $data['url'] ?? null,
    ]);

    // Verificar si se actualizó algún registro
    if ($stmt->rowCount() > 0) {
        echo json_encode(['status' => 'success', 'mensaje' => 'Producto actualizado']);
    } else {
        echo json_encode(['status' => 'info', 'mensaje' => 'No hubo cambios o el ID no existe']);
    }

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'mensaje' => $e->getMessage()]);
}