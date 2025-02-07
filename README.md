# Guide to Integrating Angular Applications with Module Federation

This guide walks you through integrating two Angular applications using Webpack Module Federation to implement a micro-frontend architecture. By following these steps, you can:

- Dynamically load modules from one application (remote) into another application (host) at runtime.
- Build modular, scalable, and flexible Angular applications.

---

## Overview

### What You Will Do:
1. Create two Angular apps:
   - **Host Application:** Loads and displays content from another app.
   - **Remote Application:** Exposes modules to be used by the host app.
2. Use **Webpack Module Federation** to connect these apps for runtime sharing without pre-bundling.

---

## Prerequisites

- **Angular Version:** 16.0.0
- **Node Version:** Compatible with Angular 16 (e.g., Node.js 18.x or later)

---

## Steps to Set Up the Project

### Step 1: Create Two Angular Projects

1. Create the **Host Application**:

   ```bash
   ng new host-app --routing --style=css
   ```

2. Create the **Remote Application**:

   ```bash
   ng new remote-app --routing --style=css
   ```

### Step 2: Add Module Federation to Both Applications

1. Install the Module Federation package in both apps:

   - For the **Host Application**:
     ```bash
     cd host-app
     ng add @angular-architects/module-federation
     ```

   - For the **Remote Application**:
     ```bash
     cd remote-app
     ng add @angular-architects/module-federation
     ```

### Step 3: Set Up the Remote Application

1. Create the `about.module.ts` in the remote app:

   ```typescript
   import { NgModule } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { RouterModule, Routes } from '@angular/router';

   const routes: Routes = [
     { path: '', component: AboutComponent }
   ];

   @NgModule({
     declarations: [AboutComponent],
     imports: [CommonModule, RouterModule.forChild(routes)]
   })
   export class AboutModule {}
   ```

2. Create the `home.module.ts` in the remote app:

   ```typescript
   import { NgModule } from '@angular/core';
   import { CommonModule } from '@angular/common';
   import { RouterModule, Routes } from '@angular/router';

   const routes: Routes = [
     { path: '', component: HomeComponent }
   ];

   @NgModule({
     declarations: [HomeComponent],
     imports: [CommonModule, RouterModule.forChild(routes)]
   })
   export class HomeModule {}
   ```

3. Expose multiple modules in the remote app:
   Update the `webpack.config.js` file:

   ```javascript
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
      uniqueName: "aboutApp", // Ensures the output has a unique name to avoid conflicts when multiple remotes are loaded
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


   ```

4. Build the remote app:

   ```bash
   ng build remote-app
   ```

### Step 4: Set Up the Host Application

1. Configure the `webpack.config.js` file to reference the remote app:

   ```javascript
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
          uniqueName: "hostApp", // Unique name for the host application to avoid conflicts when loading multiple apps
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
          // Module Federation configuration for the host application
          new ModuleFederationPlugin({
            library: { type: "module" }, // Specifies that the host module is an ES module

            // Configuration for remote applications
            remotes: {
              "aboutApp": "http://localhost:4201/aboutEntry.js", // Remote module exposed by the 'aboutApp' application
              "homeApp": "http://localhost:4201/homeEntry.js" // Remote module exposed by the 'homeApp' application
            },

            shared: share({
              "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Ensures only one instance of @angular/core is loaded
              "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Singleton for @angular/common
              "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Singleton for HTTP client
              "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' }, // Singleton for Angular Router

              ...sharedMappings.getDescriptors() // Include shared TypeScript paths
            })
          }),

          // Adds the sharedMappings plugin to Webpack to handle path aliasing
          sharedMappings.getPlugin()
        ]
      };

    ```

    2. Declare the remote modules in TypeScript:
    Create a `declarations.d.ts` file in the `src` folder:

    ```typescript
    declare module 'aboutApp/Module';
    declare module 'homeApp/Module';
    ```

    3. Dynamically load the remote modules in the host app:

    Update the `app-routing.module.ts` file:

    ```typescript
    import { NgModule } from '@angular/core';
    import { RouterModule, Routes } from '@angular/router';

    const routes: Routes = [
      {
        path: 'about',
        loadChildren: () =>
          import('aboutApp/Module').then(m => m.AboutModule) // Ensure this matches the remote module configuration
      },
      {
        path: 'home',
        loadChildren: () =>
          import('homeApp/Module').then(m => m.HomeModule) // Ensure this matches the remote module configuration
      }
    ];

    @NgModule({
      imports: [RouterModule.forRoot(routes)],
      exports: [RouterModule]
    })
    export class AppRoutingModule {}
   ```

### Step 5: Run the Applications

1. Start the **Remote Application**:

   ```bash
   cd remote-app
   npm run run:all
   ```

2. Start the **Host Application**:

   ```bash
   cd host-app
   ng serve --port 4200
   ```

---

## Key Takeaways

- **Host Application:** The main app that consumes remote modules.
- **Remote Application:** The app that exposes modules for the host app.
- **Webpack Module Federation:** Enables sharing code between apps at runtime.

This approach helps you implement a **micro-frontend architecture** where different teams can develop and deploy parts of an app independently, loaded dynamically at runtime.

## Repo for this exercise:
- **For Host App** - https://github.com/hardik-malvi/host-app-module
- **For Remote App** - https://github.com/hardik-malvi/remote-app-module

---

## License

This project is licensed under the MIT License. See the LICENSE file for more details.