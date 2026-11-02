import {
    IconHistory,
    IconMapPin,
    IconSettings,
    IconTag,
    IconUserCircle,
    IconUsers,
    IconUsersGroup,
    type Icon,
} from "@tabler/icons-react";

type NavItem = { href: string; label: string; icon: Icon };
type NavGroup = { label: string; items: NavItem[] };

// Every page in the admin sidebar, grouped the way the sidebar shows them. The breadcrumb reads its labels from here too.
export const groups: NavGroup[] = [
    {
        label: "Personal",
        items: [{ href: "/profile", label: "My profile", icon: IconUserCircle }],
    },
    {
        label: "Platform",
        items: [
            { href: "/staff", label: "Staff", icon: IconUsers },
            { href: "/customers", label: "Customers", icon: IconUsersGroup },
            { href: "/pricing", label: "Pricing", icon: IconTag },
        ],
    },
    {
        label: "Operations",
        items: [
            { href: "/locations", label: "Locations", icon: IconMapPin },
        ],
    },
    {
        label: "System",
        items: [
            { href: "/settings", label: "Settings", icon: IconSettings },
            { href: "/logs", label: "Audit logs", icon: IconHistory },
        ],
    },
];

// The browser shows /staff, but after the proxy's rewrite the router may report /admin/staff, so compare without it.
export const adminPath = (pathname: string) => pathname.replace(/^\/admin(?=\/|$)/, "") || "/";

export const isActive = (pathname: string, href: string) => {
    const path = adminPath(pathname);
    return path === href || path.startsWith(`${href}/`);
};

// The current page and the group it sits in, for the breadcrumb.
export const findNavItem = (pathname: string): { group: NavGroup; item: NavItem } | undefined => {
    for (const group of groups) {
        const item = group.items.find((item) => isActive(pathname, item.href));
        if (item) return { group, item };
    }
};
