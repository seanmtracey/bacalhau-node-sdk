# Bacalhau Node.js SDK

This SDK provides a simple, high-level interface for interacting with a [Bacalhau](https://bacalhau.org) orchestrator from a Node.js application. It allows you to list nodes, submit jobs, query job results, inspect job history, and retrieve agent metadata — all using structured, promise-based methods.

This package is compatible with Bacalhau `v1.7.0` and above.

For the best experience, try it with an [Expanso Cloud](https://cloud.expanso.io) Managed Orchestrator. 🐟

## Getting Started

### Installation

```bash
npm install bacalhau-node-sdk
```

> ⚠️ This module assumes you are using **ES Modules** (`type: "module"` in your `package.json`).

### Example Usage

```js
import fs from 'fs/promises'
import { BacalhauClient } from './bacalhauClient.js'

const client = new BacalhauClient({
  host: process.env.BACALHAU_HOST,
  port: process.env.BACALHAU_PORT,
  useSecure: true,
  accessToken: process.env.BACALHAU_API_TOKEN,
})

const nodeList = await client.listNodes()
const nodeInfo = await client.getNodeInfo(nodeList.Nodes[0].Info.NodeID)

const jobYaml = await fs.readFile('./example.yaml', 'utf-8')
const jobResp = await client.createJob(jobYaml, 'yaml')

const description = await client.describeJob(jobResp.JobID)
const results = await client.getJobResult(jobResp.JobID)

console.log(results)
```

## Client Constructor

```js
const client = new BacalhauClient({
  host: 'your-orchestrator-host',
  port: '1234',
  useSecure: true,
  accessToken: 'your-access-token',
})
```

## Available Methods

Each method returns a `Promise` resolving to a structured object matching [Bacalhau’s API response spec](https://docs.bacalhau.org/cli-api/api/overview).

---

### `listNodes()`
Endpoint: `GET /api/v1/orchestrator/nodes`  
> Lists all active nodes in the Bacalhau network.
```js
const result = await client.listNodes()
```

---

### `getNodeInfo(nodeID)`
Endpoint: `GET /api/v1/orchestrator/nodes/{nodeID}`  
> Fetches detailed information about a specific node.
```js
const result = await client.getNodeInfo("node-id")
```

---

### `createJob(jobSpec, format)`
Endpoint: `PUT /api/v1/orchestrator/jobs`  
> Submits a job to the orchestrator.
- `jobSpec`: YAML or JSON string
- `format`: `"yaml"` or `"json"`
```js
const result = await client.createJob(jobYaml, "yaml")
```

---

### `describeJob(jobID)`
Endpoint: `GET /api/v1/orchestrator/jobs/{jobID}`  
> Retrieves a full description of a submitted job.
```js
const result = await client.describeJob("job-id")
```

---

### `getJobResult(jobID)`
Endpoint: `GET /api/v1/orchestrator/jobs/{jobID}/executions`  
> Fetches the `stdout` output from a completed job.
```js
const result = await client.getJobResult("job-id")
```

---

### `getJobHistory(jobID, parameters)`
Endpoint: `GET /api/v1/orchestrator/jobs/{jobID}/history`  
> Returns a structured timeline of events for a job.
```js
const result = await client.getJobHistory("job-id", {
  since: 0,
  limit: 100,
})
```

---

### `getJobExecutions(jobID)`
Endpoint: `GET /api/v1/orchestrator/jobs/{jobID}/executions`  
> Lists all executions for a specific job.
```js
const result = await client.getJobExecutions("job-id")
```

---

### `isAlive()`
Endpoint: `GET /api/v1/agent/alive`  
> Pings the orchestrator to check if it is alive.
```js
const result = await client.isAlive()
```

---

### `getBacalhauVersion()`
Endpoint: `GET /api/v1/agent/version`  
> Returns the Bacalhau version running on the orchestrator.
```js
const result = await client.getBacalhauVersion()
```

---

### `getAgentNodeInfo()`
Endpoint: `GET /api/v1/agent/node`  
> Retrieves agent-level node info (includes capacity, versions, etc.).
```js
const result = await client.getAgentNodeInfo()
```

---

## License

Apache License Version 2.0

---

Built with ❤️ for Bacalhau operators and JavaScript developers.
