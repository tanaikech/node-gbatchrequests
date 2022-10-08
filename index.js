/**
 * @module gbatchrequests
 *
 * Class BatchRequests
 * Achieve batch requests using Google APIs.
 */
class BatchRequests {
  /**
   * @param {object} obj Object for requesting batch requests.
   * @return {}
   */
  constructor(obj) {
    this.https = require("https");
    this.obj = obj;
    this.baseUrl = "https://www.googleapis.com";
    this.boundary = "sampleBoundary12345";
    this.limit = 100;
  }

  /**
   * @param {string} url URL.
   * @param {object} params Object for requesting.
   * @param {object} data Request body.
   * @return {Promise} Promise object.
   */
  _fetch(url, params = {}, data = null) {
    return new Promise((resolve, reject) => {
      const req = this.https.request(url, params, (res) => {
        const ar = [];
        res.on("data", (r) => ar.push(r));
        res.on("end", () => resolve(ar.join("")));
      });
      if (data) req.write(data);
      req.on("error", reject);
      req.end();
    });
  }

  /**
   * Create a request body of batch requests and request it.
   * @param {object[]} requests Requests for batch requests.
   * @returns {Object}
   */
  _createRequestBody(requests) {
    const lb = "\r\n";
    const payload = requests.reduce((r, e, i, a) => {
      r += `Content-Type: application/http${lb}`;
      r += `Content-ID: ${i + 1}${lb}${lb}`;
      r += `${e.method} ${e.endpoint}${lb}`;
      r += e.requestBody
        ? `Content-Type: application/json; charset=utf-8" ${lb}${lb}`
        : lb;
      r += e.requestBody ? `${JSON.stringify(e.requestBody)}${lb}` : "";
      r += `--${this.boundary}${i == a.length - 1 ? "--" : ""}${lb}`;
      return r;
    }, `--${this.boundary}${lb}`);
    return payload;
  }

  /**
   * Parsing response values from batch requests.
   * @param {string} d Response values from batch requests.
   * @returns {Object}
   */
  _parser(d) {
    const temp = d.split("--batch");
    const regex = /{[\S\s]+}/g;
    return temp
      .slice(1, temp.length - 1)
      .map((e) => (regex.test(e) ? JSON.parse(e.match(regex)[0]) : e));
  }

  /**
   * @return {string} batch path
   */
  getBatchPath() {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.obj.api.name) {
          reject("Please set API name you want to search.");
        }
        const url = `${this.baseUrl}/discovery/v1/apis?preferred=${
          this.obj.api.version ? "false" : "true"
        }&name=${encodeURIComponent(this.obj.api.name.toLowerCase())}`;
        const res1 = JSON.parse(await this._fetch(url, { method: "GET" }));
        if (res1.error) {
          res1.result = "Batch path cannot be found.";
          reject(res1);
        }
        if (!res1.items) {
          reject("Batch path cannot be found.");
        }
        const { discoveryRestUrl } =
          (!this.obj.api.version
            ? res1.items[0]
            : res1.items.find((e) => e.version == this.obj.api.version)) || {};
        if (!discoveryRestUrl) {
          reject("Batch path cannot be found.");
        }
        const res2 = JSON.parse(
          await this._fetch(discoveryRestUrl, { method: "GET" })
        );
        if (res2.error) {
          res2.result = "Batch path cannot be found.";
          reject(res2);
        }
        const { batchPath } = res2;
        resolve(batchPath);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Request batch requests.
   *
   * @returns {Object}
   */
  do() {
    return new Promise(async (resolve, reject) => {
      if (!this.obj.hasOwnProperty("accessToken")) {
        reject(
          "Please set 'accessToken' property for requesting API in the input object."
        );
      }
      if (!this.obj.hasOwnProperty("api")) {
        reject("Please set 'api' property in the input object.");
      }
      if (
        !this.obj.hasOwnProperty("requests") ||
        !Array.isArray(this.obj.requests) ||
        this.obj.requests.length == 0
      ) {
        reject("Please set 'requests' property in the input object.");
      }
      const batchPath = await this.getBatchPath().catch((err) => reject(err));
      const { requests } = this.obj;
      let res = [];
      const n = Math.ceil(requests.length / this.limit);
      for (let i = 0; i < n; i++) {
        const requestBody = this._createRequestBody(
          requests.splice(0, this.limit)
        );
        const r = await this._fetch(
          `${this.baseUrl}/${batchPath}`,
          {
            method: "POST",
            headers: {
              "Content-Type": `multipart/mixed; boundary=${this.boundary}`,
              Authorization: `Bearer ${this.obj.accessToken}`,
            },
          },
          requestBody
        );
        const rr = this._parser(r);
        const err = rr.find(({ error }) => error);
        if (err && !this.obj.skipError) {
          reject(r);
        }
        if (this.obj.returnRawData) {
          res.push(r);
        } else {
          res = [...res, ...rr];
        }
      }
      resolve(res);
    });
  }
}

/**
 * Get batch path.
 * @name getBatchPath
 * @param {object} obj Object for requesting batch requests.
 * - Sample of "obj" is as follows.
 * ```javascript
 * const obj = { api: { name: "drive", version: "v3" } };
 * ```
 * @return {Promise} Promise object represents the batch path.
 */
module.exports.GetBatchPath = (obj) =>
  new Promise((resolve, reject) =>
    new BatchRequests(obj).getBatchPath().then(resolve).catch(reject)
  );

/**
 * Run batch requests of Google APIs.
 * @name runBatch
 * @param {object[]} obj Object for requesting batch requests.
 * - Sample of "obj" is as follows.
 * ```javascript
 * const obj = {
 *   skipError: true, // When this is true, even when an error occurs in the request, the error is skipped. Default is false.
 *   returnRawData: true, // When this is true, the returned value are not parsed. Default is false.
 *   accessToken: "###",
 *   api: { name: "drive", version: "v3" },
 *   requests: [
 *     {
 *       method: "PATCH",
 *       endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}`,
 *       requestBody: { name: "sample" },
 *     },
 *     ,
 *     ,
 *     ,
 *   ],
 * };
 * ```
 * @return {Promise} Promise object represents the returned values from batch requests.
 */
module.exports.RunBatch = (obj) =>
  new Promise((resolve, reject) =>
    new BatchRequests(obj).do().then(resolve).catch(reject)
  );
