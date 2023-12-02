import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_RETRIES = 5;

const getDownloadUrl = async (url) => {
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    try {
      // const url = 'https://samehadaku.digital/goblin-slayer-season-2-epsiode-9/';
      const r = await axios.get(url);
      const $ = cheerio.load(r.data);
      const downloadData = {};

      // get downloadb div
      const downloadGroups = $('div#downloadb');

      // process each div downloadb
      downloadGroups.each((groupIndex, groupElement) => {
        // get file type from element b
        const fileType = $(groupElement).find('b').text().trim();

        // go li element at group elemeny
        const downloadOptions = $(groupElement).find('li');

        // process each quality
        downloadOptions.each((optionIndex, optionElement) => {
          // get quality from strong tex
          const quality = $(optionElement).find('strong').text().trim();

          // get download link
          const downloadLinks = $(optionElement).find('a');

          // Array untuk menyimpan tautan download
          const links = [];

          // Iterasi melalui setiap tautan download
          downloadLinks.each((linkIndex, linkElement) => {
            const href = $(linkElement).attr('href');
            links.push(href);
          });

          // Tambahkan tautan ke dalam objek quality
          if (!downloadData[fileType]) {
            downloadData[fileType] = {};
          }
          downloadData[fileType][quality] = links;
        });
      });
      // console.log(downloadData.MKV['720P']);
      const links = downloadData.MKV['720p'];
      const gofileLink = links.filter((link) =>
        link.startsWith('https://gofile.io')
      );
      return gofileLink[0];
    } catch (error) {
      console.log(`Error when getDownloadUrl: ${error.message}`);
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`Retrying... Attempt ${retryCount + 2}`);
      }
    }
  }
  console.log('Max retries reached. Unable to fetch Gofile link.');
  return null;
};
export default getDownloadUrl;
// getDownloadUrl();
