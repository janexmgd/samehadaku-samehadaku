import axios from 'axios';
import fs from 'fs';
import ProgressBarClass from '../utils/progressBar.js';
import path from 'path';
import * as crypto from 'crypto';
import { URL } from 'url';
import { formatFileSize, formatSpeed } from '../utils/formatter.js';

const MAX_RETRIES = 5;

const getToken = async () => {
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0',
        'Accept-Encoding': 'gzip, deflate, br',
        Accept: '*/*',
        Connection: 'keep-alive',
      };
      const createAcc = await axios.get(
        'https://api.gofile.io/createAccount',
        headers
      );
      const api_token = createAcc.data.data.token;
      const accountResp = await axios.get(
        'https://api.gofile.io/getAccountDetails?token=' + api_token,
        headers
      );
      if (accountResp.data.status != 'ok') {
        throw new Error(`error when get token :`);
      }
      return accountResp.data.data.token;
    } catch (error) {
      console.log(`error when get token : ${error.message}`);
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`Retrying... Attempt ${retryCount + 2}`);
      }
    }
  }
  console.log('Max retries reached. Unable get token Gofile.');
  return null;
};

const genPass = async (password) => {
  try {
    const hashedPassword = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');
    return hashedPassword;
  } catch (error) {
    console.log(`Error when generating password: ${error}`);
  }
};

const downloader = async (url, token, filePath, currentLength, postLength) => {
  try {
    const progressBar = new ProgressBarClass();
    const filename = path.basename(filePath);
    let reffUrl;
    if (url.endsWith('/')) {
      reffUrl = url;
    } else {
      reffUrl = url + '/';
    }
    const headers = {
      Cookie: `accountToken=${token}`,
      'Accept-Encoding': 'gzip, deflate, br',
      'User-Agent': 'Mozilla/5.0',
      Accept: '*/*',
      Referer: reffUrl,
      Origin: reffUrl,
      Connection: 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
    };
    const { data, headers: responseHeaders } = await axios({
      url,
      method: 'GET',
      headers,
      responseType: 'stream',
    });
    const totalSize = parseInt(responseHeaders['content-length'], 10);
    const fileSize = formatFileSize(totalSize);
    let downloadedSize = 0;
    let lastTimestamp = Date.now();
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    if (fs.existsSync(filePath)) {
      console.log(`${filename} is already downloaded\n`);
      return;
    }
    progressBar.start(100, {
      filename,
      size: fileSize,
      total: 1,
      bar: { width: 0 },
    });
    await new Promise((resolve, reject) => {
      const writeStream = fs.createWriteStream(filePath);

      data.on('data', (chunk) => {
        downloadedSize += chunk.length;

        const current = downloadedSize;
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTimestamp;
        const speed = (current / timeDiff) * 1000;

        const percentage = (current / totalSize) * 100;
        progressBar.update(
          percentage,
          formatSpeed(speed),
          currentLength,
          postLength
        );
      });

      data.on('end', () => {
        progressBar.complete();
        console.log(`Success download ${filename} \n`);
        resolve();
      });

      data.on('error', (error) => {
        progressBar.complete();
        console.error(`Error download ${filename}:`, error);
        reject(error);
      });

      data.pipe(writeStream);
    });
    return;
  } catch (error) {
    console.log(`Error in downloader: ${error}`);
  }
};

// 'https://github.com/ltsdw/gofile-downloader/blob/main/gofile-downloader.py';
const goFileDownloader = async (
  gofileLink,
  animeName,
  currentLength,
  postLength
) => {
  for (let retryCount = 0; retryCount < MAX_RETRIES; retryCount++) {
    try {
      const token = await getToken();
      const password = await genPass('jembutKadal#4231');
      const parsedUrl = new URL(gofileLink);
      const pathSegments = parsedUrl.pathname.split('/');
      const fileId = pathSegments[pathSegments.length - 1];
      const cwd = process.cwd();
      const downloadDir = path.join(cwd, 'download', animeName);

      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      const urlGetContent = `https://api.gofile.io/getContent?contentId=${fileId}&token=${token}&websiteToken=7fd94ds12fds4&cache=true`;
      const r = await axios.get(urlGetContent);
      const contents = r.data.data.contents;

      for (let dynamicKey in contents) {
        const contentData = contents[dynamicKey];

        const downloadLink = contentData.link;
        const fileName = contentData.name;
        const filePath = path.join(cwd, 'download', animeName, fileName);

        await downloader(
          downloadLink,
          token,
          filePath,
          currentLength,
          postLength
        );
        break;
      }

      return;
    } catch (error) {
      console.log(`Error in goFileDownloader: ${error.message}`);
      if (retryCount < MAX_RETRIES - 1) {
        console.log(`Retrying... Attempt ${retryCount + 2}`);
      }
    }
  }

  console.log('Max retries reached. Unable to download Gofile link.');
  return null;
};
export default goFileDownloader;
