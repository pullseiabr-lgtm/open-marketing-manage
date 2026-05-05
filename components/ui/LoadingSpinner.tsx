export default function LoadingSpinner({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gr3)', fontSize: '12px' }}>
      <div style={{
        width: '24px', height: '24px',
        border: '2px solid var(--bk4)', borderTop: '2px solid var(--or)',
        borderRadius: '50%', animation: 'spin .8s linear infinite',
        margin: '0 auto 10px',
      }} />
      {text}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
