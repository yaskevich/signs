import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import fs from 'fs';
import { exit } from 'process';
import db from '../db.js';

// const tgOptions = {
//   id: process.env.API_ID,
//   hash: process.env.API_HASH,
//   session: process.env.SESSION,
//   groupId: process.env.GROUP_ID,
//   groupName: process.env.GROUP_NAME,
//   retries: process.env.TELEGRAM_RETRIES || 5
// };

const sync = async () => {
  // const { groupId, groupName } = params;
  const settings = await db.getSettings();
  const session = process.env.SESSION;
  const stringSession = new StringSession(session);
  const { telegram_api_id: apiId, telegram_api_hash: apiHash } = settings;
  console.log(settings);
  const client = new TelegramClient(stringSession, Number(apiId), apiHash, { connectionRetries: 5 });
  // client.setLogLevel("warn"); // warnings too
  // exit();
  await client.connect();

  if (await client.isUserAuthorized()) {
    console.log('connected');
  } else {
    console.log('get code');
    // await client.start({
    //   phoneNumber: async () => await input.text('number ?'),
    //   password: async () => await input.text('password?'),
    //   phoneCode: async () => await input.text('Code ?'),
    //   onError: (err) => console.log(err),
    // });

    const result = await client.sendCode({ apiId: Number(apiId), apiHash, }, process.env.PHONE,);
    // { phoneCodeHash: '01234566regdsv', isCodeViaApp: true }
    // const phoneCodeHash = result.phoneCodeHash;
    console.log(result);
    // https://github.com/gram-js/gramjs/blob/3c5abfd647e2eaaf6f422b43711b20477d2806fa/examples/expressExample/lowLevel.js
    // try {
    //   await client.invoke(
    //     new Api.auth.SignIn({
    //       phoneNumber: phone,
    //       phoneCodeHash,
    //       phoneCode: req.body.code,
    //     })
    //   );
    // } catch (err) {
    //   console.error(err);
    //   // if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
    //   //   return res.send(BASE_TEMPLATE.replace('{{0}}', PASSWORD_FORM));
    //   // }
    // }

    // console.log('You should now be connected.');
    // console.log(client.session.save()); // Save this string to avoid logging in again
    // await client.sendMessage('me', { message: 'SYNC' });
  }

  // const dialogs = await client.getDialogs();
  // const group = dialogs.find((x) => x.title === groupName);
  // console.log(
  //   group.title,
  //   group.id?.value,
  //   group.dialog.topMessage,
  //   group.unreadCount,
  //   group.date,
  //   group.entity.participantsCount
  // );
  // // group.entity = ID
  // // BigInt
  // // const userNum = group.entity.participantsCount;

  // const users = await client.getParticipants(groupId, {
  //   // limit: userNum,
  // });
  // console.log('user count', users.length);
  // /* eslint-disable-next-line no-restricted-syntax */
  // for (const user of users) {
  //   /* eslint-disable no-await-in-loop */
  //   await db.addTelegramChat(user.className.toLowerCase(), user.id?.value, user.username, user.firstName, user.lastName);
  // }

  // exit;
  /* eslint-disable-next-line no-restricted-syntax */
  // for (const msg of await client.getMessages(groupId, { limit: 1 })) {
  // console.log(JSON.stringify(msg));
  // const buffer = await client.downloadMedia(msg.media, {
  //   workers: 1,
  // });
  //   fs.writeFileSync("kek.jpg", buffer);
  // }

  // console.log(users);

  await client.disconnect();
  console.log('disconnected');
  process.exit();
};

export default {
  sync,
};
