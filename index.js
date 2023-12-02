import inquirer from 'inquirer';
import path from 'path';

import getPostLink from './src/core/getPostLink.js';
import getDownloadUrl from './src/core/getDownloadUrl.js';
import goFileDownloader from './src/core/goFileDownloader.js';

(async () => {
  try {
    console.clear();
    console.log(
      'samehadaku-samehadaku its using for grab link and download file (gofile) only'
    );
    console.log(
      'example samehadaku link https://samehadaku.digital/anime/goblin-slayer-season-2/\n'
    );
    const question = await inquirer.prompt({
      type: 'input',
      message: 'insert samehadaku url ',
      name: 'url',
    });
    const { url } = question;
    console.log(`\nWait getting post link\n`);
    const postLink = await getPostLink(url);
    if (postLink.error == true) {
      throw postLink;
    }
    console.log(`success get post link\n`);
    const { post } = postLink;
    const animeName = path.basename(url);
    let data = {
      title: animeName,
      postList: [],
    };
    for (const [index, item] of post.entries()) {
      console.log(`Getting gofile link from ${item.title}`);
      const dlUrl = await getDownloadUrl(item.postLink);
      console.log(`success get gofile link from ${item.title}\n`);
      const current = index + 1;
      await goFileDownloader(dlUrl, data.title, current, post.length);
    }
    return;
  } catch (error) {
    console.log(error);
  }
})();
