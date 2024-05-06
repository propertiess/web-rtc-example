import React from 'react';
// @ts-expect-error
// решение ошибки global is not defined
import SimplePeer from 'simple-peer/simplepeer.min.js';
import { Instance as PeerInstance, SignalData } from 'simple-peer';
import { io } from 'socket.io-client';
import { useToast } from './components/ui/use-toast';

const socket = io('http://localhost:5000');

export const useWebRTC = (props: { myName: string }) => {
  const [myId, setMyId] = React.useState('');
  const [stream, setStream] = React.useState<MediaStream>();

  const [callerId, setCallerId] = React.useState('');
  const [callerName, setCallerName] = React.useState('');
  const [callerSignal, setCallerSignal] = React.useState<SignalData>();

  const [isConnectedCall, setIsConnectedCall] = React.useState(false);
  const [isCalledToMe, setIsCalledToMe] = React.useState(false);

  const myVideo = React.useRef<HTMLVideoElement>(null);
  const userVideo = React.useRef<HTMLVideoElement>(null);
  const connectionRef = React.useRef<PeerInstance>();

  const callUser = (id: string) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    }) as PeerInstance;

    peer.on('signal', data => {
      socket.emit('callUser', {
        from: myId,
        userToCall: id,
        name: props.myName,
        signalData: data,
      });
    });

    peer.on('stream', stream => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    socket.on('callAccepted', signal => {
      setIsConnectedCall(true);
      peer.signal(signal);
    });

    peer.on('close', () => {
      socket.off('callAccepted');
    });

    connectionRef.current = peer;
  };

  const onConnect = () => {
    setIsCalledToMe(false);
    setIsConnectedCall(true);

    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    }) as PeerInstance;

    peer.on('signal', data => {
      socket.emit('answerCall', { signal: data, to: callerId });
    });

    peer.on('stream', stream => {
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
      }
    });

    peer.signal(callerSignal!);
    connectionRef.current = peer;
  };

  const onDisconnect = () => {
    setIsConnectedCall(false);
    socket.emit('userDisconnect');
    connectionRef.current?.destroy();
  };

  const { toast } = useToast();

  React.useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        if (myVideo.current) {
          myVideo.current.srcObject = stream;
        }
      });

    socket.on('me', id => {
      setMyId(id);
    });

    socket.on(
      'callUser',
      (data: { from: string; name: string; signal: SignalData }) => {
        setIsCalledToMe(true);
        setCallerId(data.from);
        setCallerName(data.name);
        setCallerSignal(data.signal);
      }
    );

    socket.on('callEnded', () => {
      setIsConnectedCall(false);
      connectionRef.current?.destroy();
    });

    socket.on('userNotFound', () => {
      toast({
        title: 'User is not found',
      });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, []);

  return {
    state: {
      id: myId,
      isConnectedCall,
      isCalledToMe,
      stream,
      callerName,
    },
    refs: {
      myVideo,
      userVideo,
    },
    events: {
      callUser,
      onConnect,
      onDisconnect,
    },
  };
};
