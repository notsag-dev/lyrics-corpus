#!/usr/bin/env node
const lyrics = require('../');

const logHelp = () => {
  console.log(`
    NAME
      lyrics -- Print lyrics to console

    SYNOPSIS
      lyrics songInfo

    EXAMPLES
      lyrics nirvana smells like teen spirit
  `);
};

const printLyrics = async q => {
  if (!args.length) {
    logHelp();
    return;
  }
  const l = await lyrics.getLyricsFromName(q);
  console.log(l || 'No results found.');
};

const [, , ...args] = process.argv;
printLyrics(args.join(' '));
