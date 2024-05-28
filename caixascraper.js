const puppeteer = require('puppeteer')
const fs = require('fs-extra')
const mkdirp = require('mkdirp')
const path = require('path')
const { v4: uuid } = require('uuid')
const moment = require('moment')
const os = require('os')

const stepLogin = async (page, options) => {
  // Open homepage and fill account info
  console.log('Configuring user-agent...')
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36')
  await page.waitForTimeout(300)
  console.log('Opening bank homepage...')
  console.debug('Caixa Econômica url:', options.caixa.url)
  await page.goto(options.caixa.url)
  await stepAwaitRegularLoading(page)
  console.log('Homepage loaded.')
  await page.type('#nomeUsuario', options.user)
  await page.click('#btnLogin', { delay: 300 })
  console.log('Account username has been filled.')
  await stepAwaitRegularLoading(page)
  await page.waitForTimeout(500)
  await page.click('#lnkInitials', { delay: 300 })
  console.log('Account initials has been selected.')
  await stepAwaitRegularLoading(page)
  await page.waitForTimeout(500)
  console.log('Opening password page...')
  await fillPassword(page, options.password)
  await page.waitForTimeout(1000);
  await page.click('#btnConfirmar', { delay: 300 })
  console.log('Password has been filled...login...')
  await stepAwaitRegularLoading(page)
  await page.waitForSelector('#pesquisa', { visible: true, timeout: 3000 });
  console.log('Logged!')
}

const stepExport = async (page, options) => {
  console.log('Opening statement page...')
  // Go to statement page

  await page.waitForTimeout(1500);
  await page.type('#pesquisa', 'Extrato');
  await page.waitForTimeout(500);

  const list = await page.$$('ul.ui-autocomplete a');
  let fnd = false;
  for (const item of list) {
    const text = await page.evaluate(element => element.textContent, item);
    if (text == 'MINHA CONTA > Conta > Extrato') {
      item.click();
      await stepAwaitRegularLoading(page);
      fnd = true;
      console.log('Menu item selected.')
      break;
    }
  }
  if (!fnd) {
    throw new Error('Menu item not found');
  }

  await page.waitForSelector('#geraArquivoExtrato', { timeout: 3000 });
  await page.click('#geraArquivoExtrato', { delay: 300 });
  // await page.evaluate(() => document.querySelector('#geraArquivoExtrato').click());
  await stepAwaitRegularLoading(page);
  await page.waitForTimeout(1500);

  if (!!options.month) {
    console.log('Selecting month...', options.month);
    await page.evaluate(() => document.querySelector('label[for="rdoTipoExtratoOutro"]').childNodes[0].click());
    await page.waitForTimeout(300);

    const months = await page.$$('#dk_container_sltOutroMes li a');
    let fndMonth = false;
    for (const item of months) {
      const text = await page.evaluate(element => element.innerText, item);
      if (text.toLowerCase() == options.month.toLowerCase()) {
        // item.click();
        await page.evaluate(element => element.click(), item);
        fndMonth = true;
        console.log('Month selected.')
        break;
      }
    }
    if (!fndMonth) {
      throw new Error('Month not found on list');
    }
  }

  switch (options.file_format) {
    case 'txt':
      await page.evaluate(() => document.querySelector('#rdoFormatoArquivoTxt').click());
      break;
    case 'ofx':
      await page.evaluate(() => document.querySelector('#rdoFormatoArquivoOfx').click());
      break;
    case 'ofc':
      await page.evaluate(() => document.querySelector('#rdoFormatoArquivoOfc').click());
      break;
  }

  await page.waitForTimeout(500);
  await page.click('#confirma', { delay: 300 });


  // configure Download Trigger
  let triggerDownload = () => { Confirma(); }// eslint-disable-line

  const finalFilePath = path.resolve(
    options.download.path,
    options.download.filename.interpolate({
      month: !!options.month ? options.month.toLowerCase().replace('/', '-') : 'current',
      timestamp: moment().unix()
    })
  )

  console.log('Starting download...')
  const finalFilePathWithExtension = await download(page, triggerDownload, finalFilePath)
  console.log('Download has been finished.')
  console.log('Export document final path: ', finalFilePathWithExtension)
}

const stepAwaitRegularLoading = async (page) => {
  await page.waitForSelector('div.modalBgLoading', { visible: true, timeout: 3000 })
  await page.waitForSelector('div.modalBgLoading', { hidden: true })
}

const fillPassword = async (page, password) => {
  const keys = await page.$$('ul.tc-conteudo li')
  const isUpperCase = (str) => str === str.toUpperCase();

  const locateAndClick = async (digit) => {
    const keyUpperCase = (await page.evaluate(element => element.style.textTransform, keys[0])) === 'uppercase';
    const digitUpperCase = isUpperCase(digit);

    if (keyUpperCase !== digitUpperCase) {
      await page.click('ul.tc-conteudo li#caps', { delay: 300 });
      await page.waitForTimeout(500)
    }

    for (const key of keys) {
      const text = await page.evaluate(element => element.textContent, key)
      if (text === digit.toString().toLowerCase()) {
        await page.evaluate(element => element.click(), key);
        await page.waitForTimeout(500)
        return true;
      }
    }
    return false;
  };

  for (let i = 0; i < password.length; i++) {
    const digit = password[i];
    const fnd = await locateAndClick(digit);
    if (!fnd) {
      throw new Error('Password digit not found');
    }
  }

  await page.waitForTimeout(500)
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const download = async (page, triggerDownload, finalFilePath) => {
  const downloadPath = path.resolve(os.tmpdir(), 'download', uuid())
  mkdirp(downloadPath)
  console.log('Temporary downloading file to:', downloadPath)
  await page._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath })

  await page.evaluate(triggerDownload)

  const filename = await waitForFileToDownload(downloadPath)
  const tempFilePath = path.resolve(downloadPath, filename)
  const extension = path.extname(tempFilePath)

  finalFilePath += extension

  console.log('Moving file to final path.')
  await fs.moveSync(tempFilePath, finalFilePath)

  return finalFilePath
}

const waitForFileToDownload = async (downloadPath) => {
  console.log('Waiting to download file...')
  let filename
  while (!filename || filename.endsWith('.crdownload')) {
    filename = fs.readdirSync(downloadPath)[0]
    await sleep(500)
  }
  return filename
}

const scraper = async (options) => {
  console.log('Starting Caixa Econômica scraper...')
  console.log('Account Username:', options.user)
  console.log('Transaction log month:', options.month || 'Current')
  console.log('File Format:', options.file_format)

  console.debug('Puppeter - options', options.puppeteer)
  const browser = await puppeteer.launch(options.puppeteer)

  const page = await browser.newPage()
  console.debug('Viewport - options', options.viewport)
  page.setViewport(options.viewport)

  await stepLogin(page, options)
  await stepExport(page, options)

  await browser.close()

  console.log('Caixa Econômica scraper finished.')
}

/* eslint-disable */
String.prototype.interpolate = function (params) {
  const names = Object.keys(params)
  const vals = Object.values(params)
  return new Function(...names, `return \`${this}\`;`)(...vals)
}
/* eslint-enable */

module.exports = scraper
