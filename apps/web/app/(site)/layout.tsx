export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1000px] px-4 pt-6 pb-10 sm:px-5 sm:pt-8 sm:pb-12">
        <main>{children}</main>
      </div>
    </div>
  )
}
