import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '@/lib/session';

export default function SignIn() {
  const navigate = useNavigate();
  const [name, setName] = useState('Alex Agent');

  function submit(e: FormEvent) {
    e.preventDefault();
    signIn(name.trim() || 'Agent');
    navigate('/', { replace: true });
  }

  return (
    <div className="signin">
      <form onSubmit={submit} className="stack card">
        <h1>Fernway Helpdesk</h1>
        <label>
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" className="primary">Sign in</button>
      </form>
    </div>
  );
}
