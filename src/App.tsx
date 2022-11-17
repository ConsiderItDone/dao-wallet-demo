import React, { useState } from 'react';
import { useNearWallet } from './hooks/useNearWallet';
import { ClipLoader } from 'react-spinners';

function App() {
  const { connectedAccounts, network, connect } = useNearWallet();

  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isChangingNetwork, setIsChangingNetwork] = useState<boolean>(false);

  const handleConnectAccounts = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('[HandleConnectAccounts]', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectToTestnet = async () => {
    setIsChangingNetwork(true);
    try {
      await connect({ networkId: 'testnet' });
    } catch (error) {
      console.error('[HandleConnectToTestnet]', error);
    } finally {
      setIsChangingNetwork(false);
    }
  };

  const handleConnectToMainnet = async () => {
    setIsChangingNetwork(true);
    try {
      await connect({ networkId: 'mainnet' });
    } catch (error) {
      console.error('[HandleConnectToMainnet]', error);
    } finally {
      setIsChangingNetwork(false);
    }
  };

  const handleConnectToUnsupportedNetwork = async () => {
    setIsChangingNetwork(true);
    try {
      await connect({ networkId: 'random-network-123' });
    } catch (error) {
      console.error('[HandleConnectToUnsupportedNetwork]', error);
    } finally {
      setIsChangingNetwork(false);
    }
  };

  return (
    <div className="bg-[#282c34] min-h-screen text-white">
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col p-5">
          <div className="w-fit mx-auto text-2xl font-bold">
            Connected Accounts
          </div>
          <div className="flex flex-col gap-4 mt-5 w-fit mx-auto">
            {connectedAccounts && connectedAccounts?.length
              ? connectedAccounts.map((account, index) => (
                  <div className="flex justify-center items-center" key={index}>
                    <div className="ml-1">
                      <div className="whitespace-nowrap max-w-[400px] overflow-hidden text-ellipsis text-green-300">
                        Account ID: {account.accountId}
                      </div>
                      <div className="whitespace-nowrap max-w-[400px] overflow-hidden text-ellipsis text-blue-300">
                        Public Key: {account.publicKey?.toString()}
                      </div>
                    </div>
                  </div>
                ))
              : 'No Accounts'}
          </div>
        </div>
        <div className="flex flex-col gap-2 m-auto">
          <button
            onClick={handleConnectAccounts}
            className="mt-2 w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[160px]"
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect Accounts'
            )}
          </button>
        </div>
      </div>
      <div className="h-0.5 bg-gray-500 w-[100%] rounded-[10px]" />
      <div className="grid grid-cols-2 gap-2 w-full">
        <div className="flex flex-col p-5">
          <div className="w-fit mx-auto text-2xl font-bold">Network</div>
          <div className="flex flex-col gap-4 mt-5 w-fit mx-auto">
            {network ? (
              <div className="flex flex-col text-center">
                <div className="text-cyan-300">
                  Network ID: {network.networkId}
                </div>
                <div className="text-amber-300">
                  Node URL: {network.nodeUrl}
                </div>
              </div>
            ) : (
              <div className="text-center">No Network</div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap m-auto gap-4">
          <button
            onClick={handleConnectToTestnet}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isChangingNetwork}
          >
            {isChangingNetwork ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Testnet'
            )}
          </button>
          <button
            onClick={handleConnectToMainnet}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isChangingNetwork}
          >
            {isChangingNetwork ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Mainnet'
            )}
          </button>
          <button
            onClick={handleConnectToUnsupportedNetwork}
            className="mt-2 h-fit w-fit p-2 bg-blue-600 font-bold mx-auto rounded-[10px] hover:opacity-80 disabled:opacity-50 min-w-[250px]"
            disabled={isChangingNetwork}
          >
            {isChangingNetwork ? (
              <ClipLoader color="#FFF" size={20} />
            ) : (
              'Connect To Unsupported'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
