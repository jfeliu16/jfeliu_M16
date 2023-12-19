const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const multer = require('multer');
const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const port = process.env.PORT;

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Middleware setup
app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Establece EJS como motor de vistas
app.set('view engine', 'ejs');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

app.get('/registre', (req, res) => {
  res.sendFile(__dirname + '/public/registre.html');
});

app.get('/casos', (req, res) => {
// Realiza la consulta a la base de datos para obtener las preguntas
pool.getConnection((err, connection) => {
  if (err) {
      console.error('Error getting connection from pool:', err);
      return res.status(500).send('Internal server error');
  }

  // Realiza la consulta para obtener las preguntas
  connection.query('SELECT * FROM M16_jaume.QuestionTree LIMIT 1;', (queryErr, preguntas) => {
      // Release the connection back to the pool
      connection.release();

      if (queryErr) {
          console.error('Database query error:', queryErr);
          return res.status(500).send('Internal server error');
      }

      // Renderiza la vista casos.ejs y pasa las preguntas como datos
      res.render('caries', { preguntas: preguntas });
  });
});
});



app.get('/caries', (req, res) => {
  
});


app.get('/crearpreguntes', (req, res) => {
  res.sendFile(__dirname + '/public/crearpreguntes.html');
});


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/casos.html');
});

app.get('/style.css', (req, res) => {
  res.header('Content-Type', 'text/css');
  res.sendFile(__dirname + '/public/style.css');
});

app.get('/practiquem', (req, res) => {
  res.sendFile(__dirname + '/public/practiquem.html');
});

app.get('/identifica', (req, res) => {
  res.sendFile(__dirname + '/public/identifica.html');
});




// Example of using the connection pool in your route handlers
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Get a connection from the pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return res.status(500).send('Internal server error');
    }

    // Use the connection to execute the query
    connection.query('SELECT * FROM Usuaris WHERE nomUsuari = ? AND contrasenya = ?', [username, password], (queryErr, results) => {
      // Release the connection back to the pool
      connection.release();

      if (queryErr) {
        console.error('Database query error:', queryErr);
        return res.status(500).send('Internal server error');
      }

      // ... rest of your code
      if (results.length === 1) {
        res.sendFile(__dirname + '/public/home.html');
      } else {
        const errorMessage = 'Usuari o contrssenya incorrecte. Torna a provar.';
        res.redirect('/login?error=' + encodeURIComponent(errorMessage))
      }
    });
  });
});

app.post('/registre', (req, res) => {
  const { username, name, cognoms, correu, password, password2 } = req.body;

  if (password === password2) {
    // Passwords match, proceed with the insertion
    // Get a connection from the pool
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('Error getting connection from pool:', err);
        return res.status(500).send('Internal server error');
      }

      // Use the connection to execute the query
      connection.query("INSERT INTO Usuaris (nomUsuari, nom, cognoms, correu, contrasenya) VALUES (?, ?, ?, ?, ?)", [username, name, cognoms, correu, password], (queryErr, results) => {
        // Release the connection back to the pool
        connection.release();

        if (queryErr) {
          console.error('Database query error:', queryErr);
          return res.status(500).send('Internal server error');
        }

        // ... rest of your code
        res.sendFile(__dirname + '/public/index.html');
      });
    });
  }
});



// Ruta para manejar la inserción de preguntas
app.post('/addQuestion', upload.single('image'), (req, res) => {
  const { questionText, parentQuestionID, correctAnswerID, incorrectAnswerID, explicacio } = req.body;
  const image = req.file ? req.file.buffer : null;

  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al obtener conexión de la pool:', err);
      return res.status(500).send('Error interno del servidor');
    }

    // Utilizar la conexión para ejecutar la consulta de inserción
    connection.query(
      'INSERT INTO QuestionTree (QuestionText, ParentQuestionID, CorrectAnswerID, IncorrectAnswerID, imatge, Explicacio) VALUES (?, ?, ?, ?, ?, ?)',
      [questionText, parentQuestionID, correctAnswerID, incorrectAnswerID, image, explicacio],
      (queryErr, results) => {
        // Liberar la conexión de nuevo a la pool
        connection.release();

        if (queryErr) {
          console.error('Error en la consulta de la base de datos:', queryErr);
          return res.status(500).send('Error interno del servidor');
        }

        // Redirigir o responder según sea necesario
        res.redirect('/'); // Cambia a la página que desees después de la inserción exitosa
      }
    );
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});