# Signs
Platform for collecting and managing visual text-based content (protest/picket signs, billboards, signboards, graffiti etc.) – everything that is related to symbolic communication in a society. Conceptually, it is a tool for building corpus of microtexts.

It uses Telegram as a tool for crowd-sourcing and preannotating data which later are annotated in *Signs* interface.

It contains:
- parser (extracts data from the Telegram chat), written in Python 3
- server (provides API to access data, serves assets), written in JavaScript (NodeJS)
- client (functions as user interface to all the data), written in JavaScript (Vue 3)

Requirements to run importing and build and deploy client and server:
- PostgreSQL 9.6+
- NodeJS 12+
- Python 3.6+

Linux may be not a requirement, but deployment was tested on Ubuntu 18.04, other platforms may not have pre-built binaries of specific NodeJS/Python packages.

It is recommended to run the application behind a web proxy, such as Apache or Nginx.
