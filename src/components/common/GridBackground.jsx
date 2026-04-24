export default function GridBackground({
  className = '',
  lightOpacity = 'opacity-[0.03]',
  darkOpacity = 'dark:opacity-[0.05]',
}) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none ${lightOpacity} ${darkOpacity} ${className}`.trim()}
      style={{
        backgroundImage:
          'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(to right, #3b82f6 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  )
}
