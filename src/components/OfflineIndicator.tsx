import { useEffect, useState } from 'react';
import styled from 'styled-components';

const OnlineContainer = styled.div`
  position: fixed;
  bottom: 18px;
  left: 18px;
  display: flex;
  align-items: center;
  background: ${props => props['data-offline'] ? 'rgba(255, 235, 238, 0.95)' : 'rgba(232, 245, 233, 0.95)'};
  border-radius: 999px;
  padding: 0.5rem 1.2rem 0.5rem 0.7rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-width: 140px;
`;

const StatusDot = styled.span<{ offline?: boolean }>`
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${props => props.offline ? '#FF4136' : '#2ECC40'};
  margin-right: 0.7rem;
  box-shadow: 0 0 0 2px #fff;
`;

const OnlineText = styled.p<{ offline?: boolean }>`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.01em;
`;

const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    // Check if the navigator object is available (client-side)
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnlineStatusChange);
      window.addEventListener('offline', handleOnlineStatusChange);
    }

    return () => {
      // Clean up event listeners
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  return (
    <>
      {!isOffline && (
        <OnlineContainer data-offline={false}>
          <StatusDot />
          <OnlineText>You are online</OnlineText>
        </OnlineContainer>
      )}
      {isOffline && (
        <OnlineContainer data-offline={true}>
          <StatusDot offline />
          <OnlineText offline>You are offline</OnlineText>
        </OnlineContainer>
      )}
    </>
  );
};

export default OfflineIndicator;