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

// --- Routes ---

app.get('/hello', renderIndex);
app.get('/searches/new', renderNew);
app.post('/searches', searchHandler);

// --- Route Handlers ---

function renderIndex(req, res) {
  console.log('home base reached');
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
      console.log('len: ', bookList.length);
      res.render('pages/searches/show', {books: bookList});
    });
}

// --- Functions ---

function Book(bookObj) {
  this.title = bookObj.volumeInfo.title || 'title missing';
  this.author = bookObj.volumeInfo.authors || 'author missing';
  this.cover = bookObj.volumeInfo.imageLinks.thumbnail || 'https://i.imgur.com/J5LVHEL.jpg';
  this.description = bookObj.volumeInfo.description || 'description missing';
  this.isbn = bookObj.volumeInfo.industryIdentifiers[0].identifier || 'isbn missing';
  this.bookshelf = bookObj.volumeInfo.categories || 'category missing';
}

// --- Server Startup ---

app.listen(PORT, () => console.log(`server listening on PORT: ${PORT}, all systems go`));
