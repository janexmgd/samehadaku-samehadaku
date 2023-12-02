import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_RETRIES = 5;

const getPostLink = async (url) => {
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    try {
      const r = await axios.get(url);
      const $ = cheerio.load(r.data);
      const title = $('title').text();
      const listEpisode = $('.lstepsiode');
      const list = listEpisode.find('ul');
      const data = [];
      list.find('li').each((index, element) => {
        const epsRight = $(element).find('.epsright');
        const epsLeft = $(element).find('.epsleft');

        // get cont epsright
        const episodeNumber = epsRight.find('span.eps').text();
        const episodeLink = epsRight.find('span.eps a').attr('href');

        // get cont epsleft
        const title = epsLeft.find('span.lchx a').text();
        const postLink = epsLeft.find('span.lchx a').attr('href');
        const uploadDate = epsLeft.find('span.date').text();
        const arr = {
          episode: episodeNumber,
          title: title,
          uploadDate: uploadDate,
          postLink,
        };
        data.push(arr);
      });
      return {
        title,
        post: data,
      };
    } catch (error) {
      console.log(`Error when getPostlink: ${error.message}`);
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`Retrying... Attempt ${retryCount + 2}`);
      }
    }
  }
  console.log('Max retries reached. Unable to fetch data.');
  return null; // or throw an error, depending on your use case
};
export default getPostLink;
