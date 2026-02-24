<?php
header('Content-Type: application/json');
require 'config.php';
require 'pgArrayToPhp.php';

try {
    $stmt = $pdo->query("SELECT
                            id, nombre, modelo, descripcion, categoria, costo, precio, stock, url, etiquetas
                        FROM
                            productos
                        ORDER BY created_at DESC
    ");
    $productos = $stmt->fetchAll();

    foreach ($productos as &$producto) {
        $producto['etiquetas'] = pgArrayToPhp($producto['etiquetas']);
    }

    echo json_encode($productos);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
