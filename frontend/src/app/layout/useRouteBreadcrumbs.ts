/**
 * useRouteBreadcrumbs — derives breadcrumb trail from React Router match handles.
 */

import { useMemo } from "react";
import { useMatches } from "react-router-dom";

import type { BreadcrumbItem } from "../router/routeMeta";
import type { RouteHandle } from "../router/routeMeta";

export function useRouteBreadcrumbs(): BreadcrumbItem[] {
  const matches = useMatches();

  return useMemo(() => {
    const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    matches.forEach((match) => {
      const handle = match.handle as RouteHandle | undefined;
      if (!handle?.breadcrumb) return;

      crumbs.push({
        label: handle.breadcrumb,
        href: match.pathname,
      });
    });

    if (crumbs.length > 0) {
      const last = crumbs[crumbs.length - 1];
      if (last) {
        const { href: _href, ...rest } = last;
        crumbs[crumbs.length - 1] = rest;
      }
    }

    return crumbs;
  }, [matches]);
}
