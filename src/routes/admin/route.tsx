import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { Toaster } from "@/components/ui/sonner";

// Layout for everything under /admin: auth context + toasts. Public site chrome is hidden in __root.
export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — De-Yula Specialist Hospital" },
      { name: "description", content: "De-Yula Specialist Hospital admin console." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoot,
});

function AdminRoot() {
  return (
    <AdminAuthProvider>
      <Outlet />
      <Toaster position="bottom-right" richColors closeButton />
    </AdminAuthProvider>
  );
}
