import pkg from './package.json' with { type: 'json' }

export default {
  name: pkg.name,

  triggers: {
    keywords: [
      'tourist attraction',
      'tourist attractions',
      'tourist spot',
      'tourist spots',
      'things to do',
      'places to visit',
      'places to see',
      'landmark',
      'landmarks',
      'sight',
      'sights',
      'point of interest',
      'points of interest',
      'historical place',
      'historical places',
      'historical site',
      'historical sites',
      'historic place',
      'historic places',
      'historic site',
      'historic sites',
      'museum',
      'museums',
      'monument',
      'monuments',
      'viewpoint',
      'viewpoints'
    ]
  },

  query_format: {
    regex: [
      'tourist\\s+(?:attractions?|spots?)\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      'things\\s+to\\s+do\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      'places\\s+to\\s+(?:visit|see)\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      '(?:landmark|landmarks)\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      '(?:sight|sights)\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      'points?\\s+of\\s+interest\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      '(?:historical|historic)\\s+(?:places?|sites?)\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      'museums?\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      'monuments?\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*',

      'viewpoints?\\s+(?:in|near)\\s+HD_LOCATION(__\\w+)?.*'
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