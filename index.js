const { Client } = require("@opensearch-project/opensearch");
const BluebirdPromise = require("bluebird");
const { AwsSigv4Signer } = require("@opensearch-project/opensearch/aws");
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");

const { DynamoDB } = require("aws-sdk");
const webPush = require("web-push");
const axios = require("axios");
const https = require("https");
const fs = require("fs");
const app = express();
const port = 5001;
// app.use(express.bodyParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/index", async (req, res) => {
  const index = await getClient().indices.exists({
    index: "opensearch_dashboards_sample_data_ecommerce",
  });
  res.json({ index: index.body });
});

app.post("/new", async (req, res) => {
  getClient().reindex({});
  const result = await getClient().index({
    index: "movies_v3",
    body: matterWithCompanyDetails,
  });
  console.log("result is here", result);
  res.json({ result: result.body });
});

async function createDocument(doc) {
  const result = await getClient().index({ index: "movies", body: doc });
  return result.body;
}

function extractKeys(source, keys) {
  const result = {};
  keys.forEach((key) => {
    result[key] = source[key];
  });
  // console.log('result',result)
  return result;
}

app.post("/bulk", async (req, res) => {
  const number = Math.floor(Math.random() * (4000 - 1000 + 1000) + 1000);
  console.log(number);
  const array = Array.from(Array(number).keys());
  const users = array.map((u) => ({
    name: u.toString(),
    surname: u.toString(),
    dob: undefined,
  }));
  const putData = data.map((d) => d._source);
  const usersPromise = putData.map(async (u) => {
    // const dataToAdd = extractKeys(u, ['keys','name']);
    // console.log('dataToAdd',dataToAdd)
    return createDocument(u);
  });
  const result = await BluebirdPromise.map(
    usersPromise,
    (usersPromise) => usersPromise,
    { concurrency: 5 }
  );
  console.log("result is here", result.length);
  res.json({ result: result.body });
});

app.put("/edit", async (req, res) => {
  const update = await getClient().index({
    index: "users",
    id: "-wXIf4sBL8-oQ1gUiaoD",
    body: { name: "Sangram", surname: "Thakur" },
  });
  res.json({ result: update.body });
});

const removeEmptyStrings = (obj) => {
  const cleanedObj = {};

  Object.keys(obj).forEach((key) => {
    if (obj.hasOwnProperty(key)) {
      cleanedObj[key] = obj[key] === "" ? undefined : obj[key];
    }
  });

  return cleanedObj;
};

const parseRecord = (record) => {
  if (!record.dynamodb?.NewImage) {
    throw new Error("Invalid DynamoDBRecord");
  }
  let data = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);

  data = removeEmptyStrings(data);
  return data;
};

app.post("/stream", async (req, res) => {
  const updateMatters = [];
  Records.forEach(async (record) => {
    // let matter = parseRecord(record);
    // const { id } = matter;
    // if (record.eventName === "REMOVE") {
    //   await getClient().delete({ id, index: "cases" });
    //   return;
    // }

    const { createdAt, updatedAt, ...rest } = matterWithCompanyDetails;

    matter = {
      ...rest,
      createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : undefined,
    };

    updateMatters.push(matter);
  });

  const usersPromise = updateMatters.map(async (u) => createDocument(u));
  const result = await BluebirdPromise.map(
    usersPromise,
    (usersPromise) => usersPromise,
    { concurrency: 2 }
  );

  res.json(result);
});
app.get("/get-index", async (req, res) => {
  const result = await getClient().indices.get({ index: "movies" });
  const mapping = await getClient().indices.getMapping({ index: "movies" });
  res.json({ body: result.body, mapping: mapping.body });
});
app.post("/update-index", async (req, res) => {
  const result = await getClient().indices.putMapping({
    index: "movies",
    body: {
      properties: {
        testAT: { type: "date" },
      },
    },
  });
  console.log("result", result);
  res.json(result);
});
app.post("/create-index", async (req, res) => {
  const result = await getClient().indices.create({
    index: "movies_v2",
    body: {
      mappings: {
        properties: {
          id: { type: "text" },
          annualFeeReviewDate: { type: "text" },
          commentExternal: { type: "text" },
          commentInternal: { type: "text" },
          companyToBeInvoiced: { type: "text" },
          costCenter: { type: "text" },
          countryForWhichServiceIsSought: { type: "text" },
          countryForWhichServicesAreSought: { type: "text" },
          createdAt: { type: "date" },
          currentMMId: { type: "text" },
          employingCompany: { type: "text" },
          expiryRemark: { type: "text" },
          group: { type: "text" },
          individual: { type: "text" },
          isCompanyMatter: { type: "text" },
          isCompanySponsored: { type: "text" },
          isLegacy: { type: "boolean" },
          jobDetails: {
            type: "object",
            properties: {
              jobTitle: { type: "text" },
              classification: { type: "text" },
              designation: { type: "text" },
              location: { type: "text" },
              currentVisa: { type: "text" },
              currentVisaExpiry: { type: "text" },
              familyMember: { type: "text" },
              businessName: { type: "text" },
            },
          },
          leadUsername: { type: "text" },
          nextActionComment: { type: "text" },
          nextActionDate: { type: "date" },
          nextReviewDate: { type: "date" },
          nextReviewDateComment: { type: "text" },
          progress: { type: "text" },
          selectedServices: {
            type: "nested",
            properties: {
              name: { type: "text" },
              trn: { type: "text" },
              details: {
                type: "nested",
                properties: {
                  type: { type: "text" },
                  dateOfApplication: { type: "text" },
                },
              },
            },
          },
          targetDate: { type: "date" },
          team: { type: "text" },
          toBeTracked: { type: "text" },
          amountHeld: { type: "float" },
          currencyIso: { type: "text" },
          expectedDateOfNextInvoice: { type: "date" },
          expectedFeesOfNextInvoice: { type: "float" },
          expectedFeesOfNextInvoiceInSelectedCurrency: { type: "float" },
          invoices: {
            type: "nested",
            properties: {
              id: { type: "text" },
              status: { type: "text" },
              instructions: { type: "text" },
            },
          },
          totalAmount: { type: "float" },
          totalAmountInSelectedCurrency: { type: "float" },
          totalInvoicedAmount: { type: "float" },
          SponsorCompanyName: { type: "text" },
          CompanyName: { type: "text" },
          ApplicantGivenNames: { type: "text" },
          ApplicantSurname: { type: "text" },
          individualDetails: {
            type: "object",
            properties: {
              id: { type: "text" },
              lastName: { type: "text" },
              firstName: { type: "text" },
            },
          },
          companyDetails: {
            type: "object",
            properties: {
              id: { type: "text" },
              legalCompanyName: { type: "text" },
            },
          },
        },
      },
    },
  });

  console.log("result", result);
  res.json(result);
});

function validate(payload, token) {
  const payloadData = JSON.stringify(payload);
  const receivedSignature = token;
  const accessToken = "access_token";
  // Step 1: Encode the body (payload) and access token in UTF-8
  const utf8Body = new TextEncoder().encode(payloadData);
  const utf8AccessToken = new TextEncoder().encode(accessToken);

  // Step 2: Recreate the HMAC SHA256 hash using the access token
  const hmac = crypto.createHmac("sha256", utf8AccessToken);
  hmac.update(utf8Body);
  const hashedData = hmac.digest();

  // Step 3: Convert the hashed data to Base64
  const generatedSignature = hashedData.toString("base64");
  console.log("generatedSignature", generatedSignature);

  // Step 4: Compare the generated signature with the received one
  return generatedSignature === receivedSignature;
}

app.post("/whatsapp", bodyParser.json(), async (req, res) => {
  console.log("in coming whatsapp webhook");
  console.log("request body", JSON.stringify(req.body));
  req.body?.entry?.forEach((e) => {
    e?.changes?.forEach((c) => console.log("change", c));
  });
  console.log("request header", req.headers);
  console.log("end of request");
  res.json({ text: "OK" });
});

app.get("/whatsapp", async (req, res) => {
  const params = req.query;
  console.log("params", params);
  if(params["hub.mode"] !== "subscribe" || params["hub.verify_token"] !== "b1zecho@2025" ){
    res.status(400)
  }
  res.send(params["hub.challenge"]);
});

app.post("/test-whatsapp", bodyParser.json(), async (req, res) => {
  console.log("in coming request", JSON.stringify(req.body));
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
      messaging_product: "whatsapp",
      contacts: [
        {
          input: req.body.to,
          wa_id: req.body.to,
        },
      ],
      messages: [
        {
          id: "wamid.HBgMOTE5MDI4NDYxMzA5FQIAERgSNkMzMkIzNzQ2NDQ1MzZEOUMxAA==",
          message_status: "accepted",
        },
      ],
    });
  }, 5000);
});
