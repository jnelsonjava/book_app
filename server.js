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

app.get('/hello', (req, res) => {
  console.log('home base reached');
  res.render('pages/index');
})

// --- Route Handlers ---

// --- Functions ---

// --- Server Startup ---

app.listen(PORT, () => console.log(`server listening on PORT: ${PORT}, all systems go`));
