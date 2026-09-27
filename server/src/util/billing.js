const { Prisma } = require("../generated/prisma");

const Decimal = Prisma.Decimal;

/**
 * Billing Engine Karaoke
 *
 * Aturan:
 * - Room       : tax + service
 * - F&B        : tax + service
 * - Package    : tax + service
 * - Companion  : TIDAK tax + service
 * - Discount   : hanya room
 */
function calculateBilling({
  roomTotal = 0,
  fnbTotal = 0,
  packageTotal = 0,
  companionTotal = 0,
  discPercent = 0,
  taxPercent = 10,
  servicePercent = 5,
}) {
  const room = new Decimal(roomTotal);
  const fnb = new Decimal(fnbTotal);
  const pkg = new Decimal(packageTotal);
  const companion = new Decimal(companionTotal);

  const discountPercent = new Decimal(discPercent);

  const taxRate = new Decimal(taxPercent);
  const serviceRate = new Decimal(servicePercent);

  // ==================================================
  // DISCOUNT ROOM SAJA
  // ==================================================

  const discountAmount = room.mul(discountPercent).div(100);

  const roomAfterDiscount = room.sub(discountAmount);

  // ==================================================
  // SUBTOTAL
  // ==================================================

  const subTotal = roomAfterDiscount.add(fnb).add(pkg).add(companion);

  // ==================================================
  // DASAR TAX & SERVICE
  //
  // Companion TIDAK masuk dasar tax/service
  // ==================================================

  const taxableSubtotal = roomAfterDiscount.add(fnb).add(pkg);

  // ==================================================
  // TAX
  // ==================================================

  const tax = taxableSubtotal.mul(taxRate).div(100);

  // ==================================================
  // SERVICE
  // ==================================================

  const service = taxableSubtotal.mul(serviceRate).div(100);

  // ==================================================
  // GRAND TOTAL
  // ==================================================

  const grandTotal = subTotal.add(tax).add(service);

  return {
    roomTotal: room,
    discPercent: discountPercent,
    disAmount: discountAmount,

    fnbTotal: fnb,
    packageTotal: pkg,
    companionTotal: companion,

    subTotal,
    tax,
    service,
    grandTotal,
  };
}

module.exports = {
  calculateBilling,
};
