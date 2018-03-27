export default function buildFromPart({ fromName = '', emailAddress }) {
  if (!fromName) return emailAddress;
  return `"${fromName}" <${emailAddress}>`;
}
