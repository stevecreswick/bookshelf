/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const args = require('minimist')(process.argv.slice(2));
const util = require('util');

const read = util.promisify(fs.readFile).bind(fs);
const write = util.promisify(fs.writeFile).bind(fs);

const input = args.i;

if (!input) {
  throw new Error('Input and output required');
}

const inputFile = path.join(process.cwd(), input);

// Metadata
// Do I want to move this into a file adjacent to the text?
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

  // @todo: Use catalog.json to create routes in the index
  const formatedTitle = dashCase(title);
  const formatedAuthor = dashCase(author);

  const directory = path.join(process.cwd(), 'library/json', formatedAuthor);

  createDirectory(directory);

  const outputFile = path.join(directory, `${formatedTitle}.json`);

  await write(outputFile, json);

  console.log(formatedAuthor, formatedTitle);
  console.log('Success!!!');
  console.log(`${outputFile} written`);
};

convert(inputFile);
