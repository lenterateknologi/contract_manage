const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store puppeteer browser cache in /var/www/contract_manage/.puppeteer_cache (on /dev/sda5 with plenty of space)
  cacheDirectory: join(__dirname, '.puppeteer_cache'),
};
