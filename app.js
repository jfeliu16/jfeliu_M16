const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const multer = require('multer');
const app = express();
const fs = require('fs');

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

// Configuración de multer para gestionar la carga de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Carpeta donde se guardarán las imágenes ***S'ha de crear la carpeta al servidor, sinó falla
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });


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
  res.sendFile(__dirname + '/public/casos.html');
});









// Make the FillID parameter optional by adding '?' at the end
app.get('/caries/:FillID', (req, res) => {
  // Retrieve the FillID from the request parameters or set a default value
  const FillID = req.params.FillID; // Assuming a default FillID of 1

  // Query the database to get questions based on FillID
  db.query('SELECT * FROM QuestionTree WHERE QuestionID = ?', [FillID], (err, results) => {
      if (err) {
          console.error('Error fetching questions:', err);
          return res.status(500).send('Internal Server Error');
      }

      if (!results || results.length === 0) {
          console.error('No questions found in the database.');
          return res.status(404).send('Questions not found');
      }

      const preguntas = results.map(question => ({
          QuestionID: question.QuestionID,
          QuestionText: question.QuestionText,
          CorrectAnswer: question.CorrectAnswer,
          IncorrectAnswer: question.IncorrectAnswer,
          Image: question.Imatge ? question.Imatge.toString('base64') : null,
          Explicacio: question.Explicacio,
          FillID: question.FillID,
          // Add other properties as needed
      }));

      // Render the view with the retrieved questions
      res.render('caries.ejs', { preguntas });
  });
});














app.get('/crearCas', (req, res) => {
  res.sendFile(__dirname + '/public/crearcas.html');
});

app.get('/crearpreguntes', (req, res) => {
  res.sendFile(__dirname + '/public/crearpreguntes.html');
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

app.get('/home', (req, res) => {
  res.sendFile(__dirname + '/public/home.html');
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

  // Use the pool to execute the query
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return res.status(500).send('Internal server error');
    }

    // Use the connection to execute the query
    connection.query('SELECT * FROM Usuaris WHERE nomUsuari = ?', [username], (queryErr, results) => {
      // Release the connection back to the pool
      connection.release();

      if (queryErr) {
        console.error('Database query error:', queryErr);
        return res.status(500).send('Internal server error');
      }

      // Check if the username already exists
      if (results.length > 0) {
        showToast('Error: Usuari ja existent. Torna a provar.', true);
      } else {
        // If the username doesn't exist, proceed with password validation and insertion
        if (password === password2) {
          // Get another connection from the pool
          pool.getConnection((insertionErr, insertConnection) => {
            if (insertionErr) {
              console.error('Error getting connection from pool:', insertionErr);
              return res.status(500).send('Internal server error');
            }

            // Use the connection to execute the query
            insertConnection.query("INSERT INTO Usuaris (nomUsuari, nom, cognoms, correu, contrasenya) VALUES (?, ?, ?, ?, ?)", [username, name, cognoms, correu, password], (insertQueryErr, insertResults) => {
              // Release the connection back to the pool
              insertConnection.release();

              if (insertQueryErr) {
                console.error('Database query error:', insertQueryErr);
                return res.status(500).send('Internal server error');
              }

              // Redirect or send the appropriate response after successful registration
              res.sendFile(__dirname + '/public/');
            });
          });
        } else {
          showToast('Error: Les contrasenyes no coincideixen. Torna a provar.', true);
          res.redirect('/register?error=' + encodeURIComponent('Les contrasenyes no coincideixen. Torna a provar.'));
        }
      }
    });
  });
});








// Add this route to your server code
app.get('/getImage/:questionID', (req, res) => {
  const questionID = req.params.questionID;

  // Fetch the image data from the database based on the questionID
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error getting connection from pool:', err);
      return res.status(500).send('Internal server error');
    }

    // Use the connection to execute the query
    connection.query('SELECT Imatge FROM QuestionTree WHERE QuestionID = ?', [questionID], (queryErr, results) => {
      // Release the connection back to the pool
      connection.release();

      if (queryErr) {
        console.error('Database query error:', queryErr);
        return res.status(500).send('Internal server error');
      }

      // Check if results were found
      if (results.length === 1) {
        // Send the BLOB data as the image response
        const imageBuffer = results[0].imatge;
        res.writeHead(200, {
          'Content-Type': 'image/jpeg', // Adjust the content type based on your image type
          'Content-Length': imageBuffer.length,
        });
        res.end(imageBuffer, 'binary');
      } else {
        // Handle case where no image is found
        res.status(404).send('Image not found');
      }
    });
  });
});






// Ruta para manejar la inserción de preguntas
app.post('/addQuestion', upload.single('imagen'), (req, res) => {
  const { questionText, parentQuestionID, correctAnswer, incorrectAnswer, explicacio } = req.body;
  const imagenPath = req.file.path;

  // Convert empty string to null for parentQuestionID
  const sanitizedParentQuestionID = parentQuestionID === '' ? null : parentQuestionID;

  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al obtener conexión de la pool:', err);
      return res.status(500).send('Error interno del servidor');
    }

    // Utilizar la conexión para ejecutar la consulta de inserción
    connection.query(
      'INSERT INTO QuestionTree (QuestionText, ParentQuestionID, CorrectAnswer, IncorrectAnswer, imatge, Explicacio) VALUES (?, ?, ?, ?, ?, ?)',
      [questionText, sanitizedParentQuestionID, correctAnswer, incorrectAnswer, fs.readFileSync(imagenPath), explicacio],
      (queryErr, results) => {
        // Liberar la conexión de nuevo a la pool
        connection.release();

        if (queryErr) {
          console.error('Error en la consulta de la base de datos:', queryErr);
          return res.status(500).send('Error interno del servidor');
        }

        // Redirigir o responder según sea necesario
        res.redirect('/crearpreguntes'); // Cambia a la página que desees después de la inserción exitosa
      }
    );
  });
});





app.post('/addCase', (req, res) => {
  const { casName, Descripcio} = req.body;

  // Obtener una conexión del pool
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al obtener conexión de la pool:', err);
      return res.status(500).send('Error interno del servidor');
    }

    console.log(casName, Descripcio);
    // Utilizar la conexión para ejecutar la consulta de inserción
    connection.query(
      'INSERT INTO Cassos (Nom_cas, Descripcio) VALUES (?, ?)',
      [casName, Descripcio],
      (queryErr, results) => {
        // Liberar la conexión de nuevo a la pool
        connection.release();

        if (queryErr) {
          console.error('Error en la consulta de la base de datos:', queryErr);
          return res.status(500).send('Error interno del servidor');
        }

        // Redirigir o responder según sea necesario
        res.redirect('/crearpreguntes'); // Cambia a la página que desees después de la inserción exitosa
      }
    );
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


function showToast(message, isError = false) {
  console.log(message);
}