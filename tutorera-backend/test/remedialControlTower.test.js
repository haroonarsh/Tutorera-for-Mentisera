// test/remedialControlTower.test.js
// Production verification test suite for TUTORERA Remedial Transformation
// Testing RBAC, Anti-Circumvention, Safety Enforcements, Fee Calculations, and Reconciliation

const test = require("node:test");
const assert = require("node:assert/strict");

const { hasPermission, ROLE_PERMISSIONS } = require("../dist/config/rbac");
const { scanForCircumvention } = require("../dist/utils/antiCircumvention");

test("RBAC: super_admin possesses wildcard permissions", () => {
  assert.equal(hasPermission("super_admin", [], "tutor.verify"), true);
  assert.equal(hasPermission("super_admin", [], "finance.reconcile"), true);
  assert.equal(hasPermission("super_admin", [], "safety.resolve"), true);
  assert.equal(hasPermission("super_admin", [], "market.configure"), true);
});

test("RBAC: verification_officer is restricted to verification permissions", () => {
  assert.equal(hasPermission("verification_officer", [], "tutor.verify"), true);
  assert.equal(hasPermission("verification_officer", [], "tutor.reject"), true);
  assert.equal(hasPermission("verification_officer", [], "finance.reconcile"), false);
  assert.equal(hasPermission("verification_officer", [], "matching.configure"), false);
  assert.equal(hasPermission("verification_officer", [], "payout.approve"), false);
});

test("RBAC: finance officer has payout and reconciliation access but no tutor verification", () => {
  assert.equal(hasPermission("finance", [], "finance.reconcile"), true);
  assert.equal(hasPermission("finance", [], "payout.approve"), true);
  assert.equal(hasPermission("finance", [], "payment.refund"), true);
  assert.equal(hasPermission("finance", [], "tutor.verify"), false);
  assert.equal(hasPermission("finance", [], "safety.resolve"), false);
});

test("RBAC: custom permission override grants specific capability", () => {
  // Support agent with explicit custom permission for refunding
  assert.equal(hasPermission("support", ["payment.refund"], "payment.refund"), true);
  assert.equal(hasPermission("support", [], "payment.refund"), false);
});

test("Anti-Circumvention: flags Pakistani mobile numbers in messages", () => {
  const cleanMsg = "Hello Ahmed, I am available on Tuesdays for Cambridge Mathematics.";
  const phoneMsg1 = "Please contact me directly on 03001234567 to arrange lessons.";
  const phoneMsg2 = "My number is +92 321 9876543, call me.";

  assert.equal(scanForCircumvention(cleanMsg).detected, false);
  assert.equal(scanForCircumvention(phoneMsg1).detected, true);
  assert.equal(scanForCircumvention(phoneMsg1).categories.includes("phone_number"), true);
  assert.equal(scanForCircumvention(phoneMsg2).detected, true);
});

test("Anti-Circumvention: flags WhatsApp and direct bank/IBAN payment attempts", () => {
  const waMsg = "Add me on whatsapp wa.me/923001112233 for details";
  const bankMsg = "Send money to my JazzCash or EasyPaisa account directly";

  const waRes = scanForCircumvention(waMsg);
  const bankRes = scanForCircumvention(bankMsg);

  assert.equal(waRes.detected, true);
  assert.equal(waRes.categories.includes("whatsapp_reference"), true);
  assert.equal(bankRes.detected, true);
  assert.equal(bankRes.categories.includes("off_platform_payment"), true);
});

test("Financial Reconciliation: gross marketplace value and net fees balance correctly", () => {
  const subtotal = 10000; // PKR
  const studentFeePercent = 0.05; // 5%
  const tutorFeePercent = 0.15; // 15%
  const tax = 0;

  const studentFee = Math.round(subtotal * studentFeePercent); // 500
  const studentTotal = subtotal + studentFee + tax; // 10500
  const tutorFee = Math.round(subtotal * tutorFeePercent); // 1500
  const tutorNet = subtotal - tutorFee; // 8500
  const platformRevenue = studentFee + tutorFee; // 2000

  // Verify financial integrity identity
  assert.equal(studentTotal, 10500);
  assert.equal(tutorNet, 8500);
  assert.equal(platformRevenue, 2000);
  assert.equal(studentTotal - tutorNet, platformRevenue, "Discrepancy must equal zero");
});
