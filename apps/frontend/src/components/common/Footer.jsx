function Footer() {
  return (
    <footer className="border-t border-white/10 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 text-sm text-secondary">
        <span>© {new Date().getFullYear()} Barbie Cloud</span>
        <span className="text-slate-500">Frontend scaffold · React + Vite</span>
      </div>
    </footer>
  )
}

export default Footer

