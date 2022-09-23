# Signs
Platform for collecting and managing visual text-based content (protest/picket signs, billboards, signboards, graffiti etc.) – everything that is related to symbolic communication in a society. Conceptually, it is a tool for building a **corpus of microtexts**.

### Status 

`Alpha / Work In Progress` [September 2022]

The code base is still in **experimental** phase and it is being redesigned during development and testing. However, the platform is used for ongoing processing of real-world dataset. Actually, a real research drives the development of the platform.

### Project structure

[Telegram](https://telegram.org/) is used as a tool for crowd-sourcing and preannotating data that later are annotated via user interface of the platform.

#### Components

- parser (extracts data from the Telegram chat), written in Python 3
- server (provides API to access data, serves assets), written in JavaScript (NodeJS)
- client (functions as user interface to all the data), written in JavaScript (Vue 3)

#### Current development goals

- make interface more universal than dataset-specific
- test installing procedure (currently, it may require manual intervention), make it completely automatized
- implement user authentication and related functions
- remove Python code replacing it with JavaScript

### Requirements
- PostgreSQL 9.6+
- NodeJS 12+
- Python 3.6+

The platform was tested only in Linux environment.

It is recommended to run the application behind a web proxy, such as Apache or Nginx.

:space_invader:
