<?php
function pgArrayToPhp($pgArray)
{
    // Eliminamos las llaves de los extremos {}
    $trimmed = trim($pgArray, '{}');

    if (empty($trimmed)) return [];

    // str_getcsv es genial porque respeta los elementos entre comillas
    return str_getcsv($trimmed);
}
