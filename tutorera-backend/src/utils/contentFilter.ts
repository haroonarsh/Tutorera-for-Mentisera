// Filters out phone numbers, WhatsApp references, and contact details
export const filterContactInfo = (text: string): string => {
  let filtered = text;

  // Remove Pakistani phone numbers (03XX-XXXXXXX, +923XXXXXXXXX, etc)
  filtered = filtered.replace(
    /(\+92|0092|92)?[\s\-]?3[0-9]{2}[\s\-]?[0-9]{7}/g,
    "[phone number removed]"
  );

  // Remove any sequence of 10-11 digits (generic phone)
  filtered = filtered.replace(
    /\b\d[\d\s\-]{8,12}\d\b/g,
    "[number removed]"
  );

  // Remove WhatsApp references
  filtered = filtered.replace(
    /whatsapp|whatsap|watsapp|wa\.me|whats app/gi,
    "[WhatsApp not allowed]"
  );

  // Remove email addresses
  filtered = filtered.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    "[email removed]"
  );

  // Remove social media handles
  filtered = filtered.replace(
    /(@[a-zA-Z0-9_]{2,})/g,
    "[handle removed]"
  );

  // Remove common contact-sharing phrases
  filtered = filtered.replace(
    /(my number is|my phone is|call me at|text me at|reach me at|contact me at|my email|my gmail|my instagram|my facebook)/gi,
    "[contact info not allowed]"
  );

  return filtered;
};

export const containsContactInfo = (text: string): boolean => {
  const patterns = [
    /(\+92|0092|92)?[\s\-]?3[0-9]{2}[\s\-]?[0-9]{7}/,
    /\b\d[\d\s\-]{8,12}\d\b/,
    /whatsapp|whatsap|watsapp|wa\.me/gi,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  ];
  return patterns.some(p => p.test(text));
};