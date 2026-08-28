<?php

require_once 'config.php';
require_once 'generarPrefijoDeModelo.php';

// Recibir el JSON del frontend
$json = file_get_contents('php://input');
$datos = json_decode($json, true);

if ($datos) {
    try {
        $pdo->beginTransaction(); // Iniciamos transacción para evitar duplicados

        $prefijo = generarPrefijoDeModelo($datos['categoria']);

        $sql = "INSERT INTO productos (nombre, prefijo, descripcion, categoria, costo, precio, stock, etiquetas, url) 
            VALUES (:nombre, :prefijo, :descripcion, :categoria, :costo, :precio, :stock, :etiquetas, :url)";

        $stmt = $pdo->prepare($sql);
        $etiquetas = '{' . implode(',', $datos['etiquetas']) . '}';
        $stmt->execute([
            ':nombre' => $datos['nombre'],
            ':prefijo' => $prefijo,
            ':descripcion' => $datos['descripcion'],
            ':categoria' => $datos['categoria'],
            ':costo' => $datos['costo'],
            ':precio' => $datos['precio'],
            ':stock' => $datos['stock'],
            ':etiquetas' => $etiquetas,
            ':url' => $datos['url'],
        ]);

        $pdo->commit(); // Confirmamos los cambios
        echo json_encode(['status' => 'success', 'mensaje' => 'Producto guardado correctamente']);
    } catch (PDOException $e) {
        // Manejo específico para error de duplicado (Código 23505 en Postgres)
        $pdo->rollBack(); // Si algo falla, deshacemos todo
        if ($e->getCode() == 23505) {
            echo json_encode(['status' => 'error', 'mensaje' => 'El modelo ya existe en la base de datos']);
        } else {
            echo json_encode(['status' => 'error', 'mensaje' => 'Error: ' . $e->getMessage()]);
        }
    }
}
