import { API_URL, DASHBOARD_URL } from '../../shared/config';
import { getSettings, setSettings } from './settings';

const app = document.getElementById('app')!;
const ORIGINS = { origins: ['http://*/*', 'https://*/*'] };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
}

async function render(): Promise<void> {
  const settings = await getSettings();
  // Firefox asks for site access separately; without it nothing can be checked.
  const hasAccess = await chrome.permissions.contains(ORIGINS);
  const choose = async (share: boolean) => {
    await setSettings({ share, chosen: true });
    void render();
  };
  app.replaceChildren(
    el('h1', {}, 'Who Pays More'),
    el('p', {}, 'When you open a product on a store\'s website, this extension loads the same page again as a signed-out visitor, on your same device and connection, and shows a small badge if your price is different.'),
    hasAccess
      ? ''
      : el(
          'p',
          {},
          el('button', { className: 'primary', onclick: async () => (await chrome.permissions.request(ORIGINS)) && render() }, 'Allow it to check store pages'),
          el('br'),
          el('span', { className: 'muted' }, 'Needed to read prices and load the signed-out copy. Nothing is read on pages without a product price.'),
        ),
    el('h2', {}, 'Help build the public picture'),
    el('p', {}, 'Your checks can be added, anonymously, to totals anyone can see: which stores show different prices to different people, and by how much. You can change this any time from the toolbar button.'),
    el(
      'p',
      {},
      el('strong', {}, 'What is shared: '),
      'the store and page address (without anything after a ? or #), the product name the store publishes, your price, the signed-out price, and a random ID for this browser that only counts contributors. The server adds the time and your US state.',
    ),
    el('p', {}, el('strong', {}, 'Never shared: '), 'your name, accounts, email, address, IP address, or any page that isn\'t a product you opened.'),
    API_URL ? '' : el('p', { className: 'muted' }, 'Sharing isn\'t switched on yet; your choice is saved for when it is.'),
    settings.chosen
      ? el('p', {}, el('strong', {}, settings.share ? 'You\'re sharing checks anonymously. Thank you!' : 'Your checks stay on this computer.'), ' ', el('a', { href: '#', onclick: (e: Event) => (e.preventDefault(), choose(!settings.share)) }, settings.share ? 'Stop sharing' : 'Share instead'))
      : el('p', {}, el('button', { className: 'primary', onclick: () => choose(true) }, 'Share anonymously'), ' ', el('button', { onclick: () => choose(false) }, 'Keep my checks private')),
    el('h2', {}, 'What it can\'t check'),
    el('p', {}, 'Apps (Uber, Lyft, Instacart, DoorDash), sites that hide prices until you sign in, and differences by device or location. For apps, use the ', el('a', { href: `${DASHBOARD_URL}../app-check/`, target: '_blank' }, 'two-account check'), '.'),
    el('p', {}, el('a', { href: DASHBOARD_URL, target: '_blank' }, 'See what everyone has found →')),
  );
}

void render();
