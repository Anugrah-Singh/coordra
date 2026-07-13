import { useState } from 'react';
import { Check, Layers3, X } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { inviteApi } from '../api';
import { Button, Card } from '../components/ui';

export const InvitePage = () => {
  const { token = '' } = useParams();
  const navigate = useNavigate();
  const [action, setAction] = useState<'accept' | 'decline' | null>(null);

  const respond = async (nextAction: 'accept' | 'decline') => {
    setAction(nextAction);
    try {
      if (nextAction === 'accept') {
        await inviteApi.accept(token);
        toast.success('Invitation accepted');
        navigate('/app', { replace: true });
      } else {
        await inviteApi.decline(token);
        toast.success('Invitation declined');
        navigate('/app', { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to process invitation');
    } finally {
      setAction(null);
    }
  };

  return (
    <main className="centered-page">
      <Card className="invite-card">
        <Link className="brand" to="/app">
          <span className="brand__mark"><Layers3 size={20} /></span>
          <span>WorkspaceOS</span>
        </Link>
        <div className="invite-card__icon"><Check size={28} /></div>
        <h1>You have been invited to a workspace</h1>
        <p>
          Accept to add the workspace to your account, or decline to close the
          invitation. You must be signed in with the invited email address.
        </p>
        <div className="button-row button-row--center">
          <Button isLoading={action === 'accept'} onClick={() => void respond('accept')}>
            <Check size={17} /> Accept invitation
          </Button>
          <Button variant="secondary" isLoading={action === 'decline'} onClick={() => void respond('decline')}>
            <X size={17} /> Decline
          </Button>
        </div>
      </Card>
    </main>
  );
};
