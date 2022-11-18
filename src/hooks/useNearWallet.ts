import { useCallback, useEffect, useState } from 'react';
import {
  InjectedAPIAccount,
  InjectedAPIConnectParams,
  InjectedAPINetwork,
} from '../types/injectedWallet.types';

const INJECTED_API_INITIALIZED_EVENT_NAME = 'omniWallet#event-initialized';

export const useNearWallet = () => {
  const [hasInjectedWalletInitialized, setHasInjectedWalletInitialized] =
    useState<boolean>(false);

  const [connectedAccounts, setConnectedAccounts] = useState<
    InjectedAPIAccount[] | null
  >(null);

  const [network, setNetwork] = useState<InjectedAPINetwork | null>(null);

  useEffect(() => {
    const initialize = () => {
      setHasInjectedWalletInitialized(true);
    };

    window.addEventListener(INJECTED_API_INITIALIZED_EVENT_NAME, initialize);
    if (window?.near?.omniWallet?.initialized) {
      initialize();
      window.removeEventListener(
        INJECTED_API_INITIALIZED_EVENT_NAME,
        initialize,
      );
    }

    return () => {
      window.removeEventListener(
        INJECTED_API_INITIALIZED_EVENT_NAME,
        initialize,
      );
    };
  }, []);

  useEffect(() => {
    if (hasInjectedWalletInitialized) {
      window.near.omniWallet.on('accountsChanged', ({ accounts }) => {
        console.info('Changing accounts event:', { accounts });
        setConnectedAccounts(accounts);
      });
      window.near.omniWallet.on('networkChanged', ({ network }) => {
        console.info('Changing accounts event:', { network });
        setNetwork(network);
      });

      setConnectedAccounts(window.near.omniWallet.accounts);
      setNetwork(window.near.omniWallet.network);
    }
  }, [hasInjectedWalletInitialized]);

  const connect = useCallback((params?: InjectedAPIConnectParams) => {
    return window.near.omniWallet.connect(params);
  }, []);

  const disconnect = useCallback(() => {
    return window.near.omniWallet.disconnect();
  }, []);

  return {
    initialized: hasInjectedWalletInitialized,
    connectedAccounts,
    network,
    connect,
    disconnect,
  };
};
