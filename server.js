'use strict';

// --- Packages ---

const express = require('express');
const superagent = require('superagent');
require('dotenv').config();
const cors = require('cors');

// --- Global Variables ---

const app = express();
const PORT = process.env.PORT || 3003;

// --- Express Configs ---

app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));
// app.use(function (err, req, res, next) {
//   console.error(err.stack)
//   res.status(500)
//   res.render('pages/error')
// })

// --- Routes ---

  app.get('/', renderIndex);
  app.get('/hello', renderIndex);
  app.get('/searches/new', renderNew);
  app.post('/searches', searchHandler);

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
  // throw new Error('new error who dis');
  res.render('pages/index');
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
      console.log(bookList);
      res.render('pages/searches/show', {books: bookList});
    })
    .catch(error => errorHandler(error, res));
}

// --- Functions ---

function Book(bookObj) {
  this.title = bookObj.volumeInfo.title || 'title missing';
  this.author = bookObj.volumeInfo.authors || 'author missing';
  // reference for changing http to https
  // https://stackoverflow.com/questions/5491196/rewriting-http-url-to-https-using-regular-expression-and-javascript/5491311
  this.cover = bookObj.volumeInfo.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://') || 'https://i.imgur.com/J5LVHEL.jpg';
  this.description = bookObj.volumeInfo.description || 'description missing';
  this.isbn = bookObj.volumeInfo.industryIdentifiers[0].identifier || 'isbn missing';
  this.bookshelf = bookObj.volumeInfo.categories || 'category missing';
}

function errorHandler(error, res) {
  console.log(error);
  res.status(500).render('pages/error', {
    status: error.status,
    message: error.message
  });
}

// --- Server Startup ---

app.listen(PORT, () => console.log(`server listening on PORT: ${PORT}, all systems go`));
