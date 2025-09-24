export default function SimpleTest() {
  return (
    <div style={{ padding: '20px', fontSize: '24px', color: 'white', background: '#000' }}>
      <h1>Simple Test Page</h1>
      <p>If you can see this, routing is working!</p>
      <p>Current time: {new Date().toISOString()}</p>
    </div>
  )
}