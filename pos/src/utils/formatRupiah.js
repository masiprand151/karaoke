/**
 * Mengembalikan default locale berdasarkan kode mata uang
 * @param {string} currencyCode
 * @returns {string} locale yang direkomendasikan
 */
function getDefaultLocale(currencyCode) {
  const currencyLocaleMap = {
    USD: "en-US",
    IDR: "id-ID",
    EUR: "de-DE",
    JPY: "ja-JP",
    GBP: "en-GB",
    CNY: "zh-CN",
    AUD: "en-AU",
    // Tambahkan mata uang lain sesuai kebutuhan
  };

  return currencyLocaleMap[currencyCode] || "en-US"; // fallback ke en-US
}

/**
 * Convert number to currency format
 * @param {number} amount - Angka yang ingin diformat
 * @param {string} currencyCode - Kode mata uang (misalnya: "USD", "IDR", "EUR")
 * @param {string} [locale] - (Opsional) Locale seperti "en-US" atau "id-ID"
 * @returns {string} - Angka yang sudah diformat dalam bentuk mata uang
 */
export default function formatCurrency(
  amount,
  currencyCode,
  locale = getDefaultLocale(currencyCode),
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}
