<?php

$host = 'aws-1-us-east-1.pooler.supabase.com';
$port = '6543';
$db = 'postgres';
$user = 'postgres.njwkvxlqjymcbzbtezfa';
$pass = 'lz9IVlpgSsVjIKog';

$dsn = "pgsql:host=$host;port=$port;dbname=$db";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => true // prepare statements simulados
    ]);
} catch (\PDOException $e) {
    throw new \PDOException($e->getMessage(), (int) $e->getCode());
}
