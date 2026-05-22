let _modalOpened = false;

export function markModalOpened() {
  _modalOpened = true;
}

export function markModalClosed() {
  _modalOpened = false;
}

export function consumeModalOpened(): boolean {
  const val = _modalOpened;
  _modalOpened = false;
  return val;
}
