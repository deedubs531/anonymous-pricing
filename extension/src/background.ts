// Background: keeps history, shares checks when the person has chosen to, opens the welcome page once.
import { submit } from '../../shared/submit';
import { addHistory, entryFor, getSettings, installId, type Message } from './settings';

/** Pages shared in the last 6 hours, so revisiting a product doesn't count it twice. */
const recentlyShared = new Map<string, number>();
const SIX_HOURS = 6 * 3_600_000;

async function share(url: string, draft: Extract<Message, { type: 'share' }>['draft']): Promise<{ shared: boolean; message: string }> {
  const key = url.split(/[?#]/)[0];
  const last = recentlyShared.get(key);
  if (last && Date.now() - last < SIX_HOURS) return { shared: true, message: 'Already shared' };
  const result = await submit({ ...draft, source: 'extension', install: await installId() });
  if (result.ok) recentlyShared.set(key, Date.now());
  return { shared: result.ok, message: result.message };
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') void chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
});

chrome.runtime.onMessage.addListener((msg: Message, _sender, reply) => {
  (async () => {
    if (msg.type === 'checked') {
      const { share: auto } = await getSettings();
      const result = auto && msg.draft ? await share(msg.url, msg.draft) : undefined;
      await addHistory(entryFor(msg.url, msg.verdict, msg.draft, result?.shared ?? false));
      return result?.message;
    }
    if (msg.type === 'share') return (await share(msg.url, msg.draft)).message;
    return undefined;
  })().then(reply, () => reply(undefined));
  return true; // reply asynchronously
});
