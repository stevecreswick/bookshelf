/* eslint-disable no-console */

const express = require('express');
const fs = require('fs');
const path = require('path');
const util = require('util');

const read = util.promisify(fs.readFile).bind(fs);

const library = path.join(process.cwd(), 'library/json');
const dashCaseAuthors = fs.readdirSync(library);

const app = express();

app.use('/assets', express.static('assets'));

app.set('view engine', 'ejs');

const templates = {
  index: path.join(process.cwd(), 'views', 'pages', 'index'),
  author: path.join(process.cwd(), 'views', 'pages', 'author'),
  story: path.join(process.cwd(), 'views', 'pages', 'story'),
};

app.get('/', (req, res) => {
  const authors = dashCaseAuthors.map(name => ({ name: name.replace(/-/g, ' '), link: name }));

  res.render(templates.index, { authors });
});

dashCaseAuthors.forEach((author) => {
  // Authors Works
  const stories = fs.readdirSync(path.join(library, author))
    .map((file) => {
      const story = file.replace(/\.[^/.]+$/, '');
      return { link: story, name: story.replace(/-/g, ' ') };
    });

  // Authors Index
  app.get(`/authors/${author}`, (req, res) => {
    const formatted = {
      name: author.replace(/-/g, ' '),
      link: author,
    };
    res.render(templates.author, { author: formatted, stories });
  });

  stories.forEach(async (story) => {
    const file = path.join(process.cwd(), 'library', 'json', author, `${story.link}.json`);
    const data = await read(file);
    const parsed = JSON.parse(data);

    const { metadata, paragraphs } = parsed;

    app.get(`/authors/${author}/${story.link}`, (req, res) => {
      res.render(templates.story, { metadata, paragraphs });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
