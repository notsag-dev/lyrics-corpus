const axios = require('axios');
const cheerio = require('cheerio');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const parseQueryResponse = data => {
  return JSON.parse(data.substring(10, data.length - 2));
};

/**
 * Shuffle array (edits input :s)
 *
 */
const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

/**
 * Query API for artists/songs.
 *
 */
const query = async q => {
  const {data} = await axios.request({
    url: config.queryUrl,
    method: 'get',
    params: {
      q,
    },
  });
  return parseQueryResponse(data);
};

/**
 * Get the list of available songs names for an artist.
 *
 */
const getArtistSongsInfo = async (artist, maxSongs = 10) => {
  const {response: res} = await query(artist);
  if (!res.docs.length) {
    return [];
  }
  const doc = res.docs[0];
  const {data} = await axios.request({
    url: `${config.lyricsUrl}${doc.dns}`,
    method: 'get',
  });
  const $ = cheerio.load(data);
  let songs = $('ul.cnt-list a').toArray();
  shuffleArray(songs);
  return songs.slice(0, maxSongs)
    .map(a => ({
      name: a.children[0].data,
      url: `${config.lyricsUrl}${a.attribs['href']}`,
    }));
};

/**
 * Get location information for a song (in case it is found).
 *
 */
const getSongInformation = async (q) => {
  const {response: res} = await query(q);
  if (res.numFound >= 1) {
    const {url, dns} = res.docs[0];
    return {url, dns, found: true};
  }
  return {found: false};
};

/**
 * Get lyrics from song info got using getSongInformation.
 *
 */
const getLyricsFromSongInfo = async url => {
  const {data} = await axios.request({
    url,
    method: 'get',
  });
  const $ = cheerio.load(data);
  let lyrics = '';
  const content = $('.cnt-letra-trad .cnt-letra')
    .children('p')
    .each((i, p) => {
      lyrics += p.children
        .filter(p => p.type === 'text')
        .map(elem => elem.data)
        .join('\n');
      lyrics += '\n\n';
    });
  return lyrics;
};

/**
 * Get lyrics from song and artist name.
 *
 */
const getLyricsFromName = async (q) => {
  const song = await getSongInformation(q);
  if (!song.found) {
    return;
  }
  const url = `${config.lyricsUrl}${song.dns}/${song.url}`;
  return getLyricsFromSongInfo(url);
};

/**
 * Generate lyrics files for an artists.
 *
 */
const generateLyricsCorpus = async (
  artistName,
  dataPath = './',
  maxSongs = 10,
  debug = false,
) => {
  const fileRegExp = /[!@#$%^&*/\(),.?":{}|<>]/g;
  const artistFolderName = artistName.replace(fileRegExp, '');
  const dir = path.join(dataPath, artistFolderName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const songs = await getArtistSongsInfo(artistName, maxSongs);
  for (let i = 0; i < songs.length; i++) {
    const lyrics = await getLyricsFromSongInfo(songs[i].url);
    const fileName =
      songs[i].name.replace(fileRegExp, '').toLowerCase() + '.txt';
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, lyrics);
    if (debug) {
      console.log(`${i + 1}/${songs.length} ${songs[i].name}`);
    }
  }
  return songs;
};

module.exports = {
  getSongInformation,
  getLyricsFromSongInfo,
  getLyricsFromName,
  getArtistSongsInfo,
  generateLyricsCorpus,
};
