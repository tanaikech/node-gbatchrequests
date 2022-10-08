# node-gbatchrequests

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENCE)

<a name="top"></a>

# Overview

This is a Node.js module to run the batch requests of Google APIs.

# Description

In Google APIs, there are APIs where batch requests can be run. The batch requests can run multiple API calls by one API call with the asynchronous process. By this, both the process cost and the quota cost can be reduced. [Ref](https://cloud.google.com/blog/topics/developers-practitioners/efficient-file-management-using-batch-requests-google-apps-script) In Node.js, the wonderful module of googleapis for Node.js is existing. But, in the current stage, unfortunately, it seems that the googleapis for Node.js cannot run the batch requests. [Ref](https://github.com/googleapis/google-api-nodejs-client/issues/2375) So, I created this module. This module can achieve batch requests with Node.js. In order to run batch requests, the access token retrieved from googleapis for Node.js can be used.

# Install

```bash
$ npm install --save-dev gbatchrequests
```

or

```bash
$ npm install --global gbatchrequests
```

You can also see this module at [https://www.npmjs.com/package/gbatchrequests](https://www.npmjs.com/package/gbatchrequests).

# Method

| Method                               | Explanation                        |
| :----------------------------------- | :--------------------------------- |
| [`RunBatch(obj)`](#runbatch)         | Run batch requests of Google APIs. |
| [`GetBatchPath(obj)`](#getbatchpath) | Get batch path.                    |

This library uses [HTTPS](https://nodejs.org/api/https.html) for requesting Google APIs.

# Usage

About the authorization, please check the section of [Authorization](#authorization).

## Scopes

This library requests your inputted requests as batch requests. So, the requirement scopes depend on the Google APIs you want to use. So, please check the official document of the API you want to use.

<a name="runbatch"></a>

## 1. RunBatch(obj)

This is the main method of this library. This method runs the batch requests of Google APIs.

### Sample script

This is a sample script for changing the filename of a file on Google Drive using batch requests.

```javascript
const { RunBatch } = require("gbatchrequests");

const fileId = "###"; // Please set the file ID.
const obj = {
  accessToken: "###", // Please set your access token.
  api: { name: "drive", version: "v3" },
  requests: [
    {
      method: "PATCH",
      endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}`,
      requestBody: { name: "sample" },
    },
  ],
};
RunBatch(obj)
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

- `accessToken`: (Required) Your access token. In this case, please include the scopes you want to use.
- `api: { name: "###", version: "###" }`: (Required) Please set the API name and the API version you want to use. For example, when Drive API is used, it's `api: { name: "drive", version: "v3" }`. When `version` is not used, the latest version is automatically used.
- `requests`: (Required) Please set `method`, `endpoint`, and `requestBody` of Google API you want to use. For example, when you want to change the filename of the file on Google Drive, the above sample script can be used.
- `skipError`: (Option) When this is `true`, even when an error occurs in the request, the error is skipped. The default is `false`. So, when an error occurs, the script is stopped.
- `returnRawData`: (Option) In the case of batch requests, the returned values are text data as the default. When this option is `true`, the returned value is not parsed. Namely, you can retrieve the raw text data. The default is `false`. So, as the default, the returned values are parsed.

<a name="getbatchpath"></a>

## 2. GetBatchPath(obj)

Get batch path. The batch path is required to be used from August 12, 2020. [Ref](https://developers.google.com/drive/api/guides/performance#batch-requests) For example, when Drive API is used with the batch requests, the batch path is `batch/drive/v3`.

### Sample script

In this case, `batch/drive/v3` is obtained as the response value.

```javascript
const { GetBatchPath } = require("gbatchrequests");

const obj = { api: { name: "drive", version: "v3" } };
GetBatchPath(obj)
  .then((res) => console.log(res))
  .catch((err) => console.error(err));
```

- `api: { name: "###", version: "###" }`: (Required) Please set the API name and the API version you want to use. For example, when Drive API is used, it's `api: { name: "drive", version: "v3" }`. When `version` is not used, the latest version is automatically used.

# Limitations for batch request

There are some limitations to the batch request.

- In the current stage, the batch request can be used for the following APIs. The number of requests which can be used in one batch request has limitations for each API. Please check the detailed information from the following links.

  - Calendar API: [https://developers.google.com/calendar/batch](https://developers.google.com/calendar/batch)
  - Cloud Storage: [https://cloud.google.com/storage/docs/json_api/v1/how-tos/batch](https://cloud.google.com/storage/docs/json_api/v1/how-tos/batch)
  - Directory API: [https://developers.google.com/admin-sdk/directory/v1/guides/batch](https://developers.google.com/admin-sdk/directory/v1/guides/batch)
  - Drive API: [https://developers.google.com/drive/v3/web/batch](https://developers.google.com/drive/v3/web/batch)
  - Gmail API: [https://developers.google.com/gmail/api/guides/batch](https://developers.google.com/gmail/api/guides/batch)

- At Batch request, it can include only one kind of API in the requests. For example, Drive API and Gmail API cannot be used for one batch request. Only one API can be used. So as a sample, you can rename the filenames of several files using Drive API by one batch request.

- In the batch requests, there are the maximum requests in one batch request. For example, in the case of Drive API, 100 API requests can be run as one API call using the batch requests. In this case, please check the official document of each API you want to use.

- The batch request is worked by asynchronous processing. So the order of request is not guaranteed.

# About how to retrieve access token

## Retrieving access token from OAuth2 with Quickstart

When Quickstart of Node.js for Drive API is seen, you can see `const drive = google.drive({version: 'v3', auth: authClient});`. [Ref](https://developers.google.com/drive/api/quickstart/nodejs) In this sample, the access token is retrieved from `authClient`.

```javascript
const accessToken = authClient.credentials.access_token;
```

## Retrieving access token from Service account

When the access token is retrieved from the service account, you can retrieve the access token using the following script.

```javascript
const accessToken = await new google.auth.GoogleAuth({
  keyFile: "### file path of service account credential file ###",
  scopes: ["### Scopes you want to use ###"],
}).getAccessToken();
```

---

<a name="licence"></a>

# Licence

[MIT](LICENCE)

<a name="author"></a>

# Author

[Tanaike](https://tanaikech.github.io/about/)

If you have any questions and commissions for me, feel free to tell me.

<a name="updatehistory"></a>

# Update History

- v1.0.0 (October ##, 2022)

  1. Initial release.

[TOP](#top)

```

```
