"use client";
export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-16 max-w-xl p-8">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 break-words text-sm text-navy/70">{error.message || "The dashboard could not be loaded."}</p>
      <div className="mt-5 flex gap-3">
        <button className="btn-primary" onClick={reset}>Try Again</button>
        <form action="/auth/signout" method="post"><button className="btn-secondary">Log Out</button></form>
      </div>
    </div>
  );
}
