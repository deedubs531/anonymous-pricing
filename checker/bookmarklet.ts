// Bookmarklet entry: runs the check as soon as it's tapped, with an optional Share button.
import { API_URL } from '../shared/config';
import { installId, submit } from '../shared/submit';
import { runPriceCheck, type Sharer } from './ui';

const share: Sharer = async (draft) => (await submit({ ...draft, source: 'bookmarklet', install: installId(localStorage) })).message;

void runPriceCheck(API_URL ? share : undefined);
