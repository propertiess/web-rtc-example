import React from 'react';

import { Button } from './components/ui/button';
import { Input } from './components/ui/input';

import { useToast } from './components/ui/use-toast';
import { useWebRTC } from './useWebRTC';

export const App = () => {
  const [myName, setMyName] = React.useState('');
  const [idToCall, setIdToCall] = React.useState('');
  const { toast } = useToast();

  const { state, refs, events } = useWebRTC({
    myName,
  });

  const onShareId = () => {
    navigator.clipboard.writeText(state.id);
    toast({ title: 'Id copied to clipboard' });
  };

  const onCallToUser = () => {
    if (!myName.trim()) {
      toast({ title: 'Please enter your name' });
      return;
    }

    events.callUser(idToCall);
  };

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add('dark');
  }, []);

  return (
    <div className='container'>
      <div className='flex flex-wrap gap-10 mt-4'>
        {state.stream && (
          <video
            ref={refs.myVideo}
            className='w-[300px]'
            playsInline
            muted
            autoPlay
          />
        )}
        {state.isConnectedCall && (
          <video
            ref={refs.userVideo}
            className='w-[300px]'
            playsInline
            autoPlay
          />
        )}
      </div>

      {state.isConnectedCall ? (
        <Button
          className='mt-4'
          variant='outline'
          onClick={events.onDisconnect}
        >
          End Call
        </Button>
      ) : (
        <>
          <div className='flex flex-col gap-2 mt-4 md:w-1/2'>
            <Input
              value={myName}
              onChange={e => setMyName(e.target.value)}
              placeholder='name'
            />
            <Input
              value={idToCall}
              onChange={e => setIdToCall(e.target.value)}
              placeholder='id to call'
            />

            <Button variant='outline' className='mt-4' onClick={onCallToUser}>
              Call
            </Button>
          </div>

          <Button variant='outline' className='mt-4' onClick={onShareId}>
            Share id
          </Button>
        </>
      )}

      {state.isCalledToMe && (
        <div className='mt-4'>
          <h1>{state.callerName} is calling...</h1>
          <Button variant='outline' onClick={events.onConnect}>
            Answer
          </Button>
        </div>
      )}
    </div>
  );
};
