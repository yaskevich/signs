/* eslint-disable */
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
// import input from 'input'; // npm i input
import fs from 'fs';
import { exit } from 'process';

const apiId = process.env.API_ID;
const apiHash = process.env.API_HASH;
const connectionRetries = 5;
const stringSession = new StringSession(process.env.SESSION);

const groupId = process.env.GROUP_ID;
const groupName = process.env.GROUP_NAME;

// console.log(apiId, apiHash);
const sync = async (params) => {
  const client = new TelegramClient(stringSession, Number(apiId), apiHash, { connectionRetries });
  await client.connect();
  // client.setLogLevel("warn"); // warnings too
  // await client.start();
  // await client.sendMessage('me', { message: 'Hello!' });

  // await client.start({
  //   phoneNumber,
  //   password: async () => await input.text('Please enter your password: '),
  //   phoneCode: async () => await input.text('Please enter the code you received: '),
  //   onError: (err) => console.log(err),
  // });

  // console.log(client.session.save()); // Save this string to avoid logging in again
  // await client.sendMessage('me', { message: 'Hello!' });

  // await client.start({
  //   phoneNumber: phone,
  //   password: async () => await input.text('Please enter your password: '),
  //   phoneCode: async () => await input.text('Please enter the code you received: '),
  //   onError: (err) => console.log(err),
  // });

  // console.log(client.session.save()); // Save this string to avoid logging in again
  // await client.sendMessage('me', { message: 'Hello!' });
  // await client.isUserAuthorized()

  // for (const user in users) {
  //   console.log(user.userId);
  // }

  const dialogs = await client.getDialogs();
  const group = dialogs.find(x => x.title === groupName);
  console.log(
    group.title,
    group.id?.value,
    group.dialog.topMessage,
    group.unreadCount,
    group.date,
    group.entity.participantsCount
  );
  const userNum = group.entity.participantsCount;

  const users = await client.getParticipants(BigInt(groupId), {
    limit: userNum,
  });

  console.log(users);

  exit;

  // for (const msg of await client.getMessages(group.entity, { limit: 1 })) {
  //   console.log(JSON.stringify(msg));
  //   const buffer = await client.downloadMedia(msg.media, {
  //     workers: 1,
  //   });
  //   //   fs.writeFileSync("kek.jpg", buffer);
  // }

  // const participants = client.iterParticipants(BigInt(groupId), {
  //   limit: 1,
  // });
  // for await (const participant of participants) {
  //   // console.log("participant is", participant); // this line is very verbose but helpful for debugging
  //   console.log(participant, participant.firstName,participant.username);
  // }

  // console.log(users);

  await client.disconnect();
  process.exit();
};

export default {
  test,
};
