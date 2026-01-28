// Changelog data based on Git commit history
// User-facing changes only: features and bug fixes

export const changelog = [
    {
        version: "1.9.0",
        date: "2026-01-27",
        changes: [
            "Added currency trend charts"
        ]
    },
    {
        version: "1.8.0",
        date: "2026-01-26",
        changes: [
            "New Searchable Currency Select using Headless UI",
            "Fixed Light/Dark mode theming for dropdowns and mobile menu",
            "Added comprehensive list of currency names",
            "Dashboard now auto-refreshes on currency change",
            "Standardized CSS variables in Design System"
        ]
    },
    {
        version: "1.7.0",
        date: "2026-01-22",
        changes: [
            "New Dashboard with interactive charts (Trend, Category Pie, Budget Progress)",
            "Implemented Backend Analytics Module (Aggregation with MongoDB Pipelines)",
            "Added Weekly/Monthly/Yearly trend analysis granularity",
            "Redesigned Records page with modal-based editing",
            "Improved UI consistency for Expenses, Incomes, Budgets, and Subscriptions",
            "Updated button styling and glassmorphism effects",
            "Enhanced empty state displays for record lists"
        ]
    },
    {
        version: "1.6.0",
        date: "2026-01-16",
        changes: [
            "Refined glassmorphism effects with adjustable opacity",
            "Fixed NavBar shadow visibility in light/dark modes",
            "Fixed nav-active indicator visibility across themes",
            "Fixed text colors on Records page for theme compatibility",
            "Added detailed CSS comments for theme customization"
        ]
    },
    {
        version: "1.5.0",
        date: "2026-01-10",
        changes: [
            "Improved caching system with React Query",
            "Fixed profile page cache issues",
            "Dashboard and Records now remember selected date"
        ]
    },
    {
        version: "1.4.0",
        date: "2026-01-07",
        changes: [
            "Added automatic logout on token expiration",
            "Support for all currencies in profile and signup",
            "Added currency conversion pairs feature",
            "Added currency swap button",
            "Display exchange rate update times"
        ]
    },
    {
        version: "1.3.0",
        date: "2026-01-06",
        changes: [
            "Added Dark Mode support",
            "Added Income tracking module",
            "Fixed various bugs"
        ]
    },
    {
        version: "1.2.0",
        date: "2026-01-05",
        changes: [
            "Improved category icon display",
            "Updated category icons to detailed style",
            "Enhanced navigation bar logic"
        ]
    },
    {
        version: "1.1.0",
        date: "2026-01-04",
        changes: [
            "Fixed button animations",
            "Redesigned homepage",
            "Improved subscription renewal date calculation",
            "Added page transition animations"
        ]
    },
    {
        version: "1.0.1",
        date: "2026-01-01",
        changes: [
            "Filter expenses by month and year in Records page"
        ]
    },
    {
        version: "1.0.0",
        date: "2025-12-30",
        changes: [
            "Enhanced budget enforcement and alerts",
            "Added user profile page with password update",
            "Implemented default currency feature",
            "Added currency conversion module",
            "Fixed timezone and crash issues"
        ]
    },
    {
        version: "0.9.0",
        date: "2025-12-29",
        changes: [
            "Added expense tracking module",
            "Added budget analytics",
            "Added subscription management",
            "Integrated API with frontend",
            "Initial release"
        ]
    }
]
