module.exports = function(api) {
  api.cache(true);
  
  const isProd = process.env.NODE_ENV === 'production';
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Plugins appliqués en développement et production
      '@babel/plugin-proposal-export-namespace-from',
      
      // Conditionnellement supprimer les consoles en production
      isProd && ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ].filter(Boolean),
    env: {
      production: {
        // Configuration spécifique à la production
        plugins: [
          // Plugin pour supprimer le code de développement
          ['transform-remove-console', { exclude: ['error', 'warn'] }],
          
          // Optimisation des imports
          ['babel-plugin-transform-imports', {
            '@expo/vector-icons': {
              transform: '@expo/vector-icons/${member}',
              preventFullImport: true
            }
          }],
        ],
      },
    },
  };
};
