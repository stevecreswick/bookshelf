/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const util = require('util');

const read = util.promisify(fs.readFile).bind(fs);

const library = path.join(process.cwd(), 'library/json');
const authors = fs.readdirSync(library);

const express = require('express');

const app = express();

app.set('view engine', 'ejs');

const templates = {
  index: path.join(process.cwd(), 'views', 'pages', 'index'),
  author: path.join(process.cwd(), 'views', 'pages', 'author'),
  story: path.join(process.cwd(), 'views', 'pages', 'story'),
};

app.get('/', (req, res) => {
  res.render(templates.index, { authors });
});

authors.forEach((author) => {
  // Authors Works
  const stories = fs.readdirSync(path.join(library, author))
    .map(story => story.replace(/\.[^/.]+$/, ''));

  // Authors Index
  app.get(`/authors/${author}`, (req, res) => {
    res.render(templates.author, { author, stories });
  });

  stories.forEach(async (story) => {
    const file = path.join(process.cwd(), 'library', 'json', author, `${story}.json`);
    const data = await read(file);
    const parsed = JSON.parse(data);

    const { metadata, paragraphs } = parsed;

    app.get(`/authors/${author}/${story}`, (req, res) => {
      res.render(templates.story, { metadata, paragraphs });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
