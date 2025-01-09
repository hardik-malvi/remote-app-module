import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: "", loadChildren: () => import('./about/about.module').then(m => m.AboutModule)
  },
  {
    path: "module", loadChildren: () => import('./module/module.module').then(m => m.ModuleModule)
  },
  {
    path: "home", loadChildren: () => import('./home/home.module').then(m => m.HomeModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
