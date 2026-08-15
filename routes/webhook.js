const express = require('express');
const router = express.Router();
const db = require('../services/mockDatabase');

/**
 * Universal Tool Executer Function
 */
function executeTool(name, args) {
  console.log(`[TOOL INVOCATION] Executing function "${name}" with args:`, JSON.stringify(args));
  
  const customerId = args.customer_id || "CUST_88392";

  switch (name) {
    case 'verify_customer': {
      const code = args.verification_code || args.code;
      const result = db.verifyCustomer(customerId, code);
      if (result.verified) {
        return {
          status: "success",
          verified: true,
          customer_name: result.customerName,
          overdue_amount: result.overdueAmount,
          overdue_days: result.overdueDays,
          due_date: result.dueDate,
          loan_account_no: result.loanAccountNo,
          message: "Customer verified successfully. Debt details unlocked."
        };
      } else {
        return {
          status: "failed",
          verified: false,
          reason: result.reason,
          message: "Verification code incorrect. Debt details locked."
        };
      }
    }

    case 'log_promise_to_pay': {
      const ptpDate = args.ptp_date || new Date(Date.now() + 3*86400000).toISOString().split('T')[0];
      const ptpAmount = args.ptp_amount || 8499;
      const record = db.savePTP(customerId, ptpDate, ptpAmount, args.payment_channel);
      return {
        status: "success",
        ptp_id: record.ptpId,
        committed_date: ptpDate,
        committed_amount: ptpAmount,
        message: `Promise to Pay successfully logged for ${ptpDate}.`
      };
    }

    case 'send_payment_link': {
      const phone = args.phone_number || "+919876543210";
      const amount = args.amount || 8499;
      const linkRecord = db.sendPaymentLink(customerId, phone, amount);
      return {
        status: "success",
        payment_url: linkRecord.paymentUrl,
        delivery_status: "SENT_SMS_AND_WHATSAPP",
        message: `Payment link ${linkRecord.paymentUrl} sent successfully via SMS and WhatsApp.`
      };
    }

    case 'escalate_to_agent': {
      const reason = args.reason || "CUSTOMER_REQUEST";
      const summary = args.call_summary || "Call escalated to human agent.";
      const record = db.saveEscalation(customerId, reason, summary);
      return {
        status: "success",
        escalation_id: record.escalationId,
        transfer_number: "+918000998877",
        message: "Escalation ticket logged. Initiating warm SIP transfer to agent."
      };
    }

    case 'mark_disposition': {
      const disposition = args.disposition || "PTP_COLLECTED";
      const notes = args.notes || "Call wrapped up.";
      db.saveDisposition(customerId, disposition, notes);
      return {
        status: "success",
        disposition_logged: true,
        disposition: disposition,
        message: `Call disposition marked as ${disposition}.`
      };
    }

    default:
      return {
        status: "error",
        message: `Unknown tool function name: ${name}`
      };
  }
}

/**
 * Main Webhook POST Endpoint for Vapi
 */
router.post('/webhook', (req, res) => {
  try {
    const payload = req.body;
    console.log("[WEBHOOK RECEIVED] Payload type:", payload?.message?.type || "Direct Function Call");

    // Case 1: Vapi "tool-calls" payload format
    if (payload?.message?.type === 'tool-calls' && Array.isArray(payload.message.toolCalls)) {
      const results = payload.message.toolCalls.map(tc => {
        const toolResult = executeTool(tc.function.name, tc.function.arguments);
        return {
          toolCallId: tc.id,
          result: JSON.stringify(toolResult)
        };
      });

      return res.status(200).json({
        results: results
      });
    }

    // Case 2: Vapi legacy / function-call format
    if (payload?.message?.type === 'function-call' && payload.message.functionCall) {
      const fc = payload.message.functionCall;
      const toolResult = executeTool(fc.name, fc.parameters || fc.arguments);
      return res.status(200).json({
        result: toolResult
      });
    }

    // Case 3: Direct API call format (e.g. from custom test runner or direct curl)
    if (payload?.name) {
      const toolResult = executeTool(payload.name, payload.arguments || payload.parameters || {});
      return res.status(200).json({
        result: toolResult
      });
    }

    // Default response for ping/health verification from Vapi
    return res.status(200).json({
      status: "acknowledged",
      message: "Vapi webhook endpoint active and healthy."
    });

  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

/**
 * Health check GET /webhook handler for browser test
 */
router.get('/webhook', (req, res) => {
  res.status(200).json({
    status: "online",
    service: "Maya Webhook Endpoint",
    message: "Server is ready! Send Vapi tool call POST requests to this URL."
  });
});

module.exports = router;
