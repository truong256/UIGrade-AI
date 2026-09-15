export const AUTHENTICATED_ROLES = ["student", "lecturer", "admin"] as const;

export type AuthenticatedRole = (typeof AUTHENTICATED_ROLES)[number];

const ADMIN_ONLY_PATHS = ["/ui/server_config"];
const LECTURER_ONLY_PATHS = ["/ui/assignment_library", "/ui/grading_detail"];
const LECTURER_MUTATION_PATHS = ["/ui/create_assignment"];
const STUDENT_ONLY_PATHS = ["/ui/submit_assignment", "/ui/my_results"];

function matchesPath(pathname: string, paths: readonly string[]): boolean {
    return paths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

export function isAuthenticatedRole(role: unknown): role is AuthenticatedRole {
    return typeof role === "string" && AUTHENTICATED_ROLES.includes(role as AuthenticatedRole);
}

/** Normalize only the legacy database alias; unknown roles never become student. */
export function authenticatedProfileRole(role: unknown): AuthenticatedRole | null {
    if (role === "teacher") return "lecturer";
    return isAuthenticatedRole(role) ? role : null;
}

export function dashboardForRole(role: AuthenticatedRole): string {
    void role;
    return "/ui/dashboard";
}

export function isRouteAllowedForRole(
    pathname: string,
    role: AuthenticatedRole
): boolean {
    if (matchesPath(pathname, ADMIN_ONLY_PATHS)) return role === "admin";
    if (matchesPath(pathname, LECTURER_MUTATION_PATHS)) return role === "lecturer";
    if (matchesPath(pathname, LECTURER_ONLY_PATHS)) {
        return role === "lecturer" || role === "admin";
    }
    if (matchesPath(pathname, STUDENT_ONLY_PATHS)) {
        return role === "student";
    }
    return true;
}
