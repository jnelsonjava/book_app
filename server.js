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

// --- Route Handlers ---

function renderIndex(req, res) {
  console.log('home base reached');
  res.render('pages/index');
}

function renderNew(req, res) {
  console.log(req);
  res.render('pages/searches/new');
}

// --- Functions ---

// --- Server Startup ---

app.listen(PORT, () => console.log(`server listening on PORT: ${PORT}, all systems go`));
