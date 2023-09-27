const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000; // El puerto en el que se ejecutará tu aplicación web

// Configuración de la conexión a MySQL
const dbConfig = {
    host: '192.168.1.101',          // Cambia esto a la dirección de tu servidor MySQL si es necesario
    user: 'jfelium16',         // Cambia esto a tu nombre de usuario de MySQL
    password: 'alumne',  // Cambia esto a tu contraseña de MySQL
    database: 'sakila' // Cambia esto al nombre de tu base de datos
};

async function testConnection() {
    try {
        // Crear una conexión a la base de datos
        const connection = await mysql.createConnection(dbConfig);

        // Realizar una consulta de prueba
        const [rows, fields] = await connection.execute('SELECT 1 + 1 AS resultado');
        const resultado = rows[0].resultado;

        // Cerrar la conexión
        await connection.end();

        return resultado;
    } catch (error) {
        console.error('Error de conexión a la base de datos:', error);
        return null;
    }
}

app.get('/', async (req, res) => {
    // Probar la conexión a la base de datos
    const resultado = await testConnection();

    if (resultado !== null) {
        res.send(`Conexión exitosa a la base de datos. Resultado de la consulta: ${resultado}`);
    } else {
        res.status(500).send('Error de conexión a la base de datos.');
    }
});

app.listen(port, () => {
    console.log(`La aplicación web está escuchando en el puerto ${port}`);
});

