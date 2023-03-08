# SIGNS

## 🔬 meme study platform 🧮 computational memology ❤️ digital semiotics 📸

Platform for collecting and managing **visual** (image-based) text content &mdash; everything that is related to language-alike symbolic communication in a society. Conceptually, it is a tool for building a **corpus of microtexts**.
<!-- (protest/picket signs, billboards, signboards, graffiti etc.) -->

The term *corpus* means that we deal with a *unit* (object) in its *context* (surroundings) via encoding all the information by means of *annotation* (formalized description stored separately).

The tool can be of use for research in such disciplines as **linguistics**, **history**, **cultural anthropology**, **social studies**, **semiotics** etc.

### Status

**Beta / Work In Progress** [March 2023]

The code base is still in **experimental** phase and it is being redesigned during development and testing. However, the platform is used for ongoing processing of real-world data for research purposes. Actually, the research drives the development of the platform.

### Project structure

[Telegram](https://telegram.org/) can be used as a tool for crowd-sourcing data (and adding minimal meta-information) that later are annotated via user interface of the platform.

Since January 2023 regular UI for direct uploading of images is available. That makes Telegram an optional data source.

#### Components

- server (provides API to access data, serves assets), written in JavaScript (NodeJS)
- client (functions as user interface to all the data), written in JavaScript (Vue 3)
- parser (extracts data from a Telegram chat), written in Python 3

#### Current development goals

- make interface more universal than dataset-specific
- test installing procedure (currently, it could be done only with manual intervention), make it completely automatized
- ~~implement user authentication and related functions~~
- remove Python code replacing it with JavaScript
- implement connectors for other data sources (Google Drive?)

| Requirements                    | OS    | NodeJS | PostgreSQL | Python |
| ------------------------------- | ----- | ------ | ---------- |--------|
| Minimal setup                   | *any* | 14     | 10         | 3.6    |
| Development setup (recommended) | Linux | 18     | 15         | 3.10   |

### Deployment

The example setup script is in [deploy.sh](/deploy.sh). However, as for now, it allows only update installed instance. For setting up, one has to make following steps:

1. create PostgreSQL user and database
2. provide environmental variables (via `.env` file): create `signs.env` in your working directory (see an example below)
3. download the deployment script ([deploy.sh](/deploy.sh)) into your working directory and run it 
4. go to `signs` directory and run Telegram importing script ([telegram-import.py](/server/telegram-import.py))

It is recommended to run the application behind a web proxy, such as Apache or Nginx. As well in production environment one should use rather a process manager, than a bare NodeJS instance. I recommend [PM2](https://pm2.keymetrics.io), there is a [config file](/server/ecosystem.config.cjs) for it. Also, one can pass the environmental variables in any other manner: via Docker config, via PM2 config, etc.

##### Interaction with Telegram

[Getting API ID and API Hash](https://gram.js.org/getting-started/authorization)

##### Environmental variables sample

```Shell
# PostgreSQL user
PGUSER=database_user
# PostgreSQL host (IP or hostname)
PGHOST=127.0.0.1
# PostgreSQL password
PGPASSWORD=.................
# PostgreSQL database
PGDATABASE=database_signs
# PostgreSQL port
PGPORT=5432
# Application port
# If not set, default value is used (8080)
PORT=8080
# Telegram API ID 
API_ID=.....................
# Telegram API Hash
API_HASH=...................
# Telegram Group ID
GROUP_ID=...................
```





:space_invader:
