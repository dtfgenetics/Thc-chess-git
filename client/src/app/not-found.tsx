export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="text-2xl font-bold">Match Not Found</div>
      <div className="max-w-md text-xl text-base-content/70">
        This grow room may have closed, expired, or used an invalid invite link.
      </div>
    </div>
  );
}
