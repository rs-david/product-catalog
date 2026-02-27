<?php

function generarPrefijoDeModelo($categoria)
{
    $prefijos = [
        'joyeria' => 'JY',
        'accesorios' => 'AC',
        'juguetes' => 'JG',
        'regalos' => 'RG',
        'ropa' => 'RP'
    ];

    return $prefijos[strtolower($categoria)] ??'TQ';
}
