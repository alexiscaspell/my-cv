const express = require('express');
const path = require('path');

const app = express();
const distDir = path.join(__dirname, 'dist');

app.use(express.static(distDir));

app.listen(3000, () => {
    console.log('Serving static site from dist/ on port 3000');
});
