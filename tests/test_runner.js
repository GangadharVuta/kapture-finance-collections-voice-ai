/**
 * Automated Test Runner for Maya Voice AI Collections Webhooks
 */
const http = require('http');
const testCases = require('./test_cases.json');

const SERVER_HOST = 'localhost';
const SERVER_PORT = process.env.PORT || 3000;

function sendPostRequest(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log(`\n=======================================================`);
  console.log(`  RUNNING AUTOMATED VOICE AI TOOL WEBHOOK SUITE`);
  console.log(`  Target Server: http://${SERVER_HOST}:${SERVER_PORT}`);
  console.log(`=======================================================\n`);

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const suite of testCases) {
    console.log(`\n🔹 Scenario [${suite.scenario_id}]: ${suite.name}`);
    console.log(`   Description: ${suite.description}`);

    for (const toolCall of suite.tool_calls) {
      totalTests++;
      const payload = {
        message: {
          type: "tool-calls",
          toolCalls: [
            {
              id: `call_${Math.floor(Math.random()*10000)}`,
              type: "function",
              function: {
                name: toolCall.name,
                arguments: toolCall.arguments
              }
            }
          ]
        }
      };

      try {
        const response = await sendPostRequest('/webhook', payload);
        const resultItem = response.body?.results?.[0];
        const parsedResult = typeof resultItem?.result === 'string' ? JSON.parse(resultItem.result) : resultItem?.result;

        const isSuccess = response.statusCode === 200 && parsedResult?.status === toolCall.expected_status;
        if (toolCall.expected_verified !== undefined) {
          if (parsedResult?.verified !== toolCall.expected_verified) {
            console.log(`   ❌ FAIL: ${toolCall.name} - Expected verified=${toolCall.expected_verified}, Got verified=${parsedResult?.verified}`);
            failedTests++;
            continue;
          }
        }

        if (isSuccess) {
          console.log(`   ✅ PASS: ${toolCall.name} -> Status: ${parsedResult?.status} | Msg: "${parsedResult?.message}"`);
          passedTests++;
        } else {
          console.log(`   ❌ FAIL: ${toolCall.name} -> Unexpected output:`, JSON.stringify(response.body));
          failedTests++;
        }
      } catch (err) {
        console.log(`   ❌ ERROR executing ${toolCall.name}:`, err.message);
        failedTests++;
      }
    }
  }

  console.log(`\n=======================================================`);
  console.log(`  TEST RESULTS SUMMARY`);
  console.log(`  Total Tool Validations: ${totalTests}`);
  console.log(`  Passed:                 ${passedTests}`);
  console.log(`  Failed:                 ${failedTests}`);
  console.log(`  Success Rate:           ${((passedTests/totalTests)*100).toFixed(1)}%`);
  console.log(`=======================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
