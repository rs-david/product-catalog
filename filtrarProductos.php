<?php
require 'config.php';
require 'pgArrayToPhp.php';

// Recogemos los datos de la URL (GET)
$nombre    = $_GET['nombre'] ?? '';
$categoria = $_GET['categoria'] ?? '';
$modelo    = $_GET['modelo'] ?? '';
$etiquetas  = $_GET['etiquetas'] ?? '';
$sortBy   = $_GET['sortBy'] ?? 'created_at';
$sortDir  = $_GET['sortDir'] ?? 'DESC';
$limit  = $_GET['limit'] ?? 8;

$where = [];
$params = [];

// Filtro por Nombre (Búsqueda parcial con LIKE)
if (!empty($nombre)) {
    $where[] = "nombre ILIKE :nombre"; // ILIKE es case-insensitive en Postgres
    $params[':nombre'] = '%' . $nombre . '%';
}

// Filtro por Categoría (Exacto)
if (!empty($categoria)) {
    $where[] = "categoria = :categoria";
    $params[':categoria'] = $categoria;
}

// Filtro por Modelo (Búsqueda parcial)
if (!empty($modelo)) {
    $where[] = "modelo ILIKE :modelo";
    $params[':modelo'] = '%' . $modelo . '%';
}

if (!empty($etiquetas)) {
    // 1. Convertimos el string a un array de PHP
    $tagsArray = explode(',', $etiquetas);
    
    // 2. Formateamos para Postgres: {"joyeria","lujo"}
    // Usamos comillas dobles para cada elemento para evitar errores con espacios
    $formatoPostgres = '{' . implode(',', array_map(fn($tag) => '"'.$tag.'"', $tagsArray)) . '}';
    
    // 3. Operador @> significa: "¿El array de la DB contiene TODOS estos elementos?"
    $where[] = "etiquetas @> :etiquetas::text[]";
    $params[':etiquetas'] = $formatoPostgres;
}

// Construcción final de la consulta
$sql = "SELECT * FROM productos";

if (count($where) > 0) {
    $sql .= " WHERE " . implode(" AND ", $where);
}

$sql .= " ORDER BY $sortBy $sortDir LIMIT :limit";

try {
    $stmt = $pdo->prepare($sql);
    $params[':limit'] = (int)$limit;
    $stmt->execute($params);
    $resultados = $stmt->fetchAll();

    foreach ($resultados as &$producto) {
        $producto['etiquetas'] = pgArrayToPhp($producto['etiquetas']);
    }

    echo json_encode($resultados);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
