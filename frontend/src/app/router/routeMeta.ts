/**
 * Route handle types — breadcrumb labels attached to router config for TopBar.
 */

export type RouteHandle = {
  breadcrumb?: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
