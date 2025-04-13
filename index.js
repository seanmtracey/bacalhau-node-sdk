import fetch from 'node-fetch';
import yaml from 'js-yaml';

export class BacalhauClient {
  constructor({ host, port, useSecure = false, accessToken = '' }) {
    this.host = host;
    this.port = port;
    this.useSecure = useSecure;
    this.accessToken = accessToken;
  }

  get baseUrl() {
    const protocol = this.useSecure ? 'https' : 'http';
    return `${protocol}://${this.host}:${this.port}`;
  }

  async makeRequest(method, path, body = null) {
    const url = `${this.baseUrl}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (this.accessToken && this.useSecure) {
      options.headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (body) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON response: ${text}`);
    }
  }

  static async convertYamlToJson(yamlStr) {
    try {
      const jsonObj = yaml.load(yamlStr);
      return JSON.stringify(jsonObj);
    } catch (err) {
      throw new Error(`YAML parse error: ${err.message}`);
    }
  }

  static wrapJob(jsonStr) {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify({ Job: parsed });
  }

  static constructQueryParams(params = {}) {
    const esc = encodeURIComponent;
    const query = Object.entries(params)
      .map(([k, v]) => `${esc(k.toLowerCase())}=${esc(v)}`)
      .join('&');
    return query ? `?${query}` : '';
  }

  async listNodes() {
    const res = await this.makeRequest('GET', '/api/v1/orchestrator/nodes');
    return res;
  }

  async getNodeInfo(nodeID) {
    const res = await this.makeRequest('GET', `/api/v1/orchestrator/nodes/${nodeID}`);
    return res;
  }

  async describeJob(jobID) {
    if (!jobID) throw new Error(`"JobID" cannot be empty`);
    const res = await this.makeRequest('GET', `/api/v1/orchestrator/jobs/${jobID}`);
    return res;
  }

  async createJob(job, format = 'json') {
    if (format !== 'json' && format !== 'yaml') {
      throw new Error(`format must be "json" or "yaml"`);
    }

    if (format === 'yaml') {
      job = await BacalhauClient.convertYamlToJson(job);
    }

    const parsed = JSON.parse(job);
    if (!parsed.Job) {
      job = BacalhauClient.wrapJob(job);
    }

    const res = await this.makeRequest('PUT', '/api/v1/orchestrator/jobs', job);
    return res;
  }

  async stopJob(jobID, reason = '') {
    const payload = { reason };
    const res = await this.makeRequest('DELETE', `/api/v1/orchestrator/jobs/${jobID}`, payload);
    return res;
  }

  async getJobHistory(jobID, params = {}) {
    const query = BacalhauClient.constructQueryParams(params);
    const res = await this.makeRequest('GET', `/api/v1/orchestrator/jobs/${jobID}/history${query}`);
    return res;
  }

  async getJobResult(jobID) {
    const res = await this.makeRequest('GET', `/api/v1/orchestrator/jobs/${jobID}/executions`);

    if (!res.Items || !Array.isArray(res.Items)) {
      throw new Error('Unexpected job executions response structure');
    }

    for (const item of res.Items) {
      if (item.RunOutput?.Stdout) {
        return {
          JobID: jobID,
          ExecutionID: item.ID,
          Stdout: item.RunOutput.Stdout,
        };
      }
    }

    throw new Error('No executions with stdout found');
  }

  async getJobExecutions(jobID) {
    const res = await this.makeRequest('GET', `/api/v1/orchestrator/jobs/${jobID}/executions`);
    return res;
  }

  async isAlive() {
    const res = await this.makeRequest('GET', '/api/v1/agent/alive');
    return res;
  }

  async getBacalhauVersion() {
    const res = await this.makeRequest('GET', '/api/v1/agent/version');
    return res;
  }

  async getAgentNodeInfo() {
    const res = await this.makeRequest('GET', '/api/v1/agent/node');
    return res;
  }
}
