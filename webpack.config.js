const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin"); // Import Webpack's Module Federation Plugin
const mf = require("@angular-architects/module-federation/webpack"); // Import Angular-specific module federation utilities
const path = require("path"); // Node.js module to handle file and directory paths
const share = mf.share; // Shortcut for the share helper function

// SharedMappings is used to share TypeScript path mappings across projects
const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, 'tsconfig.json'), // Path to the tsconfig.json file
  [/* Add mapped paths here to share common modules */]
);

module.exports = {
  output: {
    uniqueName: "remoteApp", // Ensures the output has a unique name to avoid conflicts when multiple remotes are loaded
    publicPath: "auto" // Automatically determines the public path based on the current URL
  },
  optimization: {
    runtimeChunk: false // Disables creating a separate runtime chunk, simplifying module federation integration
  },
  resolve: {
    alias: {
      ...sharedMappings.getAliases(), // Adds TypeScript path aliases registered in sharedMappings
    }
  },
  experiments: {
    outputModule: true // Enables Webpack's experimental support for outputting ES modules
  },
  plugins: [
    // Module Federation configuration for the 'aboutApp' remote
    new ModuleFederationPlugin({
      library: { type: "module" }, // Specifies that the remote module is an ES module

      name: "aboutApp", // Unique name for the remote module
      filename: "aboutEntry.js", // The entry file for the remote, will be loaded by the host application

      exposes: {
        './Module': './src/app/about/about.module.ts', // Exposes the About module to be used by other apps
      },

      shared: share({
        "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Ensures only one instance of @angular/core is loaded
        "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Singleton for @angular/common
        "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Singleton for HTTP client
        "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Singleton for Angular Router

        ...sharedMappings.getDescriptors() // Include shared TypeScript paths
      })
    }),

    // Module Federation configuration for the 'homeApp' remote
    new ModuleFederationPlugin({
      library: { type: "module" }, // ES module output

      name: "homeApp", // Unique name for the home module
      filename: "homeEntry.js", // Entry file for this remote

      exposes: {
        './Module': './src/app/home/home.module.ts', // Exposes the Home module
      },

      shared: share({
        "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Singleton pattern to prevent duplicate instances
        "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },

        ...sharedMappings.getDescriptors() // Include any shared mapped paths
      })
    }),

    // Adds the sharedMappings plugin to Webpack to handle path aliasing
    sharedMappings.getPlugin()
  ]
};
