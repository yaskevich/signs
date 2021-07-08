# Signs
Platform for collecting and managing visual text-based content (protest/picket signs, billboards, signboards, graffiti etc.) – everything that is related to symbolic communication in a society. Conceptually, it is a tool for building corpus of microtexts.

It uses Telegram as a tool for crowd-sourcing and preannotating data which later are annotated in *Signs* interface.

It contains:
- parser (extracts data from the Telegram chat), written in Python 3
- server (provides API to access data, serves assets), written in JavaScript (NodeJS)
- client (functions as user interface to all the data), written in JavaScript (Vue 3)
