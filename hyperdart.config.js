import pkg from './package.json' with { type: 'json' }

export default {
  name: pkg.name,

  triggers: {
    keywords: [
      'tourist attraction',
      'tourist attractions',
      'things to do',
      'places to visit',
      'landmarks',
      'sights',
      'points of interest'
    ]
  },

  query_format: {
    regex: [
      'tourist\\s+attractions?\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
      'things\\s+to\\s+do\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
      'places\\s+to\\s+visit\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
      'landmarks\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
      'sights\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*',
      'points\\s+of\\s+interest\\s+(in|near)\\s+HD_LOCATION(__\\w+)?.*'
    ]
  },

  client: {
    location: pkg.module,
    moduleName: pkg.umdName || 'HD' + pkg.name,
    baseURL: '/' + pkg.name,
  },

  format: {
    mainline: true,
    sidebar: true,
    fullscreen: true
  },

  permissions: {},

  info: {}
}