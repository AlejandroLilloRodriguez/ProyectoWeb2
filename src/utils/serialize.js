function normalizeValue(value) {
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (value instanceof Date) return value.toISOString();

  if (value && typeof value === 'object') {
    if (typeof value.toHexString === 'function') return value.toHexString();

    const normalized = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === '_id') {
        normalized.id = normalizeValue(nestedValue);
      } else if (key !== '__v') {
        normalized[key] = normalizeValue(nestedValue);
      }
    }
    return normalized;
  }

  return value;
}

function serializeDoc(doc) {
  if (!doc) return doc;

  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return normalizeValue(obj);
}

function serializeMany(docs) {
  return docs.map(serializeDoc);
}

module.exports = { serializeDoc, serializeMany };
