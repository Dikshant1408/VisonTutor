import { AuthGuard } from './components/AuthGuard';
import { TutorInterface } from './components/TutorInterface';

export default function App() {
  return (
    <AuthGuard>
      <TutorInterface />
    </AuthGuard>
  );
}
