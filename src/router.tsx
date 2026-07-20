import {
  createRootRoute, createRoute, createRouter, Outlet, Link, useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { logVisit } from "@/lib/store";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductPage from "@/pages/ProductPage";
import Checkout from "@/pages/Checkout";
import Account from "@/pages/Account";
import Login from "@/pages/Login";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import OrderPage from "@/pages/OrderPage";
import DiscordLogin from "@/pages/DiscordLogin";

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-4 text-muted-foreground">الصفحة غير موجودة</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">الرئيسية</Link>
      </div>
    </div>
  );
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { logVisit(pathname); }, [pathname]);
  return (
    <>
      <div key={pathname} className="page-transition">
        <Outlet />
      </div>
      <Toaster position="top-center" theme="dark" richColors />
    </>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/", component: Home,
    validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }) }),
  createRoute({ getParentRoute: () => rootRoute, path: "/products", component: Products }),
  createRoute({ getParentRoute: () => rootRoute, path: "/product/$id", component: ProductPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/checkout", component: Checkout }),
  createRoute({ getParentRoute: () => rootRoute, path: "/account", component: Account }),
  createRoute({ getParentRoute: () => rootRoute, path: "/login", component: Login }),
  createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: Auth }),
  createRoute({ getParentRoute: () => rootRoute, path: "/dashboard", component: Dashboard }),
  createRoute({ getParentRoute: () => rootRoute, path: "/order/$id", component: OrderPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/discord-login", component: DiscordLogin }),
];

const routeTree = rootRoute.addChildren(routes);
export const router = createRouter({ routeTree, defaultPreload: "intent" });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router }
}
