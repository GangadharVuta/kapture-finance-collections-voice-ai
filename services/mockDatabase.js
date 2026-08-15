/**
 * Mock Database Service for Kapture Finance Collections
 */

// Initial mock customer datastore
const customers = {
  "CUST_88392": {
    id: "CUST_88392",
    name: "Rahul Sharma",
    phone: "+919876543210",
    email: "rahul.sharma@example.com",
    verificationCode: "4321", // Last 4 digits of PAN/Aadhaar or DOB 1508
    overdueAmount: 8499,
    overdueDays: 12,
    dueDate: "2026-08-03",
    loanAccountNo: "KF-LN-99201",
    status: "ACTIVE_OVERDUE"
  }
};

// In-memory stores for recorded activity
const ptpStore = [];
const paymentLinksStore = [];
const dispositionsStore = [];
const escalationsStore = [];

/**
 * Mask PII data for secure logging
 */
function maskPII(text) {
  if (!text) return "";
  const str = String(text);
  if (str.length <= 4) return "****";
  return str.substring(0, 2) + "****" + str.substring(str.length - 2);
}

module.exports = {
  // Find customer by ID
  getCustomer(customerId) {
    return customers[customerId] || null;
  },

  // Verify verification code
  verifyCustomer(customerId, verificationCode) {
    const customer = customers[customerId];
    if (!customer) {
      return { verified: false, reason: "Customer not found" };
    }

    const cleanInputCode = String(verificationCode).trim();
    if (cleanInputCode === customer.verificationCode || cleanInputCode === "1508") {
      return {
        verified: true,
        customerName: customer.name,
        overdueAmount: customer.overdueAmount,
        overdueDays: customer.overdueDays,
        dueDate: customer.dueDate,
        loanAccountNo: customer.loanAccountNo
      };
    }

    return { verified: false, reason: "Invalid verification code" };
  },

  // Save Promise to Pay
  savePTP(customerId, ptpDate, ptpAmount, paymentChannel = "UPI_LINK") {
    const ptpRecord = {
      ptpId: `PTP_${Date.now()}`,
      customerId,
      ptpDate,
      ptpAmount: Number(ptpAmount),
      paymentChannel,
      createdAt: new Date().toISOString()
    };
    ptpStore.push(ptpRecord);
    console.log(`[DATABASE] Saved PTP for ${maskPII(customerId)}: ₹${ptpAmount} due on ${ptpDate}`);
    return ptpRecord;
  },

  // Generate and send payment link
  sendPaymentLink(customerId, phoneNumber, amount) {
    const linkId = `lnk_${Math.floor(100000 + Math.random() * 900000)}`;
    const paymentUrl = `https://pay.kapturefinance.com/pay/${linkId}`;
    const linkRecord = {
      linkId,
      customerId,
      phoneNumber: maskPII(phoneNumber),
      amount: Number(amount),
      paymentUrl,
      sentAt: new Date().toISOString(),
      status: "SENT"
    };
    paymentLinksStore.push(linkRecord);
    console.log(`[MOCK_SMS] Payment link sent to ${maskPII(phoneNumber)}: ${paymentUrl}`);
    return linkRecord;
  },

  // Log escalation
  saveEscalation(customerId, reason, callSummary) {
    const record = {
      escalationId: `ESC_${Date.now()}`,
      customerId,
      reason,
      callSummary,
      escalatedAt: new Date().toISOString(),
      status: "ROUTED_TO_AGENT"
    };
    escalationsStore.push(record);
    console.log(`[ESCALATION] Call escalated for ${maskPII(customerId)}: Reason = ${reason}`);
    return record;
  },

  // Log Call Disposition
  saveDisposition(customerId, disposition, notes) {
    const record = {
      dispositionId: `DSP_${Date.now()}`,
      customerId,
      disposition,
      notes,
      loggedAt: new Date().toISOString()
    };
    dispositionsStore.push(record);
    console.log(`[DISPOSITION LOGGED] Customer: ${maskPII(customerId)} | Disposition: ${disposition} | Notes: ${notes}`);
    return record;
  },

  // Debug retrieval of stores
  getAllRecords() {
    return {
      ptps: ptpStore,
      paymentLinks: paymentLinksStore,
      dispositions: dispositionsStore,
      escalations: escalationsStore
    };
  }
};
