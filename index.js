const { Client } = require('@opensearch-project/opensearch');
const BluebirdPromise = require('bluebird');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const { DynamoDB } = require('aws-sdk');
const webPush = require('web-push');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const app = express();
const port = 5001;
// app.use(express.bodyParser());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});


function validate(payload, token) {
  const payloadData = JSON.stringify(payload);
  const receivedSignature = token;
  const accessToken = '7f16d898f3d3d54dc87f7f4d8e71f83d';
  // Step 1: Encode the body (payload) and access token in UTF-8
  const utf8Body = new TextEncoder().encode(payloadData);
  const utf8AccessToken = new TextEncoder().encode(accessToken);

  // Step 2: Recreate the HMAC SHA256 hash using the access token
  const hmac = crypto.createHmac('sha256', utf8AccessToken);
  hmac.update(utf8Body);
  const hashedData = hmac.digest();

  // Step 3: Convert the hashed data to Base64
  const generatedSignature = hashedData.toString('base64');
  console.log('generatedSignature', generatedSignature);

  // Step 4: Compare the generated signature with the received one
  return generatedSignature === receivedSignature;
}
app.post('/validate_signature', bodyParser.json(), async (req, res) => {
  // Compute HMAC SHA-256 hash
  console.log('req.rawBody', typeof req.body);
  const signature = req.headers['x-hub-signature-256'];
  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', '7f16d898f3d3d54dc87f7f4d8e71f83d')
      .update(JSON.stringify(req.body))
      .digest('hex');
  if (
    !crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  ) {
    return res.status(403).send('Invalid signature');
  }
  console.log('Webhook validated successfully!');
  res.status(200).send('Webhook received');
});

app.post('/whatsapp', bodyParser.json(), async (req, res) => {
  console.log('in coming whatsapp webhook');
  console.log('request body', JSON.stringify(req.body));
  req.body?.entry?.forEach((e) => {
    e?.changes?.forEach((c) => console.log('change', c));
  });
  console.log('request header', req.headers);
  console.log('end of request');
  res.json({ text: 'OK' });
});

app.get('/whatsapp', async (req, res) => {
  const params = req.query;
  console.log('params', params);
  if (
    params['hub.mode'] !== 'subscribe' ||
    params['hub.verify_token'] !== 'b1zecho@2025'
  ) {
    res.status(400);
  }
  res.send(params['hub.challenge']);
});

app.post('/test-whatsapp', bodyParser.json(), async (req, res) => {
  console.log('in coming request', JSON.stringify(req.body));
  // res.status(400).json({
  //   error: {
  //     message:
  //       "(#131058) Hello World templates can only be sent from the Public Test Numbers",
  //     type: "OAuthException",
  //     code: 131058,
  //     fbtrace_id: "Akr-A5aq07MjQSibnD5BPBo",
  //   },
  // });
  setTimeout(() => {
    res.json({
      messaging_product: 'whatsapp',
      contacts: [
        {
          input: req.body.to,
          wa_id: req.body.to,
        },
      ],
      messages: [
        {
          id: `${req.body.to}_${crypto.randomUUID()}`,
          message_status: 'accepted',
        },
      ],
    });
  }, 1000);
});
