const mem = new Map<string, 'ok' | 'fail'>();

export function markImageOk(url: string) {
  mem.set(url, 'ok');
  try {
    sessionStorage.setItem(`fit-img:${url.slice(-48)}`, 'ok');
  } catch {
    /* */
  }
}

export function markImageFail(url: string) {
  mem.set(url, 'fail');
}

export function wasImageOk(url: string) {
  if (mem.get(url) === 'ok') return true;
  try {
    return sessionStorage.getItem(`fit-img:${url.slice(-48)}`) === 'ok';
  } catch {
    return false;
  }
}
