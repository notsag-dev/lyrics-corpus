#!/usr/bin/env node
const lyrics = require('../.');

const createCorpus = async (args) => {
  if (!args.length) {
    logHelp();
    return;
  }
  if (args[0] === '--help' || args[0] === 'help') {
    logHelp();
    return;
  }
  const artist = args[0];
  let num = 0;
  if (args.length > 1) {
    num = parseInt(args[1], 10);
  }
  const songs = await lyrics.generateLyricsCorpus(args[0], process.cwd(), num, true);
  console.log(`${songs.length} songs fetched`);
}

const logHelp = () => {
  console.log(`
    NAME
      create-corpus -- Generate files with songs' lyrics

    SYNOPSIS
      create-corpus nameArtist numberOfSongs

    EXAMPLES
      create-corpus "Carlos Gardel" 20
  `)
}

const [,, ...args] = process.argv;
createCorpus(args);
