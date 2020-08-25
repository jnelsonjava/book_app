'use strict';

// --- Packages ---

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const cors = require('cors');
const pg = require('pg');

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

// --- Routes ---

app.get('/', renderIndex);
app.get('/searches/new', renderNew);
app.post('/searches', searchHandler);
app.get('/books/:id', renderDetails);

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
  console.log('home base reached');
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
      res.render('pages/books/show', {book: queryResult.rows[0]});
    })
}

// --- Functions ---

function Book(bookObj) {
  const bookDetails = bookObj.volumeInfo;
  this.title = bookDetails.title || 'title missing';
  this.author = bookDetails.authors || 'author missing';
  // reference for changing http to https
  // https://stackoverflow.com/questions/5491196/rewriting-http-url-to-https-using-regular-expression-and-javascript/5491311
  this.cover = bookDetails.imageLinks && bookDetails.imageLinks.thumbnail ?
    bookDetails.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://') :
    'https://i.imgur.com/J5LVHEL.jpg';
  this.description = bookDetails.description || 'description missing';
  this.isbn = 'isbn missing';
  for (let id of bookDetails.industryIdentifiers) {
    // TODO: check if this needs to be specifically ISBN_10 or ISBN_13
    if ((/^ISBN/g).test(id.type)) {
      console.log('setting:', id);
      this.isbn = id.identifier;
      break;
    }
  }
  this.category = bookDetails.categories || 'category missing';
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
