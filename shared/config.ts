// Where shared checks go. Set by the API_URL environment variable at build time, or by DEPLOYED_API
// below once the API is live (README: "Turn on sharing"). While both are empty, every tool hides or
// explains its Share button.
declare const __API_URL__: string;

const DEPLOYED_API = '';

export const API_URL: string = (typeof __API_URL__ === 'string' && __API_URL__) || DEPLOYED_API;

export const SITE_URL = 'https://deedubs531.github.io/anonymous-pricing/';
export const DASHBOARD_URL = `${SITE_URL}dashboard/`;
