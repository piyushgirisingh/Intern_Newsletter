import type { CrawlTargetGroup } from '../models/article.js';

export const xomeSourceGroups: CrawlTargetGroup[] = [
  {
    name: 'Xome official pages',
    purpose: 'Learn what Xome says about its product, users, and services.',
    targets: [
      {
        title: 'Xome home page',
        url: 'https://www.xome.com/',
        sourceType: 'official-site',
      },
      {
        title: 'Xome auction pages',
        url: 'https://www.xome.com/auctions',
        sourceType: 'official-site',
      },
    ],
  },
  {
    name: 'Real estate learning',
    purpose: 'Collect simple domain context for real-estate terms and workflows.',
    targets: [
      {
        title: 'Consumer Financial Protection Bureau mortgage resources',
        url: 'https://www.consumerfinance.gov/consumer-tools/mortgages/',
        sourceType: 'education',
      },
      {
        title: 'Fannie Mae consumer homeownership resources',
        url: 'https://yourhome.fanniemae.com/',
        sourceType: 'education',
      },
    ],
  },
  {
    name: 'Technical and market updates',
    purpose: 'Find engineering, data, AI, automation, and industry changes that could affect product quality.',
    targets: [
      {
        title: 'Xome newsroom or web search placeholder',
        url: 'https://www.xome.com/',
        sourceType: 'market-update',
      },
    ],
  },
];
