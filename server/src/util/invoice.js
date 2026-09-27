async function generateInvoiceNumber(trx) {
  const now = new Date();

  let counter = await trx.transaction.count();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const number = String(counter === 0 ? 1 : counter + 1).padStart(4, "0");

  return `INV-${yyyy}${mm}${dd}-${number}`;
}

module.exports = {
  generateInvoiceNumber,
};
