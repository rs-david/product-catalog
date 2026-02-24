<?php

function generarModeloPersonalizado($pdo, $categoria)
{
    // 1. Definir el prefijo según la categoría
    $prefijos = [
        'joyeria' => 'JY',
        'accesorios' => 'AC',
        'juguetes' => 'JG',
        'regalos' => 'RG',
        'ropa' => 'RP'
    ];

    // Si la categoría no está en la lista, usamos un prefijo genérico 'TQ'
    $prefijo = $prefijos[strtolower($categoria)] ?? 'TQ';

    // 2. Buscar el último modelo que empiece con ese prefijo
    // Usamos regex o LIKE para encontrar el valor máximo actual
    $sql = "SELECT modelo FROM productos 
            WHERE modelo LIKE :prefijo 
            ORDER BY modelo DESC LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':prefijo' => $prefijo . '%']);
    $ultimo = $stmt->fetchColumn();

    if (!$ultimo) {
        // Si no hay registros previos, empezamos en 1
        $numero = 1;
    } else {
        // Extraemos la parte numérica (quitando el prefijo)
        // Ejemplo: 'JY00005' -> quitamos 'JY', queda '00005'
        $soloNumero = substr($ultimo, strlen($prefijo));
        $numero = (int) $soloNumero + 1;
    }

    // 3. Formatear con ceros a la izquierda (5 dígitos)
    // str_pad convierte 1 en "00001"
    return $prefijo . str_pad($numero, 5, "0", STR_PAD_LEFT);
}