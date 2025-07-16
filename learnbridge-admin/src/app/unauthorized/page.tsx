// src/app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You do not have permission to access this administrative area.</p>
      </div>
    </div>
  );
}
