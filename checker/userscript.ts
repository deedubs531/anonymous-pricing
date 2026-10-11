// Userscript entry: shows a small "Price check" button on pages that publish a product price.
import { extractPrice } from './extract';
import { runPriceCheck } from './ui';

const BUTTON_ID = 'who-pays-more-price-button';

function button(): HTMLButtonElement {
  const b = document.createElement('button');
  b.id = BUTTON_ID;
  b.type = 'button';
  b.textContent = 'Price check';
  b.setAttribute(
    'style',
    'all:initial;position:fixed;z-index:2147483646;left:12px;bottom:12px;padding:8px 14px;border-radius:999px;' +
      'background:#b4361f;color:#fff;font:600 14px -apple-system,BlinkMacSystemFont,system-ui,sans-serif;' +
      'box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;',
  );
  b.addEventListener('click', () => {
    b.remove();
    void runPriceCheck();
  });
  return b;
}

let lastUrl = '';

/** Show the button only on product pages; stores that change pages without reloading are rechecked. */
function update(): void {
  if (location.href === lastUrl) return;
  lastUrl = location.href;
  document.getElementById(BUTTON_ID)?.remove();
  if (extractPrice(document)) document.documentElement.append(button());
}

update();
setInterval(update, 2000);
