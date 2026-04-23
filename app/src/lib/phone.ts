const e164PhonePattern = /^\+[1-9]\d{7,14}$/;

function normalizeEgyptianMobileNumber(digits: string) {
  if (/^201\d{9}$/.test(digits)) {
    return `+${digits}`;
  }

  if (/^01\d{9}$/.test(digits)) {
    return `+20${digits.slice(1)}`;
  }

  if (/^1\d{9}$/.test(digits)) {
    return `+20${digits}`;
  }

  return null;
}

export function isE164PhoneNumber(value: string | null | undefined) {
  return Boolean(value && e164PhonePattern.test(value.trim()));
}

export function normalizePhoneNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withoutChannelPrefix = trimmed.replace(/^whatsapp:/i, "").trim();
  const compact = withoutChannelPrefix.replace(/[\s().-]+/g, "");

  if (isE164PhoneNumber(compact)) {
    return compact;
  }

  if (compact.startsWith("00")) {
    const international = `+${compact.slice(2)}`;

    if (isE164PhoneNumber(international)) {
      return international;
    }
  }

  const digits = compact.replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const egyptianMobile = normalizeEgyptianMobileNumber(digits);

  if (egyptianMobile) {
    return egyptianMobile;
  }

  if (!digits.startsWith("0") && digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return trimmed;
}
