export default function VerifySuccess() {
  return (
    <div style={{ maxWidth: 720, margin: '64px auto', padding: 20, textAlign: 'center' }}>
      <h1>Email verified</h1>
      <p>Your email address has been verified. You can now sign in.</p>
      <p style={{ marginTop: 16 }}><a href="/auth/login">Go to sign in</a></p>
    </div>
  );
}
export default function VerifySuccess() {
  return (
    <div style={{ maxWidth: 720, margin: '48px auto', padding: 16 }}>
      <h1>Email verified</h1>
      <p>Your email address has been verified. You can now <a href="/auth/login">sign in</a>.</p>
    </div>
  );
}
