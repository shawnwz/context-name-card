export function VersionBadge() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION;
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME;

  return (
    <div className="fixed bottom-1.5 right-2 z-50 pointer-events-none select-none text-[10px] text-black/25 dark:text-white/25">
      v{version}
      {buildTime && ` · ${buildTime.slice(0, 16).replace("T", " ")} UTC`}
    </div>
  );
}
