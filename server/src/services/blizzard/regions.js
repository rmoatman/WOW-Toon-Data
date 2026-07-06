// Region-specific hosts and namespaces for the Battle.net API.
// oauth.battle.net serves authorize/token/userinfo for all regions except CN.
const REGIONS = {
  us: { apiHost: 'https://us.api.blizzard.com', locale: 'en_US' },
  eu: { apiHost: 'https://eu.api.blizzard.com', locale: 'en_GB' },
  kr: { apiHost: 'https://kr.api.blizzard.com', locale: 'ko_KR' },
  tw: { apiHost: 'https://tw.api.blizzard.com', locale: 'zh_TW' },
};

const OAUTH_HOST = 'https://oauth.battle.net';

export function regionConfig(region = 'us') {
  const key = String(region).toLowerCase();
  const base = REGIONS[key] || REGIONS.us;
  return {
    region: REGIONS[key] ? key : 'us',
    oauthHost: OAUTH_HOST,
    apiHost: base.apiHost,
    locale: base.locale,
    profileNamespace: `profile-${REGIONS[key] ? key : 'us'}`,
    staticNamespace: `static-${REGIONS[key] ? key : 'us'}`,
    dynamicNamespace: `dynamic-${REGIONS[key] ? key : 'us'}`,
  };
}

export const OAUTH_SCOPES = 'wow.profile';
