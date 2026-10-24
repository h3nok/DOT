/** Public payment destinations only. Never put credentials in this record. */
export function resolveSupportMethods(config) {
  const methods = [];
  const recipient = config.zelle.recipient.trim();
  const recipientName = config.zelle.recipientName.trim();
  if (recipient || recipientName) {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
    const phone = /^(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/.test(recipient);
    if ((!email && !phone) || !recipientName) {
      throw new Error("Zelle needs a confirmed email or U.S. mobile number and recipient name.");
    }
    methods.push({ id: "zelle", label: "Zelle", recipient, recipientName });
  }
  const cashAppUrl = config.cashApp.url.trim();
  if (cashAppUrl) {
    const url = new URL(cashAppUrl);
    if (url.protocol !== "https:" || url.hostname !== "cash.app" || url.port ||
        url.username || url.password || url.pathname === "/") {
      throw new Error("Cash App needs a confirmed HTTPS payment link on cash.app.");
    }
    methods.push({ id: "cashapp", label: "Cash App", url: url.href });
  }
  return methods.sort((a, b) => Number(b.id === config.preferredMethod) - Number(a.id === config.preferredMethod));
}
