export async function fetchWithBlockHandler(url: string, options: any = {}, onBlock: () => void) {
    const res = await fetch(url, options);
    if (res.status === 403) {
      onBlock();
      throw new Error('Access Blocked');
    }
    return res;
  }
  