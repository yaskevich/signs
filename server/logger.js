// import { workerData, parentPort } from 'worker_threads';
import { workerData } from 'worker_threads';
// import { setTimeout } from 'timers/promises';
import parser from 'ua-parser-js';
import whoiser from 'whoiser';
import db from './db.js';

let ipId;
const wd = workerData;
const ip = (wd.ip === '::1' || wd.ip === '127.0.0.1') ? null : wd.ip;

if (ip) {
  const result = await db.getIpData(ip);
  ipId = result?.id;
  if (!ipId) {
    const whois = await whoiser(ip);
    const res = await db.addIpData(ip, whois);
    ipId = res?.id;
  }
}

const browser = wd?.ua ? parser(wd.ua) : null;
// console.log(wd.thread_count);
// console.log('worker', wd);
// await setTimeout(5000, 'resolved');
// console.log('done in worker');
await db.writeToLog([wd.now, wd.id, ipId, wd.ua, browser, wd.event, wd.data]);
// parentPort.postMessage(counter);
