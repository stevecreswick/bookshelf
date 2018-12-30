/* eslint-disable no-console */

const express = require('express');
const fs = require('fs');
const path = require('path');
const util = require('util');

const read = util.promisify(fs.readFile).bind(fs);

const app = express();

app.use('/assets', express.static('assets'));

app.set('view engine', 'ejs');

const templates = {
  index: path.join(process.cwd(), 'views', 'pages', 'index'),
  author: path.join(process.cwd(), 'views', 'pages', 'author'),
  story: path.join(process.cwd(), 'views', 'pages', 'story'),
};

const library = path.join(process.cwd(), 'library/json');

const dashCaseAuthors = fs.readdirSync(library);

const authors = dashCaseAuthors.map((author) => {
  const stories = fs.readdirSync(path.join(library, author))
    .map((file) => {
      const story = file.replace(/\.[^/.]+$/, '');
      return { link: story, name: story.replace(/-/g, ' ') };
    });
  return { name: author.replace(/-/g, ' '), link: author, stories };
});


app.get('/', (req, res) => {
  res.render(templates.index, { authors });
});

authors.forEach((author) => {
  console.log(author);

  // Authors Index
  app.get(`/authors/${author.link}`, (req, res) => {
    // const formatted = {
    //   name: author.replace(/-/g, ' '),
    //   link: author,
    // };
    res.render(templates.author, { author });
  });

  author.stories.forEach(async (story) => {
    const file = path.join(process.cwd(), 'library', 'json', author.link, `${story.link}.json`);
    const data = await read(file);
    const parsed = JSON.parse(data);

    const { metadata, paragraphs } = parsed;

    app.get(`/authors/${author.link}/${story.link}`, (req, res) => {
      res.render(templates.story, { metadata, paragraphs });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port: ${PORT}`);
});
