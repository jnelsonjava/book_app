'use strict';

// --- Packages ---

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const cors = require('cors');
const pg = require('pg');
const methodOverride = require('method-override');

// --- Global Variables ---

const app = express();
const PORT = process.env.PORT || 3003;
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', (error) => console.error(error));

// --- Express Configs ---

app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));

// --- Routes ---

app.get('/', renderIndex);
app.get('/searches/new', renderNew);
app.post('/searches', searchHandler);
app.get('/books/:id', renderDetails);
app.post('/books', addBook);
app.put('/books/:id', updateBook);
app.delete('/books/:id', deleteBook);

// reference for error handling unused routes
// https://medium.com/@SigniorGratiano/express-error-handling-674bfdd86139
app.all('*', (req, res, next) => {
  res.status(404).render('pages/error', {
    status: 404,
    message: `Can't find the ${req.originalUrl} route on this server!`
  });
});

// --- Route Handlers ---

function renderIndex(req, res) {
  client.query(`SELECT * FROM books`)
    .then(queryResult => {
      res.render('pages/index', {books: queryResult.rows});
    })
}

function renderNew(req, res) {
  res.render('pages/searches/new');
}

function searchHandler(req, res) {
  const apiUrl = 'https://www.googleapis.com/books/v1/volumes';
  const query = `+in${req.body.searchType}:${req.body.userInput}`;

  superagent.get(apiUrl)
    .query({q: query})
    .then(result => {
      const bookList = result.body.items.slice(0, 10).map((bookObj => new Book(bookObj)));
      res.render('pages/searches/show', {books: bookList});
    })
    .catch(error => errorHandler(error, res));
}

function renderDetails(req, res) {
  client.query('SELECT * FROM books WHERE id=$1', [req.params.id])
    .then(queryResult => {
      client.query('SELECT DISTINCT category FROM books')
        .then(categoryResult => {
          res.render('pages/books/show', {
            book: queryResult.rows[0],
            categories: categoryResult.rows.map(cat => cat.category)
          });
        })
    })
}

function addBook(req, res) {
  const {cover, title, author, description, isbn, category} = JSON.parse(req.body.book);

  const insertSql = `INSERT INTO books (cover, title, author, description, isbn, category) VALUES ($1, $2, $3, $4, $5, $6)`;
  const valueArray = [cover, title, author, description, isbn, category];

  client.query(insertSql, valueArray)
    .then( () => {
      console.log(`saved ${title} by ${author} to DB`);
      res.redirect('/');
    })
}

function updateBook(req, res) {
  const {title, author, cover, description, isbn, category, id} = req.body;

  const updateSql = `UPDATE books SET
                      title=$1,
                      author=$2,
                      cover=$3,
                      description=$4,
                      isbn=$5,
                      category=$6
                      WHERE id=$7`;
  const valueArray = [title, author, cover, description, isbn, category, id];

  client.query(updateSql, valueArray)
    .then( (result) => {
      console.log(`updated ${title} by ${author}`);
      res.redirect(`/books/${id}`);
    })
    .catch(error => errorHandler(error, res));
}

function deleteBook(req, res) {
  console.log('we in bby')
  client.query('DELETE FROM books WHERE id=$1', [req.params.id])
    .then( () => {
      res.redirect('/');
    })
}

// --- Functions ---

function Book(bookObj) {
  const bookDetails = bookObj.volumeInfo;
  this.title = bookDetails.title || 'title missing';
  this.author = bookDetails.authors.join(', ') || 'author missing';
  // reference for changing http to https
  // https://stackoverflow.com/questions/5491196/rewriting-http-url-to-https-using-regular-expression-and-javascript/5491311
  this.cover = bookDetails.imageLinks && bookDetails.imageLinks.thumbnail ?
    bookDetails.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://') :
    'https://i.imgur.com/J5LVHEL.jpg';
  this.description = bookDetails.description || 'description missing';
  this.isbn = 'isbn missing';
  for (let id of bookDetails.industryIdentifiers) {
    if ((/^ISBN/g).test(id.type)) {
      this.isbn = id.identifier;
      break;
    }
  }
  this.category = bookDetails.categories ? bookDetails.categories[0] : 'category missing';
}

function errorHandler(error, res) {
  console.log(error);
  res.status(500).render('pages/error', {
    status: error.status,
    message: error.message
  });
}

// --- Server Startup ---

client.connect()
  .then( () => {
    app.listen(PORT, () => console.log(`server listening on PORT: ${PORT}, all systems go`));
  });
