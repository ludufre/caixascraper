# Caixa Econômica Scraper
Download Caixa Econômica exportable files using node and Puppeteer.

Project inspired by the beautiful [itauscraper](https://github.com/viniciusgava/itauscraper).

Available file formats:
- TXT - It's a CSV with semi-colon *(DEFAULT)*
- OFX - Money 2000
- OFC 1.0 - Money 1995 a Money 1999

## Usage
```bash
node run.js --user=ABCDEFG --password=xxxxxx --month Janeiro/2024
```

## Usage - Docker
1. Download this seccomp for chrome on docker. It will be used in the docker run:
```bash
wget https://raw.githubusercontent.com/jessfraz/dotfiles/master/etc/docker/seccomp/chrome.json
```

2. Execute:
```bash
docker run -v $(pwd):/home/node/caixascraper/download \
    -rm \
    -u $UID:$GID \ 
    --security-opt seccomp=./chrome.json \
    -e USER='ABCDEFG' \
    -e PASSWORD='xxxxxx' \
    -e MONTH='Janeiro/2024' \
    ludufre/caixascraper:latest 
```
### Details about the dockerfile
This dockerfile has several fixes to be able to executed headless and safe. 
If you wanna know more, check the links bellow:
- fixuid to fix user privileges inside the container when using volumes: 
  - https://github.com/boxboat/fixuid
- fixing user privileges to enable sandbox and keep safety:
  - https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker
  - https://stackoverflow.com/a/62383642
  - https://github.com/jessfraz/dockerfiles/issues/65

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

## Crontab
1. Create bash like this:
````bash
#!/bin/bash
SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"

# print current date for debuging proposes
date

# try 5 times
n=0
until [ $n -ge 2 ]
do
    echo "trying $n"
    /usr/bin/docker run -v $SCRIPTPATH/download:/home/node/caixascrapper/download \ 
    --env-file "$SCRIPTPATH/env-configs" \
    --rm \
    -u $UID:$GID \
    --security-opt seccomp=./chrome.json \
    ludufre/caixascraper:latest 2>&1 && break
    n=$[$n+1]
    sleep 15
done
````
**Mac tip:** You must pass docker full path to works at crontab
``/usr/local/bin/docker``

2. add all env variables at ``env-configs``.
Example:
 ```bash
USER=ABCDEFG
PASSWORD=xxxxx
MONTH=Janeiro/2024
```
**DO NOT** use quotation to define values on env files.

3. run ``crontab -e`` and add the follow cron.
Example:
````bash
0 */4 * * * sh /home/username/automate/caixascraper/run.sh  >> /home/username/automate/caixascraper/log.log
````
The example bellow runs every 4 hours of everyday 

You can generate a different crontab config on [https://crontab-generator.org](https://crontab-generator.org)

## Links
- [GitHub](https://github.com/ludufre/caixascraper)
- [Docker Hub](https://hub.docker.com/r/ludufre/caixascraper)
