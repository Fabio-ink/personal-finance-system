export function parseOfxText(text) {
  const transactions = [];
  const lines = text.split('\n');
  
  let currentTransaction = null;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.includes('<STMTTRN>')) {
      currentTransaction = {};
    } else if (line.includes('</STMTTRN>')) {
      if (currentTransaction && currentTransaction.creationDate && currentTransaction.amount !== undefined) {
        transactions.push(currentTransaction);
      }
      currentTransaction = null;
    } else if (currentTransaction) {
      if (line.startsWith('<DTPOSTED>')) {
        const val = extractOfxValue(line);
        if (val && val.length >= 8) {
          const y = val.substring(0, 4);
          const m = val.substring(4, 6);
          const d = val.substring(6, 8);
          currentTransaction.creationDate = `${y}-${m}-${d}`;
        }
      } else if (line.startsWith('<TRNAMT>')) {
        const val = extractOfxValue(line);
        if (val) {
          const num = parseFloat(val.replace(',', '.'));
          currentTransaction.amount = Math.abs(num);
          currentTransaction.transactionType = num < 0 ? 'EXPENSE' : 'INCOME';
        }
      } else if (line.startsWith('<MEMO>')) {
        currentTransaction.name = extractOfxValue(line) || 'OFX Transaction';
      } else if (line.startsWith('<FITID>')) {
        currentTransaction.fitId = extractOfxValue(line);
      }
    }
  }

  return transactions;
}

function extractOfxValue(line) {
  const closeTagIndex = line.indexOf('>');
  if (closeTagIndex === -1) return '';
  let val = line.substring(closeTagIndex + 1);
  const openTagIndex = val.indexOf('<');
  if (openTagIndex !== -1) {
    val = val.substring(0, openTagIndex);
  }
  return val.trim();
}
