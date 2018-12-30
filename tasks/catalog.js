/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const util = require('util');

const read = util.promisify(fs.readFile).bind(fs);
const write = util.promisify(fs.writeFile).bind(fs);

// Metadata
const TITLE_POSITION = 0;
const AUTHOR_POSITION = 1;
const YEAR_POSITION = 2;

const metadataFields = [TITLE_POSITION, AUTHOR_POSITION, YEAR_POSITION];

const storyInfo = (split) => {
  const title = split[TITLE_POSITION].replace(/(Title: )(.*)/, '$2');
  const author = split[AUTHOR_POSITION].replace(/(Author: )(.*)/, '$2');
  const published = split[YEAR_POSITION].replace(/(Year: )(.*)/, '$2');

  return {
    title,
    author,
    published,
  };
};

const wordCount = paragraphs => paragraphs.map((paragraph) => {
  if (paragraph === '') {
    return 0;
  }

  return paragraph.split(' ').length;
}).reduce((total, num) => total + num);

// Read Time
// https://help.medium.com/hc/en-us/articles/214991667-Read-time
// Avg. Human reads 265 WPM

// Rounding
// https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
const readTime = count => +`${Math.round(`${(count / 265)}e+2`)}e-2`;

const format = (text) => {
  const split = text.split('\n');

  const metadata = storyInfo(split);

  // Remove Metadata fields from text
  split.splice(0, metadataFields.length);

  const paragraphs = [];
  let temp = '';

  split.forEach((block, i) => {
    // There is no line break after the last line,
    // this ensures the last paragraphs gets added
    if (i === split.length - 1) {
      temp = `${temp} ${block}`;
      paragraphs.push(temp);
    }

    if (block !== '') {
      temp = `${temp} ${block}`;
    } else {
      paragraphs.push(temp);
      temp = '';
    }
  });

  metadata.wordCount = wordCount(paragraphs);
  metadata.readTime = readTime(metadata.wordCount);

  console.log(metadata.wordCount);
  console.log(metadata.wordCount / 265);
  console.log(metadata.readTime);

  const { title, author } = metadata;
  return { title, author, json: JSON.stringify({ metadata, paragraphs }) };
};

const dashCase = string => string.toLowerCase()
  .split(' ')
  .join('-');

const createDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

const convert = async (file) => {
  const data = await read(file);
  const { author, title, json } = format(data.toString());

  const formatedTitle = dashCase(title);
  const formatedAuthor = dashCase(author);

  const directory = path.join(process.cwd(), 'library/json', formatedAuthor);

  createDirectory(directory);

  const outputFile = path.join(directory, `${formatedTitle}.json`);

  await write(outputFile, json);

  console.log('Success!!!');
  console.log(`${outputFile} written`);

  // @todo: build catalog.json of link and formatted stuff and such
  return { author, title };
};


const catalog = async () => {
  const folder = path.join(process.cwd(), 'library', 'txt');

  fs.readdirSync(folder).forEach(async (authorName) => {
    const authorFolder = path.join(folder, authorName);

    fs.readdirSync(authorFolder).forEach(async (story) => {
      const storyFile = path.join(folder, authorName, story);

      await convert(storyFile);
    });
  });
};

catalog();
