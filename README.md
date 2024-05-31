# Caixa Econômica Scraper
Download Caixa Econômica exportable files using node and Puppeteer.

Project inspired by the beautiful [itauscraper](https://github.com/viniciusgava/itauscraper).

Available file formats:
- TXT - It's a CSV with semi-colon *(DEFAULT)*
- OFX - Money 2000
- OFC 1.0 - Money 1995 a Money 1999

## Prerequisites
- You should have Warsaw (Guardião) installed and working.
- You have to activate the Browser via ATM or Mobile App.

## Usage
```bash
node run.js --user=ABCDEFG --password=xxxxxx --month Janeiro/2024
```

## Help
```text
Usage: node run.js [options]

Opções:
      --help         Exibe ajuda                                      [booleano]
      --version      Exibe a versão                                   [booleano]
  -u, --user         Caixa Ecônomica username, format: AAAAXXXX    [obrigatório]
  -p, --password     Caixa Econômica digital password (8 digits)
                                                          [string] [obrigatório]
  -m, --month        Month to export (MMMM/YYYY, Ie. Janeiro/2024)      [string]
  -f, --file_format  File format to export
                                   [opções: "txt", "ofx", "ofc"] [padrão: "txt"]
      --node_env     Node environment
          [opções: "development", "production", "docker"] [padrão: "production"]
```

## Links
- [GitHub](https://github.com/ludufre/caixascraper)
